"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useBalance, useChainId, useSwitchChain, usePublicClient } from "wagmi";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import {
  Avatar,
  Name,
  Identity,
} from "@coinbase/onchainkit/identity";
import { useAuth } from "../context/AuthContext";
import BottomNavbar from "../components/BottomNavbar";
import { ChevronLeft, Eye, Send, ArrowDownToLine, TrendingUp, TrendingDown, X, Copy, Check, Plus, ExternalLink, RefreshCw, ArrowRightLeft, Loader2, Trash2 } from "lucide-react";
import { formatUnits, isAddress } from "viem";
import { base, mainnet, polygon } from "wagmi/chains";
import { useIDRXBridge } from "../hooks/useIDRXBridge";
import { IDRX_CONTRACTS, IDRX_SUPPORTED_CHAINS } from "../lib/idrx";

// Token configurations with contract addresses on Base
const TOKENS = [
  {
    name: "Indonesian Rupiah X",
    symbol: "IDRX",
    address: "0x" as `0x${string}`, // TODO: Add actual IDRX contract address from your deployment
    decimals: 18,
    logo: "💎",
    network: "Polygon",
    color: "bg-blue-100",
    textColor: "text-blue-600",
  },
  {
    name: "Polygon",
    symbol: "MATIC",
    address: "0x" as `0x${string}`, // TODO: Add actual MATIC contract address on Base if available
    decimals: 18,
    logo: "⬡",
    network: "Polygon",
    color: "bg-purple-100",
    textColor: "text-purple-600",
  },
  {
    name: "USD Coin",
    symbol: "USDC",
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`, // USDC on Base
    decimals: 6,
    logo: "💵",
    network: "Base",
    color: "bg-blue-100",
    textColor: "text-blue-600",
  },
];

// ERC20 ABI for balance checking
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
] as const;

// IDR exchange rate - Updated to current market rates
// 1 USD ≈ 16,000 IDR
const IDR_RATES: Record<string, number> = {
  ETH: 43200000, // 1 ETH ≈ $2,700 × 16,000 = 43,200,000 IDR
  USDC: 16000, // 1 USDC = 16,000 IDR
  MATIC: 12800, // 1 MATIC ≈ $0.80 × 16,000 = 12,800 IDR  
  IDRX: 1, // 1 IDRX = 1 IDR
};

interface TokenBalance {
  name: string;
  symbol: string;
  balance: string;
  balanceFormatted: string;
  valueIDR: number;
  logo: string;
  network: string;
  color: string;
  textColor: string;
  priceChange?: number;
}

// Custom token interface for localStorage
interface CustomToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  network: "base" | "ethereum" | "polygon";
  logo: string;
}

// ERC20 ABI for fetching token info
const ERC20_FULL_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
] as const;

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<"tokens" | "nfts">("tokens");
  const [showBalance, setShowBalance] = useState(true);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [totalBalanceIDR, setTotalBalanceIDR] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Modal states
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showIDRXModal, setShowIDRXModal] = useState(false);
  const [showAddTokenModal, setShowAddTokenModal] = useState(false);
  const [idrxTab, setIdrxTab] = useState<"buy" | "bridge">("buy");
  
  // Custom token state
  const [customTokenAddress, setCustomTokenAddress] = useState("");
  const [customTokenSymbol, setCustomTokenSymbol] = useState("");
  const [customTokenName, setCustomTokenName] = useState("");
  const [customTokenDecimals, setCustomTokenDecimals] = useState("18");
  const [customTokenNetwork, setCustomTokenNetwork] = useState<"base" | "ethereum" | "polygon">("polygon");
  const [addingToken, setAddingToken] = useState(false);
  const [customTokens, setCustomTokens] = useState<CustomToken[]>([]);
  const [fetchingTokenInfo, setFetchingTokenInfo] = useState(false);
  const [tokenInfoError, setTokenInfoError] = useState("");
  
  // Bridge state
  const [bridgeFromChain, setBridgeFromChain] = useState(137); // Polygon
  const [bridgeToChain, setBridgeToChain] = useState(8453); // Base
  const [bridgeAmount, setBridgeAmount] = useState("");
  
  // Send form state
  const [sendNetwork, setSendNetwork] = useState<"base" | "ethereum" | "polygon">("base");
  const [sendToAddress, setSendToAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendToken, setSendToken] = useState("ETH");
  const [sendLoading, setSendLoading] = useState(false);
  
  // Receive state
  const [receiveNetwork, setReceiveNetwork] = useState<"base" | "ethereum" | "polygon">("base");
  
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { user } = useAuth();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  
  // Public clients for different chains
  const polygonClient = usePublicClient({ chainId: polygon.id });
  const baseClient = usePublicClient({ chainId: base.id });
  const mainnetClient = usePublicClient({ chainId: mainnet.id });
  
  // IDRX Bridge hook
  const { 
    step: bridgeStep, 
    txHash: bridgeTxHash, 
    error: bridgeError,
    bridge: executeBridge,
    reset: resetBridge,
    supportedChains 
  } = useIDRXBridge();

  // LocalStorage key for custom tokens
  const CUSTOM_TOKENS_KEY = "qrypto_custom_tokens";

  // ═══════════════════════════════════════════════════════════════════
  // ONCHAIN DATA FETCHING - Using Wagmi hooks to fetch real blockchain data
  // ═══════════════════════════════════════════════════════════════════

  // Fetch native ETH balance from Ethereum Mainnet (where your 0.00437 ETH is)
  const { data: ethBalanceMainnet, isLoading: ethMainnetLoading } = useBalance({
    address: address,
    chainId: mainnet.id, // Ethereum Mainnet (chain ID 1)
  });

  // Fetch native ETH balance from Base network
  const { data: ethBalanceBase, isLoading: ethBaseLoading } = useBalance({
    address: address,
    chainId: base.id, // Base (chain ID 8453)
  });

  // Fetch USDC token balance from Base network
  // USDC on Base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
  const { data: usdcBalance, isLoading: usdcLoading } = useBalance({
    address: address,
    token: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
    chainId: base.id,
  });

  // Fetch IDRX balance from Polygon
  const { data: idrxBalance, isLoading: idrxLoading } = useBalance({
    address: address,
    token: IDRX_CONTRACTS[137], // IDRX on Polygon
    chainId: polygon.id,
  });

  // Set mounted to true after hydration and load custom tokens
  useEffect(() => {
    setMounted(true);
    // Load custom tokens from localStorage
    try {
      const stored = localStorage.getItem(CUSTOM_TOKENS_KEY);
      if (stored) {
        setCustomTokens(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load custom tokens:", error);
    }
  }, []);

  // Get the client for a specific network
  const getClientForNetwork = useCallback((network: "base" | "ethereum" | "polygon") => {
    switch (network) {
      case "base": return baseClient;
      case "ethereum": return mainnetClient;
      case "polygon": return polygonClient;
      default: return polygonClient;
    }
  }, [baseClient, mainnetClient, polygonClient]);

  // Get chain ID for network
  const getChainIdForNetwork = (network: "base" | "ethereum" | "polygon"): number => {
    switch (network) {
      case "base": return base.id;
      case "ethereum": return mainnet.id;
      case "polygon": return polygon.id;
      default: return polygon.id;
    }
  };

  // Fetch token info from contract
  const fetchTokenInfo = async (tokenAddress: string, network: "base" | "ethereum" | "polygon") => {
    const client = getClientForNetwork(network);
    if (!client || !isAddress(tokenAddress)) {
      throw new Error("Invalid address or network");
    }

    try {
      const [symbol, name, decimals] = await Promise.all([
        client.readContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_FULL_ABI,
          functionName: "symbol",
        }),
        client.readContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_FULL_ABI,
          functionName: "name",
        }),
        client.readContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_FULL_ABI,
          functionName: "decimals",
        }),
      ]);

      return {
        symbol: symbol as string,
        name: name as string,
        decimals: Number(decimals),
      };
    } catch (error) {
      console.error("Failed to fetch token info:", error);
      throw new Error("Failed to read token contract. Make sure the address is a valid ERC20 token on the selected network.");
    }
  };

  // Auto-fetch token info when address changes
  const handleAddressChange = async (value: string) => {
    setCustomTokenAddress(value);
    setTokenInfoError("");
    
    if (value && isAddress(value)) {
      setFetchingTokenInfo(true);
      try {
        const info = await fetchTokenInfo(value, customTokenNetwork);
        setCustomTokenSymbol(info.symbol);
        setCustomTokenName(info.name);
        setCustomTokenDecimals(info.decimals.toString());
      } catch (error) {
        setTokenInfoError(error instanceof Error ? error.message : "Failed to fetch token info");
        setCustomTokenSymbol("");
        setCustomTokenName("");
        setCustomTokenDecimals("18");
      } finally {
        setFetchingTokenInfo(false);
      }
    } else {
      setCustomTokenSymbol("");
      setCustomTokenName("");
      setCustomTokenDecimals("18");
    }
  };

  // Handle network change - refetch token info
  const handleNetworkChange = async (network: "base" | "ethereum" | "polygon") => {
    setCustomTokenNetwork(network);
    setTokenInfoError("");
    
    if (customTokenAddress && isAddress(customTokenAddress)) {
      setFetchingTokenInfo(true);
      try {
        const info = await fetchTokenInfo(customTokenAddress, network);
        setCustomTokenSymbol(info.symbol);
        setCustomTokenName(info.name);
        setCustomTokenDecimals(info.decimals.toString());
      } catch (error) {
        setTokenInfoError(error instanceof Error ? error.message : "Failed to fetch token info");
        setCustomTokenSymbol("");
        setCustomTokenName("");
        setCustomTokenDecimals("18");
      } finally {
        setFetchingTokenInfo(false);
      }
    }
  };

  // Add custom token
  const handleAddCustomToken = async () => {
    if (!customTokenAddress || !isAddress(customTokenAddress)) {
      setTokenInfoError("Please enter a valid token address");
      return;
    }

    if (!customTokenSymbol || !customTokenName) {
      setTokenInfoError("Unable to fetch token info. Please check the address and network.");
      return;
    }

    // Check if token already exists
    if (customTokens.some(t => t.address.toLowerCase() === customTokenAddress.toLowerCase() && t.network === customTokenNetwork)) {
      setTokenInfoError("This token is already in your list");
      return;
    }

    setAddingToken(true);
    try {
      const newToken: CustomToken = {
        address: customTokenAddress,
        symbol: customTokenSymbol,
        name: customTokenName,
        decimals: parseInt(customTokenDecimals) || 18,
        network: customTokenNetwork,
        logo: "🪙", // Default logo
      };

      const updatedTokens = [...customTokens, newToken];
      setCustomTokens(updatedTokens);
      localStorage.setItem(CUSTOM_TOKENS_KEY, JSON.stringify(updatedTokens));

      // Reset form and close modal
      setCustomTokenAddress("");
      setCustomTokenSymbol("");
      setCustomTokenName("");
      setCustomTokenDecimals("18");
      setTokenInfoError("");
      setShowAddTokenModal(false);
    } catch (error) {
      console.error("Failed to add token:", error);
      setTokenInfoError("Failed to add token");
    } finally {
      setAddingToken(false);
    }
  };

  // Remove custom token
  const handleRemoveCustomToken = (tokenAddress: string, network: string) => {
    const updatedTokens = customTokens.filter(
      t => !(t.address.toLowerCase() === tokenAddress.toLowerCase() && t.network === network)
    );
    setCustomTokens(updatedTokens);
    localStorage.setItem(CUSTOM_TOKENS_KEY, JSON.stringify(updatedTokens));
  };

  // Calculate balances and convert to IDR
  // This effect updates whenever blockchain data changes
  useEffect(() => {
    setIsLoading(ethMainnetLoading || ethBaseLoading || usdcLoading || idrxLoading);
    
    if (!isConnected || !address) {
      setTokenBalances([]);
      setTotalBalanceIDR(0);
      return;
    }

    const balances: TokenBalance[] = [];
    let total = 0;

    // IDRX Balance from Polygon - Show first as primary token
    if (idrxBalance) {
      const idrxAmount = parseFloat(formatUnits(idrxBalance.value, 2)); // IDRX has 2 decimals
      const idrxValueIDR = idrxAmount * IDR_RATES.IDRX;
      balances.push({
        name: "Indonesian Rupiah X",
        symbol: "IDRX",
        balance: idrxBalance.value.toString(),
        balanceFormatted: idrxAmount.toLocaleString("id-ID"),
        valueIDR: idrxValueIDR,
        logo: "💎",
        network: "Polygon",
        color: "bg-cyan-100",
        textColor: "text-cyan-600",
      });
      total += idrxValueIDR;
    } else {
      // Always show IDRX even if balance is 0
      balances.push({
        name: "Indonesian Rupiah X",
        symbol: "IDRX",
        balance: "0",
        balanceFormatted: "0",
        valueIDR: 0,
        logo: "💎",
        network: "Polygon",
        color: "bg-cyan-100",
        textColor: "text-cyan-600",
      });
    }

    // ETH Balance from Ethereum Mainnet - This is where your 0.00437 ETH is
    if (ethBalanceMainnet && ethBalanceMainnet.value > BigInt(0)) {
      const ethAmount = parseFloat(formatUnits(ethBalanceMainnet.value, ethBalanceMainnet.decimals));
      const ethValueIDR = ethAmount * IDR_RATES.ETH;
      balances.push({
        name: "Ethereum",
        symbol: "ETH",
        balance: ethBalanceMainnet.value.toString(),
        balanceFormatted: ethAmount.toFixed(8), // Show full precision
        valueIDR: ethValueIDR,
        logo: "◆",
        network: "Ethereum",
        color: "bg-gray-100",
        textColor: "text-gray-900",
        priceChange: -3.8,
      });
      total += ethValueIDR;
    }

    // ETH Balance from Base network (separate entry)
    if (ethBalanceBase && ethBalanceBase.value > BigInt(0)) {
      const ethAmount = parseFloat(formatUnits(ethBalanceBase.value, ethBalanceBase.decimals));
      const ethValueIDR = ethAmount * IDR_RATES.ETH;
      balances.push({
        name: "Ethereum",
        symbol: "ETH",
        balance: ethBalanceBase.value.toString(),
        balanceFormatted: ethAmount.toFixed(8),
        valueIDR: ethValueIDR,
        logo: "◆",
        network: "Base",
        color: "bg-blue-100",
        textColor: "text-blue-600",
        priceChange: -3.8,
      });
      total += ethValueIDR;
    }

    // USDC Balance - FETCHED FROM BLOCKCHAIN
    if (usdcBalance && usdcBalance.value > BigInt(0)) {
      const usdcAmount = parseFloat(formatUnits(usdcBalance.value, usdcBalance.decimals));
      const usdcValueIDR = usdcAmount * IDR_RATES.USDC;
      balances.push({
        name: "USD Coin",
        symbol: "USDC",
        balance: usdcBalance.value.toString(),
        balanceFormatted: usdcAmount.toFixed(2),
        valueIDR: usdcValueIDR,
        logo: "💵",
        network: "Base",
        color: "bg-green-100",
        textColor: "text-green-600",
        priceChange: -0.1,
      });
      total += usdcValueIDR;
    }

    setTokenBalances(balances);
    setTotalBalanceIDR(total);
  }, [ethBalanceMainnet, ethBalanceBase, usdcBalance, idrxBalance, isConnected, address, ethMainnetLoading, ethBaseLoading, usdcLoading, idrxLoading]);

  // Fetch custom token balances
  useEffect(() => {
    const fetchCustomTokenBalances = async () => {
      if (!isConnected || !address || customTokens.length === 0) return;

      for (const token of customTokens) {
        try {
          const client = getClientForNetwork(token.network);
          if (!client) continue;

          const balance = await client.readContract({
            address: token.address as `0x${string}`,
            abi: ERC20_FULL_ABI,
            functionName: "balanceOf",
            args: [address],
          });

          const tokenAmount = parseFloat(formatUnits(balance as bigint, token.decimals));
          
          if (tokenAmount > 0) {
            // Update tokenBalances to include this custom token
            setTokenBalances(prev => {
              // Check if already in list
              const exists = prev.some(t => 
                t.symbol === token.symbol && t.network.toLowerCase() === token.network.toLowerCase()
              );
              if (exists) return prev;

              return [...prev, {
                name: token.name,
                symbol: token.symbol,
                balance: (balance as bigint).toString(),
                balanceFormatted: tokenAmount.toFixed(token.decimals > 4 ? 4 : token.decimals),
                valueIDR: 0, // No price info for custom tokens
                logo: token.logo,
                network: token.network.charAt(0).toUpperCase() + token.network.slice(1),
                color: "bg-purple-100",
                textColor: "text-purple-600",
              }];
            });
          }
        } catch (error) {
          console.error(`Failed to fetch balance for ${token.symbol}:`, error);
        }
      }
    };

    fetchCustomTokenBalances();
  }, [customTokens, isConnected, address, getClientForNetwork]);

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace("IDR", "Rp");
  };

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendLoading(true);
    
    try {
      // TODO: Implement actual send transaction using wagmi's useContractWrite
      // For now, just show success message
      console.log("Sending", sendAmount, sendToken, "to", sendToAddress);
      alert(`Transaction submitted! Sending ${sendAmount} ${sendToken} to ${sendToAddress}`);
      setSendToAddress("");
      setSendAmount("");
      setShowSendModal(false);
    } catch (error) {
      console.error("Send error:", error);
      alert("Failed to send transaction");
    } finally {
      setSendLoading(false);
    }
  };

  // Handle IDRX Bridge
  const handleBridge = async () => {
    if (!bridgeAmount || parseFloat(bridgeAmount) < 20000) {
      alert("Minimum bridge amount is 20,000 IDRX");
      return;
    }

    // Check if on correct chain
    if (chainId !== bridgeFromChain) {
      try {
        switchChain({ chainId: bridgeFromChain });
        return;
      } catch {
        alert("Please switch to the source network first");
        return;
      }
    }

    const result = await executeBridge(bridgeAmount, bridgeFromChain, bridgeToChain);
    if (result) {
      setBridgeAmount("");
    }
  };

  // Close IDRX Modal
  const handleCloseIDRXModal = () => {
    setShowIDRXModal(false);
    setIdrxTab("buy");
    setBridgeAmount("");
    resetBridge();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 max-w-[480px] mx-auto">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-br from-[#155dfc] to-[#0092b8] px-4 py-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <button 
            className="p-3 hover:bg-white/10 rounded-full transition-colors"
            onClick={() => router.back()}
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white text-xl font-semibold">My Wallet</h1>
          <button 
            className="p-3 hover:bg-white/10 rounded-full transition-colors"
            onClick={() => setShowBalance(!showBalance)}
          >
            <Eye className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Total Balance */}
        <div className="text-center">
          <p className="text-white/80 text-sm mb-2">Total Balance</p>
          <h2 className="text-white text-4xl font-bold mb-2">
            {isLoading ? "Loading..." : showBalance ? formatIDR(totalBalanceIDR) : "Rp ••••••"}
          </h2>
          <p className="text-white/70 text-sm">
            {isLoading ? "Fetching from blockchain..." : `Across ${tokenBalances.length} assets`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <button 
            onClick={() => setShowIDRXModal(true)}
            disabled={!isConnected}
            className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md disabled:opacity-50 transition-all"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Plus className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-gray-800 text-sm font-medium">Buy</span>
          </button>
          <button 
            onClick={() => setShowSendModal(true)}
            disabled={!isConnected}
            className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md disabled:opacity-50 transition-all"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Send className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-gray-800 text-sm font-medium">Send</span>
          </button>
          <button 
            onClick={() => setShowReceiveModal(true)}
            disabled={!isConnected}
            className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md disabled:opacity-50 transition-all"
          >
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <ArrowDownToLine className="w-6 h-6 text-green-500" />
            </div>
            <span className="text-gray-800 text-sm font-medium">Receive</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex">
          <button
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${
              activeTab === "tokens"
                ? "text-[#155dfc] border-b-2 border-[#155dfc]"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("tokens")}
          >
            Tokens
          </button>
          <button
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${
              activeTab === "nfts"
                ? "text-[#155dfc] border-b-2 border-[#155dfc]"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("nfts")}
          >
            NFTs
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {!isConnected ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-500 mb-4">Connect your wallet to view your assets</p>
            <Wallet>
              <ConnectWallet className="mx-auto">
                <span>Connect Wallet</span>
              </ConnectWallet>
              <WalletDropdown>
                <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                  <Avatar />
                  <Name />
                </Identity>
                <WalletDropdownDisconnect />
              </WalletDropdown>
            </Wallet>
          </div>
        ) : activeTab === "tokens" ? (
          <div className="space-y-3">
            {/* Token List */}
            {tokenBalances.map((token, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  {/* Token Icon */}
                  <div className={`w-14 h-14 ${token.color} rounded-full flex items-center justify-center text-2xl`}>
                    {token.logo}
                  </div>

                  {/* Token Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{token.name}</h3>
                    <p className="text-sm text-gray-500">
                      {token.symbol} · {token.network}
                    </p>
                  </div>

                  {/* Balance */}
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {showBalance ? `${token.balanceFormatted} ${token.symbol}` : "••••"}
                    </p>
                    <div className="flex items-center justify-end gap-1">
                      <p className="text-sm text-gray-500">
                        {showBalance ? formatIDR(token.valueIDR) : "••••"}
                      </p>
                      {token.priceChange !== undefined && (
                        <span className={`text-xs flex items-center ${
                          token.priceChange >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {token.priceChange >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {Math.abs(token.priceChange)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Custom Token */}
            <button 
              onClick={() => setShowAddTokenModal(true)}
              className="w-full bg-white rounded-2xl shadow-sm border-2 border-dashed border-gray-300 p-4 hover:border-[#155dfc] hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Plus className="w-5 h-5" />
                <span className="font-medium">Add Custom Token</span>
              </div>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-500">No NFTs found</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavbar activeTab="wallet" />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODALS */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {/* SEND MODAL */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 max-w-[480px] mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Send Token</h2>
              <button onClick={() => setShowSendModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSend} className="space-y-4">
              {/* Select Network */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Network</label>
                <select
                  value={sendNetwork}
                  onChange={(e) => setSendNetwork(e.target.value as "base" | "ethereum" | "polygon")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="base">Base (Mainnet)</option>
                  <option value="ethereum">Ethereum (Mainnet)</option>
                  <option value="polygon">Polygon (Mainnet)</option>
                </select>
              </div>

              {/* Select Token */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Token</label>
                <select
                  value={sendToken}
                  onChange={(e) => setSendToken(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ETH">ETH</option>
                  <option value="USDC">USDC</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  step="0.0001"
                  placeholder="0.00"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Recipient Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Address</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={sendToAddress}
                  onChange={(e) => setSendToAddress(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs"
                  required
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={sendLoading || !sendAmount || !sendToAddress}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium py-3 rounded-xl transition-colors"
              >
                {sendLoading ? "Sending..." : "Send"}
              </button>
            </form>

            <p className="text-xs text-gray-500 text-center mt-4">
              ⚠️ Make sure the address is correct on {sendNetwork.toUpperCase()}. You cannot undo this transaction.
            </p>
          </div>
        </div>
      )}

      {/* RECEIVE MODAL */}
      {showReceiveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 max-w-[480px] mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Receive Crypto</h2>
              <button onClick={() => setShowReceiveModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-xs text-blue-800">
                  💡 <strong>Tip:</strong> Your address is the same across all EVM networks (Ethereum, Base, Polygon). The sender must use the <strong>same network</strong> for you to access the tokens.
                </p>
              </div>

              {/* Select Network */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Network</label>
                <select
                  value={receiveNetwork}
                  onChange={(e) => setReceiveNetwork(e.target.value as "base" | "ethereum" | "polygon")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="base">Base (Mainnet) - ETH, USDC</option>
                  <option value="ethereum">Ethereum (Mainnet) - ETH</option>
                  <option value="polygon">Polygon (Mainnet) - MATIC, IDRX</option>
                </select>
              </div>

              {/* QR Code Placeholder */}
              <div className="bg-gray-50 rounded-2xl p-8 flex items-center justify-center">
                <div className="w-48 h-48 bg-white border-4 border-dashed border-gray-300 rounded-xl flex items-center justify-center">
                  <span className="text-gray-400 text-6xl">⬜</span>
                </div>
              </div>

              {/* Your Address */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-600 mb-2">
                  Your Wallet Address 
                  <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-medium">
                    {receiveNetwork === "base" ? "Base" : receiveNetwork === "ethereum" ? "Ethereum" : "Polygon"}
                  </span>
                </p>
                <p className="font-mono text-sm break-all text-gray-900 mb-3">{address}</p>
                <button
                  onClick={handleCopyAddress}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-900 font-medium py-2 rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Address</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                ⚠️ Make sure the sender selects <strong>{receiveNetwork === "base" ? "Base" : receiveNetwork === "ethereum" ? "Ethereum" : "Polygon"}</strong> network in their wallet. If wrong network is used, tokens won't appear in your balance!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* IDRX MODAL - Buy & Bridge */}
      {showIDRXModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 max-w-[480px] mx-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="text-2xl">💎</span> IDRX
              </h2>
              <button onClick={handleCloseIDRXModal} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
              <button
                onClick={() => setIdrxTab("buy")}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  idrxTab === "buy" ? "bg-white text-cyan-600 shadow-sm" : "text-gray-600"
                }`}
              >
                Buy IDRX
              </button>
              <button
                onClick={() => setIdrxTab("bridge")}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  idrxTab === "bridge" ? "bg-white text-cyan-600 shadow-sm" : "text-gray-600"
                }`}
              >
                Bridge
              </button>
            </div>

            {idrxTab === "buy" ? (
              /* BUY TAB */
              <div className="space-y-4">
                <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
                  <h3 className="font-semibold text-cyan-800 mb-2">What is IDRX?</h3>
                  <p className="text-sm text-cyan-700">
                    IDRX is a stablecoin pegged 1:1 to Indonesian Rupiah. 
                    You can use it for QRIS payments and wallet transfers.
                  </p>
                </div>

                {/* Current Balance */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Your IDRX Balance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {idrxBalance 
                      ? parseFloat(formatUnits(idrxBalance.value, 2)).toLocaleString("id-ID")
                      : "0"
                    } IDRX
                  </p>
                  <p className="text-sm text-gray-500">
                    ≈ Rp {idrxBalance 
                      ? parseFloat(formatUnits(idrxBalance.value, 2)).toLocaleString("id-ID")
                      : "0"
                    }
                  </p>
                </div>

                {/* Buy Options */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">How to Buy IDRX:</h4>
                  
                  {/* Option 1: IDRX.co */}
                  <a
                    href="https://idrx.co"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-cyan-300 hover:bg-cyan-50 transition-colors"
                  >
                    <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">🏦</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">IDRX.co (Official)</p>
                      <p className="text-sm text-gray-500">Buy directly with bank transfer</p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-gray-400" />
                  </a>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                  <p className="text-xs text-yellow-800">
                    ⚠️ <strong>Tips:</strong> After purchasing IDRX, withdraw to your wallet address on <strong>Polygon network</strong> to use it in QRypto.
                  </p>
                </div>
              </div>
            ) : (
              /* BRIDGE TAB */
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">Bridge IDRX</h3>
                  <p className="text-sm text-blue-700">
                    Transfer IDRX between blockchains. Processing takes up to 24 hours.
                  </p>
                </div>

                {bridgeStep === "idle" || bridgeStep === "error" ? (
                  <>
                    {/* From Chain */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">From Network</label>
                      <select
                        value={bridgeFromChain}
                        onChange={(e) => setBridgeFromChain(Number(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      >
                        {supportedChains.map((chain) => (
                          <option key={chain.id} value={chain.id}>
                            {chain.logo} {chain.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center">
                      <div className="bg-gray-100 rounded-full p-2">
                        <ArrowDownToLine className="w-5 h-5 text-gray-500" />
                      </div>
                    </div>

                    {/* To Chain */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">To Network</label>
                      <select
                        value={bridgeToChain}
                        onChange={(e) => setBridgeToChain(Number(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      >
                        {supportedChains
                          .filter((c) => c.id !== bridgeFromChain)
                          .map((chain) => (
                            <option key={chain.id} value={chain.id}>
                              {chain.logo} {chain.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="20000"
                          value={bridgeAmount}
                          onChange={(e) => setBridgeAmount(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent pr-16"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                          IDRX
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Minimum: 20,000 IDRX</p>
                    </div>

                    {bridgeError && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-sm text-red-700">{bridgeError}</p>
                      </div>
                    )}

                    {/* Bridge Button */}
                    <button
                      onClick={handleBridge}
                      disabled={!bridgeAmount || parseFloat(bridgeAmount) < 20000}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-medium py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      {chainId !== bridgeFromChain ? (
                        <>Switch to {supportedChains.find(c => c.id === bridgeFromChain)?.name}</>
                      ) : (
                        <>
                          <ArrowRightLeft className="w-5 h-5" />
                          Bridge IDRX
                        </>
                      )}
                    </button>
                  </>
                ) : bridgeStep === "burning" || bridgeStep === "confirming" || bridgeStep === "submitting" ? (
                  /* Processing */
                  <div className="text-center py-8 space-y-4">
                    <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto">
                      <RefreshCw className="w-8 h-8 text-cyan-600 animate-spin" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">
                        {bridgeStep === "burning" && "Burning IDRX..."}
                        {bridgeStep === "confirming" && "Confirming transaction..."}
                        {bridgeStep === "submitting" && "Submitting bridge request..."}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Please don't close this page
                      </p>
                    </div>
                  </div>
                ) : bridgeStep === "success" ? (
                  /* Success */
                  <div className="text-center py-8 space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-green-600 mb-1">Bridge Submitted!</h3>
                      <p className="text-sm text-gray-500">
                        IDRX will be sent within 24 hours
                      </p>
                    </div>
                    {bridgeTxHash && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-1">Transaction Hash:</p>
                        <p className="text-xs font-mono text-gray-700 break-all">{bridgeTxHash}</p>
                      </div>
                    )}
                    <button
                      onClick={handleCloseIDRXModal}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium py-4 rounded-xl"
                    >
                      Done
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Custom Token Modal */}
      {showAddTokenModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold">Add Custom Token</h2>
              <button 
                onClick={() => {
                  setShowAddTokenModal(false);
                  setCustomTokenAddress("");
                  setCustomTokenSymbol("");
                  setCustomTokenName("");
                  setCustomTokenDecimals("18");
                  setTokenInfoError("");
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Network Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Network</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["polygon", "base", "ethereum"] as const).map((network) => (
                    <button
                      key={network}
                      onClick={() => handleNetworkChange(network)}
                      className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                        customTokenNetwork === network
                          ? "bg-[#155dfc] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {network === "polygon" ? "Polygon" : network === "base" ? "Base" : "Ethereum"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Token Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Token Contract Address</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="0x..."
                    value={customTokenAddress}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                  {fetchingTokenInfo && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Token Info (auto-filled) */}
              {customTokenSymbol && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {customTokenSymbol.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{customTokenName}</p>
                      <p className="text-sm text-gray-500">{customTokenSymbol}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-white rounded-lg p-2">
                      <span className="text-gray-500">Decimals:</span>
                      <span className="ml-2 font-medium">{customTokenDecimals}</span>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <span className="text-gray-500">Network:</span>
                      <span className="ml-2 font-medium capitalize">{customTokenNetwork}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {tokenInfoError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-sm text-red-700">{tokenInfoError}</p>
                </div>
              )}

              {/* Add Button */}
              <button
                onClick={handleAddCustomToken}
                disabled={!customTokenAddress || !customTokenSymbol || addingToken || fetchingTokenInfo}
                className="w-full bg-[#155dfc] hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {addingToken ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Adding Token...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Add Token
                  </>
                )}
              </button>

              {/* Custom Tokens List */}
              {customTokens.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Your Custom Tokens</h3>
                  <div className="space-y-2">
                    {customTokens.map((token) => (
                      <div 
                        key={`${token.address}-${token.network}`}
                        className="flex items-center justify-between bg-gray-50 rounded-xl p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {token.symbol.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{token.symbol}</p>
                            <p className="text-xs text-gray-500 capitalize">{token.network}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveCustomToken(token.address, token.network)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
