# OnchainKit Integration Guide

## Overview
Wallet page sudah terintegrasi dengan OnchainKit components dari Coinbase untuk memberikan pengalaman Web3 yang seamless.

## Components yang Digunakan

### 1. Wallet Components
- **`<Wallet>`** - Container utama untuk wallet functionality
- **`<ConnectWallet>`** - Button untuk connect/disconnect wallet
- **`<WalletDropdown>`** - Dropdown menu dengan berbagai actions
- **`<WalletDropdownBasename>`** - Menampilkan Basename (ENS-like untuk Base)
- **`<WalletDropdownFundLink>`** - Quick link ke funding options
- **`<WalletDropdownDisconnect>`** - Disconnect wallet button

### 2. Identity Components
- **`<Identity>`** - Container untuk identity information
- **`<Avatar>`** - User avatar dari address
- **`<Name>`** - Menampilkan ENS/Basename atau address
- **`<Address>`** - Formatted wallet address
- **`<EthBalance>`** - Display ETH balance

### 3. Swap Components
- **`<Swap>`** - Container untuk swap functionality
- **`<SwapAmountInput>`** - Input untuk token amount
- **`<SwapToggleButton>`** - Toggle between from/to tokens
- **`<SwapButton>`** - Execute swap
- **`<SwapMessage>`** - Display swap status/errors

### 4. Fund Components
- **`<FundButton>`** - Coinbase Onramp integration untuk buy crypto

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_ONCHAINKIT_API_KEY="your_onchainkit_api_key"
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your_walletconnect_project_id"
```

### Wagmi Config (`app/config/wagmi.ts`)
```typescript
export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    injected(),
    coinbaseWallet({ appName: "QRypto", preference: "all" }),
    walletConnect({ projectId: "..." }),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});
```

### OnchainKit Provider (`app/rootProvider.tsx`)
```typescript
<OnchainKitProvider
  apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
  chain={base}
  config={{
    appearance: { mode: "auto", theme: "default" },
    wallet: {
      display: "modal",
      termsUrl: "https://qrypto.app/terms",
      privacyUrl: "https://qrypto.app/privacy",
    },
  }}
>
```

## Features

### Wallet Page (`/walletpage`)
1. **Overview Tab**
   - Display wallet identity dengan avatar dan balance
   - Quick actions (Buy, Send, Receive, Swap)
   - Fund wallet via Coinbase Onramp
   - Transaction history link
   - Settings link

2. **Swap Tab**
   - Swap ETH ↔ USDC on Base network
   - Real-time pricing
   - Low gas fees
   - Powered by OnchainKit

3. **Buy Tab**
   - Coinbase Onramp integration
   - Buy crypto dengan card/bank transfer
   - QR code untuk receive crypto
   - Support multiple payment methods

## Supported Networks
- **Base Mainnet** (Chain ID: 8453)
- **Base Sepolia** (Testnet - Chain ID: 84532)

## Supported Wallets
- Coinbase Wallet
- MetaMask
- WalletConnect compatible wallets
- Browser injected wallets

## Token Configuration
```typescript
const ETH_TOKEN = {
  name: "Ethereum",
  address: "" as `0x${string}`,
  symbol: "ETH",
  decimals: 18,
  chainId: 8453,
};

const USDC_TOKEN = {
  name: "USDC",
  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`,
  symbol: "USDC",
  decimals: 6,
  chainId: 8453,
};
```

## Styling
OnchainKit components menggunakan custom styling dengan Tailwind CSS:
- Theme mode: auto (follows system preference)
- Custom colors untuk match brand
- Responsive design untuk mobile-first

## Resources
- [OnchainKit Docs](https://onchainkit.xyz)
- [Base Network](https://base.org)
- [Wagmi Docs](https://wagmi.sh)

## Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Server akan berjalan di `http://localhost:3000` atau port lain jika port 3000 sudah digunakan.
