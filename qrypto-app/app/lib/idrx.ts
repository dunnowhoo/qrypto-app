// IDRX Contract ABI - Only functions we need for bridging
export const IDRX_ABI = [
  // Read functions
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "_bridgeNonce",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Write functions
  {
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "toChain", type: "uint256" },
    ],
    name: "burnBridge",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "_user", type: "address" },
      { indexed: false, name: "_amount", type: "uint256" },
      { indexed: false, name: "amountAfterCut", type: "uint256" },
      { indexed: false, name: "toChain", type: "uint256" },
      { indexed: false, name: "_bridgeNonce", type: "uint256" },
      { indexed: false, name: "platformFee", type: "uint256" },
    ],
    name: "BurnBridge",
    type: "event",
  },
] as const;

// IDRX Contract Addresses per chain
export const IDRX_CONTRACTS: Record<number, `0x${string}`> = {
  137: "0x649a2DA7B28E0D54c13D5eFf95d3A660652742cC", // Polygon
  56: "0x649a2DA7B28E0D54c13D5eFf95d3A660652742cC", // BNB Chain
  8453: "0x18Bc5bcC660cf2B9cE3cd51a404aFe1a0cBD3C22", // Base
  1135: "0x18Bc5bcC660cf2B9cE3cd51a404aFe1a0cBD3C22", // Lisk
  42793: "0x18bc5bcc660cf2b9ce3cd51a404afe1a0cbd3c22", // Etherlink
  8217: "0x18bc5bcc660cf2b9ce3cd51a404afe1a0cbd3c22", // Kaia
  480: "0x18bc5bcc660cf2b9ce3cd51a404afe1a0cbd3c22", // World Chain
  100: "0x18bc5bcc660cf2b9ce3cd51a404afe1a0cbd3c22", // Gnosis
};

// Chain info for UI
export const IDRX_SUPPORTED_CHAINS = [
  { id: 137, name: "Polygon", symbol: "MATIC", logo: "🟣" },
  { id: 56, name: "BNB Chain", symbol: "BNB", logo: "🟡" },
  { id: 8453, name: "Base", symbol: "ETH", logo: "🔵" },
  { id: 1135, name: "Lisk", symbol: "LSK", logo: "🔷" },
  { id: 42793, name: "Etherlink", symbol: "XTZ", logo: "🔶" },
  { id: 8217, name: "Kaia", symbol: "KLAY", logo: "🟤" },
  { id: 480, name: "World Chain", symbol: "WLD", logo: "🌍" },
  { id: 100, name: "Gnosis", symbol: "xDAI", logo: "🦉" },
];

// Get contract address for a chain
export function getIDRXContract(chainId: number): `0x${string}` | null {
  return IDRX_CONTRACTS[chainId] || null;
}

// Get chain info by ID
export function getChainInfo(chainId: number) {
  return IDRX_SUPPORTED_CHAINS.find((c) => c.id === chainId);
}
