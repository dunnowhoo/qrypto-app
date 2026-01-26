# Onchain Connection Setup

## Overview
Wallet page sudah terkoneksi dengan blockchain menggunakan **Wagmi** dan **OnchainKit** untuk fetch real-time balance data.

## Current Implementation

### ✅ Live Data Fetching (Onchain)

**ETH Balance:**
- Menggunakan `useBalance` dari wagmi
- Fetch native ETH balance dari Base network
- Real-time update ketika wallet connect/disconnect

**USDC Balance:**
- Token address: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (USDC on Base)
- Menggunakan `useBalance` dengan token parameter
- Real-time update dari blockchain

### 🔄 Data Flow

```
User Connect Wallet
    ↓
useAccount() -> get address & isConnected
    ↓
useBalance(ETH) -> fetch from blockchain
    ↓
useBalance(USDC) -> fetch from blockchain
    ↓
Calculate total in IDR (formatUnits + exchange rate)
    ↓
Update UI with real balances
```

### 📊 Exchange Rates (Mock - Update as needed)

```typescript
const IDR_RATES = {
  ETH: 50000000,  // 1 ETH = Rp 50,000,000
  USDC: 16000,    // 1 USDC = Rp 16,000
  MATIC: 1200,    // 1 MATIC = Rp 1,200
  IDRX: 1,        // 1 IDRX = Rp 1 (native IDR)
};
```

## Add More Tokens

Untuk add token lain, gunakan format ini:

### 1. Add IDRX (Indonesian Rupiah X)

```typescript
// In wallet page, uncomment and add after USDC

// Fetch IDRX balance
const { data: idrxBalance, isLoading: idrxLoading } = useBalance({
  address: address,
  token: "0x..." as `0x${string}`, // Add IDRX contract on Base
  chainId: base.id,
});

// Then add to balances array in useEffect:
if (idrxBalance) {
  const idrxAmount = parseFloat(formatUnits(idrxBalance.value, idrxBalance.decimals));
  const idrxValueIDR = idrxAmount * IDR_RATES.IDRX;
  balances.push({
    name: "Indonesian Rupiah X",
    symbol: "IDRX",
    balance: idrxBalance.value.toString(),
    balanceFormatted: idrxAmount.toFixed(0),
    valueIDR: idrxValueIDR,
    logo: "💎",
    network: "Base",
    color: "bg-blue-100",
    textColor: "text-blue-600",
  });
  total += idrxValueIDR;
}
```

### 2. Add Custom ERC20 Token

```typescript
const CUSTOM_TOKEN_ADDRESS = "0x..." as `0x${string}`;
const CUSTOM_TOKEN_DECIMALS = 18;
const CUSTOM_TOKEN_RATE = 10000; // 1 token = Rp 10,000

const { data: customBalance } = useBalance({
  address: address,
  token: CUSTOM_TOKEN_ADDRESS,
  chainId: base.id,
});

// Add to useEffect balances array
if (customBalance) {
  const amount = parseFloat(formatUnits(customBalance.value, CUSTOM_TOKEN_DECIMALS));
  const valueIDR = amount * CUSTOM_TOKEN_RATE;
  balances.push({
    name: "Your Token",
    symbol: "YOUR",
    balance: customBalance.value.toString(),
    balanceFormatted: amount.toFixed(2),
    valueIDR: valueIDR,
    logo: "🪙",
    network: "Base",
    color: "bg-green-100",
    textColor: "text-green-600",
  });
  total += valueIDR;
}
```

## Loading State

- `isLoading` variable menunjukkan apakah data sedang di-fetch
- Display "Loading..." & "Fetching from blockchain..." ketika `isLoading = true`
- Otomatis update ketika data available

## Debugging Onchain Connection

### Check if wallet connected:
```
isConnected = true → Wallet terhubung
address = "0x..." → User address
```

### Check data fetching:
```
ethBalance?.value = "1000000000000000000" (in wei)
usdcBalance?.value = "100000000" (in smallest unit)
```

### Test on Base Network:
- Network: Base (chainId: 8453)
- RPC: https://mainnet.base.org
- Explorer: https://basescan.org

## Environment Setup

Pastikan di `.env` atau `.env.local`:
```env
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_api_key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

## Resources

- [Wagmi Documentation](https://wagmi.sh)
- [OnchainKit Documentation](https://onchainkit.xyz)
- [Base Network](https://base.org)
- [USDC on Base](https://basescan.org/token/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
