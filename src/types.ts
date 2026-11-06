import { PublicKey } from "@solana/web3.js";

export interface SniperConfig {
  rpcEndpoint: string;
  wsEndpoint: string;
  privateKey: string;
  buyAmountSol: number;
  slippageBps: number;
  simulationMode: boolean;
  jito: {
    useBundles: boolean;
    blockEngineUrl: string;
    tipAmountSol: number;
  };
  risk: {
    maxTop10HolderPercent: number;
    requireRevokedMint: boolean;
    requireRevokedFreeze: boolean;
    minInitialLiquiditySol: number;
  };
  trade: {
    takeProfitMultiplier: number;
    stopLossPercent: number;
    trailingStopLoss: boolean;
    trailingStopPercent: number;
  };
}

export interface TokenCandidate {
  mint: PublicKey;
  bondingCurve: PublicKey;
  associatedBondingCurve: PublicKey;
  creator: PublicKey;
  name: string;
  symbol: string;
  uri: string;
  timestamp: number;
  initialBuySol?: number;
}

export interface RiskAuditResult {
  passed: boolean;
  score: number; // 0 - 100
  mintRevoked: boolean;
  freezeRevoked: boolean;
  top10Percentage: number;
  reasons: string[];
}

export interface TradeExecutionResult {
  signature: string;
  success: boolean;
  mint: string;
  amountSol: number;
  tokenAmount: number;
  entryPriceSol: number;
  latencyMs: number;
  jitoBundleId?: string;
  error?: string;
}

export interface Position {
  mint: string;
  tokenAmount: number;
  entryPriceSol: number;
  highestPriceSol: number;
  currentValueSol: number;
  openTime: number;
}
