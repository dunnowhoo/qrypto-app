# 🇮🇩 QRIS Bridge – Crypto to Rupiah Instant Payment

![Status](https://img.shields.io/badge/Status-MVP-success)
![Network](https://img.shields.io/badge/Network-Base_Sepolia-blue)
![Stack](https://img.shields.io/badge/Stack-OnchainKit_Next.js_Foundry-0052FF)

> **Base Indonesia Hackathon 2025 Submission**
>
> *Bridging the gap between 21M+ Crypto Investors and 33M+ QRIS Merchants in Indonesia.*

## 📖 Overview

**QRIS Bridge** is a "Real World Asset" payment solution enabling users to pay standard Indonesian QRIS merchants using Crypto (Stablecoins) on **Base L2**.

We solve "Off-Ramping Friction" by providing a **Sub-30-Second** payment experience.
Key Tech Features:
* **Smart Wallet (Passkeys):** Login with FaceID (Powered by Coinbase Smart Wallet).
* **Gasless (Paymaster):** Zero gas fees for users (Sponsored via Coinbase CDP).
* **Instant Settlement:** Atomic on-chain locks triggering off-chain fiat disbursement.

---

## 📂 Project Structure (Monorepo)

This repository is organized as a monorepo containing both the blockchain logic and the fullstack application.

```bash
.
├── contracts/          # 🧠 Smart Contracts (Foundry)
│   ├── src/            # Solidity Contracts (QRISPayment.sol)
│   ├── script/         # Deployment Scripts
│   └── test/           # Unit Tests
│
├── qrypto-app/         # 💻 Fullstack App (Next.js + OnchainKit)
│   ├── app/            # App Router & API Routes (Backend)
│   ├── components/     # UI Components
│   ├── prisma/         # Database Schema (SQLite/Postgres)
│   └── public/         # Static Assets
│
└── README.md           # This guide

```

---

## 🛠 Prerequisites

Ensure you have the following installed on your machine:

1. **Node.js** (v18.17+ recommended)
2. **Foundry** (Forge & Cast) - [Installation Guide](https://book.getfoundry.sh/getting-started/installation)
3. **Git**
4. **Coinbase Developer Platform (CDP) Account** - For RPC & Paymaster API Keys.

---

## 🚀 Getting Started

Follow these steps to run the project from scratch.

### Phase 1: Smart Contract Setup

First, we need to deploy the contracts to get the `CONTRACT_ADDRESS`.

1. **Navigate to contracts folder:**
```bash
cd contracts

```


2. **Install Dependencies:**
```bash
forge install

```


3. **Setup Environment:**
Create a `.env` file in the `contracts/` directory:
```env
# Your Wallet Private Key (Do not share!)
PRIVATE_KEY=your_private_key_without_0x

# Base Sepolia RPC URL (Get from CDP or public node)
BASE_SEPOLIA_RPC=[https://sepolia.base.org](https://sepolia.base.org)

# Optional: For verifying contract
BASESCAN_API_KEY=your_etherscan_api_key

```


4. **Build & Test:**
```bash
forge build
forge test

```


5. **Deploy to Base Sepolia:**
Run the deployment script.
```bash
forge script script/DeployQRIS.s.sol --rpc-url $BASE_SEPOLIA_RPC --broadcast

```


> ⚠️ **IMPORTANT:** Copy the `QRISPayment` contract address outputted in the terminal. You will need this for the Frontend.



---

### Phase 2: Frontend & Backend Setup

Now, let's run the Next.js application.

1. **Navigate to app folder:**
```bash
cd ../qrypto-app

```


2. **Install Dependencies:**
```bash
npm install

```


3. **Setup Environment:**
Create a `.env.local` file in the `qrypto-app/` directory:
```env
# --- OnchainKit & CDP ---
NEXT_PUBLIC_CDP_API_KEY=your_public_api_key_from_cdp
NEXT_PUBLIC_PROJECT_ID=your_cdp_project_id

# --- Smart Contract (From Phase 1) ---
NEXT_PUBLIC_CONTRACT_ADDRESS=0x_your_deployed_contract_address_here
NEXT_PUBLIC_CHAIN_ID=84532 # Base Sepolia

# --- Database ---
DATABASE_URL="file:./dev.db"

```


4. **Initialize Database (Prisma):**
This creates the local SQLite database file.
```bash
npx prisma migrate dev --name init

```


5. **Run Development Server:**
```bash
npm run dev

```


6. **Open App:**
Visit [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000). You should see the Mobile Layout interface.

---

## 📜 Workflow Guide

### How to Simulate a Payment

1. **Login:** Connect using "Smart Wallet" (Create a passkey/Google account).
2. **Faucet:** Make sure your wallet has some **Base Sepolia ETH** (or IDRX if you deployed a mock token).
* *Get Testnet ETH:* [coinbase.com/faucets](https://www.google.com/search?q=https://coinbase.com/faucets)


3. **Scan:** Click the Scan button (on emulator, use the "Upload QR" feature if camera is unavailable).
4. **Confirm:** Review the quote and click "Pay".
5. **Verify:** Check the console logs or database (`npx prisma studio`) to see the transaction status update.

### Database GUI

To view registered orders and transaction history:

```bash
# Inside qrypto-app folder
npx prisma studio

```

---

## 🏗 Architecture

sequenceDiagram
    participant User
    participant Frontend (Next.js)
    participant Contract (Base)
    participant Backend (API)
    participant DB (Prisma)
    participant Xendit (Fiat Payout)

    %% 1. FASE SCANNING & QUOTE
    User->>Frontend: Scan QRIS Code
    Frontend->>Backend: Request Quote (POST /api/quote)
    Note right of Frontend: Send QR String
    
    Backend->>DB: Create Order (Status: PENDING)
    Backend-->>Frontend: Return Amount IDRX & OrderID
    
    %% 2. FASE PEMBAYARAN CRYPTO (ON-CHAIN)
    User->>Frontend: Click "Pay" (Smart Wallet)
    Frontend->>Contract: payQRIS(orderId, amount)
    Note over Frontend,Contract: Sponsored Gas (Paymaster)
    
    Contract->>Contract: Transfer IDRX User -> Treasury
    Contract->>Contract: Emit Event "PaymentProcessed"
    
    %% 3. FASE SETTLEMENT RUPIAH (OFF-CHAIN)
    Contract-->>Backend: Webhook / Event Listener (CDP)
    
    Backend->>DB: Update Status (PAID_ONCHAIN)
    Note right of Backend: User sudah bayar crypto, sekarang kita talangi Rupiah
    
    Backend->>Xendit: API Pay to QR/Bank (Disbursement)
    Note right of Backend: Mengirim Rp ke Rekening Merchant sesuai data QRIS
    
    Xendit-->>Backend: Success Response (200 OK)
    
    Backend->>DB: Update Status (COMPLETED)
    
    %% 4. FASE FINAL
    Backend->>User: Show Success Screen (Real-time update)

---

## 👥 Authors

* **Fauzan Putra Sanjaya** - [GitHub](https://www.google.com/search?q=https://github.com/fauzansanjaya)

---

## 📄 License

This project is licensed under the MIT License.
