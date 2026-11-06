import { Connection, PublicKey } from "@solana/web3.js";
import { getMint } from "@solana/spl-token";
import { SniperConfig, RiskAuditResult } from "../types";
import { logger } from "../config";

export class RiskFilterService {
  private connection: Connection;
  private config: SniperConfig;

  constructor(connection: Connection, config: SniperConfig) {
    this.connection = connection;
    this.config = config;
  }

  public async auditToken(mint: PublicKey): Promise<RiskAuditResult> {
    const reasons: string[] = [];
    let score = 100;
    let mintRevoked = true;
    let freezeRevoked = true;
    let top10Percentage = 0;

    try {
      // 1. Check Mint & Freeze Authority
      const mintInfo = await getMint(this.connection, mint, "confirmed");
      
      if (mintInfo.mintAuthority !== null) {
        mintRevoked = false;
        score -= 40;
        reasons.push("Mint authority is NOT revoked (inflation risk)");
        if (this.config.risk.requireRevokedMint) {
          return { passed: false, score: 0, mintRevoked, freezeRevoked, top10Percentage, reasons };
        }
      }

      if (mintInfo.freezeAuthority !== null) {
        freezeRevoked = false;
        score -= 50;
        reasons.push("Freeze authority is NOT revoked (honeypot/blacklisting risk)");
        if (this.config.risk.requireRevokedFreeze) {
          return { passed: false, score: 0, mintRevoked, freezeRevoked, top10Percentage, reasons };
        }
      }

      // 2. Check Top Token Holders Concentration
      const largestAccounts = await this.connection.getTokenLargestAccounts(mint, "confirmed");
      if (largestAccounts && largestAccounts.value.length > 0) {
        const totalSupply = Number(mintInfo.supply);
        if (totalSupply > 0) {
          const top10Sum = largestAccounts.value
            .slice(0, 10)
            .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
          
          top10Percentage = (top10Sum / totalSupply) * 100;

          if (top10Percentage > this.config.risk.maxTop10HolderPercent) {
            score -= 30;
            reasons.push(`Top 10 holders own ${top10Percentage.toFixed(1)}% (exceeds ${this.config.risk.maxTop10HolderPercent}% max limit)`);
          }
        }
      }

      const passed = score >= 70;
      return { passed, score, mintRevoked, freezeRevoked, top10Percentage, reasons };
    } catch (err: any) {
      logger.warn({ mint: mint.toBase58(), err: err.message }, "Risk audit encountered RPC read warning, applying defensive fallback");
      return {
        passed: false,
        score: 0,
        mintRevoked: false,
        freezeRevoked: false,
        top10Percentage: 100,
        reasons: ["Failed to verify mint metadata on RPC"]
      };
    }
  }
}
