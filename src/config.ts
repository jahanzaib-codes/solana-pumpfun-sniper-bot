import dotenv from "dotenv";
import pino from "pino";
import { SniperConfig } from "./types";

dotenv.config();

export const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
      ignore: "pid,hostname"
    }
  },
  level: process.env.LOG_LEVEL || "info"
});

export function loadConfig(): SniperConfig {
  return {
    rpcEndpoint: process.env.RPC_ENDPOINT || "https://api.mainnet-beta.solana.com",
    wsEndpoint: process.env.RPC_WEBSOCKET_ENDPOINT || "wss://api.mainnet-beta.solana.com",
    privateKey: process.env.WALLET_PRIVATE_KEY || "",
    buyAmountSol: parseFloat(process.env.BUY_AMOUNT_SOL || "0.1"),
    slippageBps: parseInt(process.env.SLIPPAGE_BPS || "500", 10),
    simulationMode: process.env.SIMULATION_MODE !== "false",
    jito: {
      useBundles: process.env.USE_JITO_BUNDLES === "true",
      blockEngineUrl: process.env.JITO_BLOCK_ENGINE_URL || "https://mainnet.block-engine.jito.wtf",
      tipAmountSol: parseFloat(process.env.JITO_TIP_AMOUNT_SOL || "0.005")
    },
    risk: {
      maxTop10HolderPercent: parseFloat(process.env.MAX_TOP10_HOLDER_PERCENT || "35.0"),
      requireRevokedMint: process.env.REQUIRE_REVOKED_MINT !== "false",
      requireRevokedFreeze: process.env.REQUIRE_REVOKED_FREEZE !== "false",
      minInitialLiquiditySol: parseFloat(process.env.MIN_INITIAL_LIQUIDITY_SOL || "10.0")
    },
    trade: {
      takeProfitMultiplier: parseFloat(process.env.TAKE_PROFIT_MULTIPLIER || "2.0"),
      stopLossPercent: parseFloat(process.env.STOP_LOSS_PERCENT || "25.0"),
      trailingStopLoss: process.env.TRAILING_STOP_LOSS === "true",
      trailingStopPercent: parseFloat(process.env.TRAILING_STOP_PERCENT || "15.0")
    }
  };
}

