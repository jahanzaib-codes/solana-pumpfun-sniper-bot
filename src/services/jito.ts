import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import axios from "axios";
import { logger } from "../config";

// Official Jito Public Tip Accounts on Solana Mainnet
export const JITO_TIP_ACCOUNTS: PublicKey[] = [
  new PublicKey("96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5"),
  new PublicKey("HFqU5x63VTxvQssQn138i26LjjTQ2q5bL4Pz4v219STo"),
  new PublicKey("Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY"),
  new PublicKey("ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49"),
  new PublicKey("DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh"),
  new PublicKey("ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt"),
  new PublicKey("DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL"),
  new PublicKey("3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT")
];

export function getRandomTipAccount(): PublicKey {
  const index = Math.floor(Math.random() * JITO_TIP_ACCOUNTS.length);
  return JITO_TIP_ACCOUNTS[index];
}

export function createJitoTipInstruction(
  payer: PublicKey,
  tipLamports: number
): TransactionInstruction {
  const tipAccount = getRandomTipAccount();
  return SystemProgram.transfer({
    fromPubkey: payer,
    toPubkey: tipAccount,
    lamports: tipLamports
  });
}

export async function sendJitoBundle(
  blockEngineUrl: string,
  serializedTransactions: string[]
): Promise<string | null> {
  try {
    const endpoint = `${blockEngineUrl}/api/v1/bundles`;
    const response = await axios.post(
      endpoint,
      {
        jsonrpc: "2.0",
        id: 1,
        method: "sendBundle",
        params: [serializedTransactions]
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 2500
      }
    );

    if (response.data && response.data.result) {
      logger.info({ bundleId: response.data.result }, "Jito MEV bundle submitted successfully");
      return response.data.result;
    }

    if (response.data && response.data.error) {
      logger.warn({ error: response.data.error }, "Jito MEV bundle rejected by engine");
    }
    return null;
  } catch (error: any) {
    logger.error({ err: error.message }, "Failed to dispatch Jito bundle to block engine");
    return null;
  }
}

