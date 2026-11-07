import { Connection, PublicKey } from "@solana/web3.js";
import { TokenCandidate } from "../types";
import { logger } from "../config";

// Official Pump.fun Smart Contract Program ID on Solana Mainnet
export const PUMPFUN_PROGRAM_ID = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");

export class PumpFunScanner {
  private connection: Connection;
  private onTokenDetected: (candidate: TokenCandidate) => void;
  private isListening = false;
  private subscriptionId: number | null = null;

  constructor(
    connection: Connection,
    onTokenDetected: (candidate: TokenCandidate) => void
  ) {
    this.connection = connection;
    this.onTokenDetected = onTokenDetected;
  }

  public async startScanning(): Promise<void> {
    if (this.isListening) return;
    this.isListening = true;

    logger.info(
      { program: PUMPFUN_PROGRAM_ID.toBase58() },
      "Subscribing to Pump.fun contract events via WebSocket stream..."
    );

    try {
      this.subscriptionId = this.connection.onLogs(
        PUMPFUN_PROGRAM_ID,
        (logs) => {
          if (logs.err) return;

          // Check for "Program log: Instruction: Create"
          const isCreateInstruction = logs.logs.some((log) =>
            log.includes("Instruction: Create") || log.includes("Program log: Create")
          );

          if (isCreateInstruction) {
            this.handleCreateEvent(logs.signature);
          }
        },
        "processed"
      );

      logger.info("⚡ Live WebSocket scanner active: Listening for 0-block token creations");
    } catch (err: any) {
      logger.error({ err: err.message }, "Failed to connect WebSocket stream to RPC");
    }
  }

  private async handleCreateEvent(signature: string): Promise<void> {
    try {
      // In production, parse transaction innerInstructions or Geyser shredstream
      // For clean sample, mock the candidate payload detected from the event log
      const dummyMint = KeypairMock();
      const candidate: TokenCandidate = {
        mint: dummyMint,
        bondingCurve: dummyMint,
        associatedBondingCurve: dummyMint,
        creator: dummyMint,
        name: "Detected Pump.fun Token",
        symbol: "PUMP",
        uri: "https://arweave.net/metadata.json",
        timestamp: Date.now()
      };

      this.onTokenDetected(candidate);
    } catch (error: any) {
      logger.debug({ signature, err: error.message }, "Skipping unparsed creation log");
    }
  }

  public stopScanning(): void {
    if (this.subscriptionId !== null) {
      this.connection.removeOnLogsListener(this.subscriptionId);
      this.subscriptionId = null;
      this.isListening = false;
      logger.info("Scanner stopped gracefully");
    }
  }
}

function KeypairMock(): PublicKey {
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) bytes[i] = Math.floor(Math.random() * 256);
  return new PublicKey(bytes);
}

