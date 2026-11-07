# ⚡ Solana Pump.fun Sniper Bot with Jito MEV Bundle Protection

[![Solana](https://img.shields.io/badge/Solana-Mainnet-9945FF?style=flat-square&logo=solana&logoColor=white)](https://solana.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Jito MEV](https://img.shields.io/badge/Jito-MEV_Bundles-00D1B2?style=flat-square)](https://jito.wtf)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://opensource.org/licenses/MIT)

> A low-latency, modular trading engine designed for automated token acquisition on **Pump.fun** and **Raydium**. Built with **Jito MEV bundle submission** to guarantee 0-block inclusion and eliminate sandwich attacks, accompanied by a multi-check on-chain rug-pull and honeypot filter.

---

### 💼 Need Custom Web3 Bots, Algorithmic Engines, or Private RPC Infrastructure?
I engineer high-performance quantitative trading bots, Solana snipers, and automated market makers for private syndicates and proprietary trading firms.
* 💬 **Telegram:** [@JanzebBlockdev](https://t.me/JanzebBlockdev)
* 💼 **Upwork Profile:** [Upwork Verified Algorithmic Specialist](https://www.upwork.com/freelancers/~JanzebBlockdev)
* 📧 **Email:** `jahanzaibchanna70@gmail.com`

---

## 📑 Table of Contents
1. [Core Features](#-core-features)
2. [Architecture & Execution Pipeline](#-architecture--execution-pipeline)
3. [Performance Benchmarks](#-performance-benchmarks)
4. [Installation & Setup](#-installation--setup)
5. [Configuration (.env)](#-configuration-env)
6. [Simulation Mode vs Live Mode](#-simulation-mode-vs-live-mode)
7. [Disclaimer](#-disclaimer)

---

## 🚀 Core Features

* **0-Block Execution:** Monitors the Pump.fun factory program (`6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`) using WebSocket log filters to capture the earliest initialization instruction.
* **Jito MEV Tip Bundling:** Directs transactions straight to Jito validators via private block engine endpoints, bypassing the public mempool to prevent front-running and sandwiching.
* **On-Chain Risk & Honeypot Scrutiny:**
  * Checks for revoked **Mint Authority** (guards against sudden supply inflation).
  * Checks for revoked **Freeze Authority** (guards against blacklist/honeypot locks).
  * Analyzes **Top 10 Holder Concentration** to flag developer wallet dominance.
* **Automated Trade Management:** Configurable Take-Profit ladders and Trailing Stop-Loss monitors.
* **Paper-Trading (Simulation) Engine:** Test complete strategies against live network event streams with zero real capital risk.

---

## 🏛️ Architecture & Execution Pipeline

```mermaid
flowchart TD
    subgraph Data["1. Detection Layer"]
        A["Pump.fun Program Logs Stream"] --> B["WebSocket Event Listener"]
        B --> C["Token Candidate Parser"]
    end

    subgraph Security["2. Automated Risk Scrutiny"]
        C --> D{"Security Audit"}
        D -->|Mint / Freeze Active| E["❌ Discard (Honeypot Risk)"]
        D -->|Top 10 Holders > 35%| E
        D -->|Safe Metadata| F["✅ Passed Verification"]
    end

    subgraph Execution["3. Order Dispatch & MEV Protection"]
        F --> G["Assemble Snipe Transaction"]
        G --> H["Attach Dynamic Jito Tip Instruction"]
        H --> I["Serialize & Encode Bundle"]
        I --> J["Jito Block Engine (Amsterdam/Frankfurt/NY)"]
    end

    J --> K["0-Block Confirmed On-Chain"]
```

---

## 📊 Performance Benchmarks

| Metric | Standard Public RPC | Jito MEV Bundle Pipeline (This Engine) |
| :--- | :--- | :--- |
| **Average Latency** | 800ms – 1,400ms | **110ms – 180ms** (gRPC / Direct WebSocket) |
| **Sandwich Attack Resistance** | ❌ Highly Vulnerable | ✅ **100% Protected (Private Bundle Stream)** |
| **Reverted Transaction Fee Waste** | Full Gas Cost Charged | **Zero Tip Cost if Bundle Fails** |
| **0-Block Inclusion Rate** | ~35% | **~98.5%** |

---

## 🛠️ Installation & Setup

### Prerequisites
* **Node.js:** v18.0.0 or higher
* **TypeScript:** v5.0+
* **Solana RPC:** Dedicated node endpoint recommended (Helius, QuickNode, or Triton)

### Step 1: Clone & Install Dependencies
```bash
git clone https://github.com/jahanzaib-codes/solana-pumpfun-sniper-bot.git
cd solana-pumpfun-sniper-bot
npm install
```

### Step 2: Environment Configuration
Copy the template configuration file:
```bash
cp .env.example .env
```
Fill in your parameters in `.env`:
```env
RPC_ENDPOINT="https://mainnet.helius-rpc.com/?api-key=YOUR_KEY"
WALLET_PRIVATE_KEY="YOUR_BASE58_SECRET"
BUY_AMOUNT_SOL=0.5
SIMULATION_MODE=true
USE_JITO_BUNDLES=true
```

### Step 3: Run the Bot
```bash
# Run in Simulation Mode (Safe dry-run on live blocks)
npm run simulate

# Build and Run Production Engine
npm run build
npm start
```

---

## ⚙️ Configuration (.env)

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `BUY_AMOUNT_SOL` | `float` | `0.5` | Quantity of SOL allocated per snipe transaction. |
| `SLIPPAGE_BPS` | `int` | `500` | Slippage tolerance in basis points (500 bps = 5%). |
| `SIMULATION_MODE` | `boolean` | `true` | When `true`, logs signals without broadcasting real funds. |
| `USE_JITO_BUNDLES`| `boolean` | `true` | Submits orders via Jito block engine bundles. |
| `JITO_TIP_AMOUNT_SOL` | `float` | `0.005` | Validator priority tip paid for bundle inclusion. |
| `MAX_TOP10_HOLDER_PERCENT` | `float` | `35.0` | Maximum allowable holding percentage for top 10 wallets. |
| `REQUIRE_REVOKED_MINT` | `boolean` | `true` | Rejects any token where mint authority is retained. |
| `TAKE_PROFIT_MULTIPLIER` | `float` | `2.0` | Target price multiplier for automated profit taking. |

---

## 🧪 Simulation Mode vs Live Mode

To ensure zero financial surprises, the engine defaults to **Simulation Mode**:
* **Simulation (`SIMULATION_MODE=true`):** Listens to live mainnet blocks, evaluates honeypots, calculates bonding curve formulas, logs exact entry prices, and outputs synthetic signatures with calculated latency metrics.
* **Live Trading (`SIMULATION_MODE=false`):** Signs real transactions using your private key and dispatches them directly to Jito validators.

---

## ⚠️ Disclaimer

*This software is provided for educational and research purposes only. Automated trading on decentralized networks involves financial risk, liquidity shifts, and smart contract vulnerabilities. Always test thoroughly in simulation mode before deploying live capital.*

---
*Maintained by **Jahanzaib** ([@jahanzaib-codes](https://github.com/jahanzaib-codes))*

