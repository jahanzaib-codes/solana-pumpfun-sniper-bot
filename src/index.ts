import { Connection } from "@solana/web3.js";
import { loadConfig, logger } from "./config";
import { RiskFilterService } from "./services/risk";
import { OrderExecutionService } from "./services/executor";
import { PumpFunScanner } from "./services/scanner";
import { TokenCandidate } from "./types";

function printBanner(): void {
  console.log(`
  ========================================================================
    ⚡ SOLANA PUMP.FUN SNIPER BOT v1.0.0
    ⚡ Jito MEV Bundles | 0-Block Latency | Anti-Rug Guardian
    ⚡ Created by Jahanzaib (https://github.com/jahanzaib-codes)
  ========================================================================
  `);
}

async function main() {
  printBanner();

  const config = loadConfig();
  logger.info({
    rpc: config.rpcEndpoint,
    buyAmount: `${config.buyAmountSol} SOL`,
    slippage: `${config.slippageBps / 100}%`,
    jitoBundles: config.jito.useBundles ? "ENABLED" : "DISABLED",
    simulationMode: config.simulationMode ? "ACTIVE (No real funds)" : "LIVE TRADING"
  }, "Initializing Engine Diagnostics");

  const connection = new Connection(config.rpcEndpoint, {
    wsEndpoint: config.wsEndpoint,
    commitment: "confirmed"
  });

  const riskService = new RiskFilterService(connection, config);
  const executorService = new OrderExecutionService(connection, config);

  // Token detection pipeline
  const onTokenDetected = async (candidate: TokenCandidate) => {
    logger.info(
      {
        mint: candidate.mint.toBase58(),
        symbol: candidate.symbol
      },
      "🔔 New Pump.fun token creation detected"
    );

    // 1. Run Risk & Honeypot Audit
    logger.info("Running automated security audit...");
    const audit = await riskService.auditToken(candidate.mint);

    if (!audit.passed) {
      logger.warn(
        {
          mint: candidate.mint.toBase58(),
          score: audit.score,
          reasons: audit.reasons
        },
        "❌ Token rejected by security filters"
      );
      return;
    }

    logger.info(
      {
        score: `${audit.score}/100`,
        top10Share: `${audit.top10Percentage.toFixed(1)}%`
      },
      "✅ Security audit passed: Proceeding to snipe"
    );

    // 2. Dispatch Order via Jito Bundle
    const result = await executorService.executeSnipe(candidate);
    if (result.success) {
      logger.info(
        {
          signature: result.signature,
          latency: `${result.latencyMs}ms`,
          entryPrice: result.entryPriceSol
        },
        "🎉 Snipe successfully completed!"
      );
    }
  };

  const scanner = new PumpFunScanner(connection, onTokenDetected);
  await scanner.startScanning();

  // Process termination signals
  process.on("SIGINT", () => {
    logger.info("Received interrupt signal. Shutting down...");
    scanner.stopScanning();
    process.exit(0);
  });
}

main().catch((err) => {
  logger.error({ err: err.message }, "Fatal engine exception");
  process.exit(1);
});
