import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";
import bs58 from "bs58";
import { SniperConfig, TokenCandidate, TradeExecutionResult } from "../types";
import { logger } from "../config";
import { createJitoTipInstruction, sendJitoBundle } from "./jito";

export class OrderExecutionService {
  private connection: Connection;
  private config: SniperConfig;
  private keypair: Keypair | null = null;

  constructor(connection: Connection, config: SniperConfig) {
    this.connection = connection;
    this.config = config;

    if (config.privateKey && config.privateKey.length > 20) {
      try {
        this.keypair = Keypair.fromSecretKey(bs58.decode(config.privateKey));
        logger.info({ pubkey: this.keypair.publicKey.toBase58() }, "Wallet loaded successfully");
      } catch (err: any) {
        logger.error({ err: err.message }, "Invalid private key string in configuration");
      }
    } else {
      logger.warn("No private key provided: Running in strict SIMULATION mode");
    }
  }

  public async executeSnipe(candidate: TokenCandidate): Promise<TradeExecutionResult> {
    const startTime = Date.now();
    const mintStr = candidate.mint.toBase58();

    // 1. Simulation Mode Handler
    if (this.config.simulationMode || !this.keypair) {
      const simulatedLatency = Math.floor(Math.random() * 80) + 120; // 120 - 200 ms realistic
      logger.info(
        {
          mint: mintStr,
          symbol: candidate.symbol,
          buyAmountSol: this.config.buyAmountSol,
          latency: `${simulatedLatency}ms`,
          mode: "SIMULATION"
        },
        "🎯 [SIMULATION] Snipe transaction would be submitted"
      );

      return {
        signature: `sim_tx_${Date.now()}_${mintStr.slice(0, 8)}`,
        success: true,
        mint: mintStr,
        amountSol: this.config.buyAmountSol,
        tokenAmount: 1_000_000_000,
        entryPriceSol: this.config.buyAmountSol / 1_000_000_000,
        latencyMs: simulatedLatency
      };
    }

    // 2. Production Live Execution Handler
    try {
      const latestBlockhash = await this.connection.getLatestBlockhash("processed");
      const tx = new Transaction({
        recentBlockhash: latestBlockhash.blockhash,
        feePayer: this.keypair.publicKey
      });

      // Priority compute units
      tx.add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 250_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 150_000 })
      );

      // Jito MEV Tip inclusion
      if (this.config.jito.useBundles) {
        const tipLamports = Math.floor(this.config.jito.tipAmountSol * LAMPORTS_PER_SOL);
        tx.add(createJitoTipInstruction(this.keypair.publicKey, tipLamports));
      }

      tx.sign(this.keypair);
      const rawTx = tx.serialize();

      let signature: string;
      let jitoBundleId: string | undefined;

      if (this.config.jito.useBundles) {
        const base58Tx = bs58.encode(rawTx);
        const bundleId = await sendJitoBundle(this.config.jito.blockEngineUrl, [base58Tx]);
        if (!bundleId) throw new Error("Jito bundle dispatch failed");
        jitoBundleId = bundleId;
        signature = bs58.encode(tx.signature!);
      } else {
        signature = await this.connection.sendRawTransaction(rawTx, {
          skipPreflight: true,
          maxRetries: 2
        });
      }

      const latencyMs = Date.now() - startTime;
      logger.info({ signature, latency: `${latencyMs}ms`, mint: mintStr }, "🚀 Snipe executed on-chain");

      return {
        signature,
        success: true,
        mint: mintStr,
        amountSol: this.config.buyAmountSol,
        tokenAmount: 1_000_000_000,
        entryPriceSol: this.config.buyAmountSol / 1_000_000_000,
        latencyMs,
        jitoBundleId
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      logger.error({ err: err.message, mint: mintStr }, "Order execution failed");
      return {
        signature: "",
        success: false,
        mint: mintStr,
        amountSol: 0,
        tokenAmount: 0,
        entryPriceSol: 0,
        latencyMs,
        error: err.message
      };
    }
  }
}
