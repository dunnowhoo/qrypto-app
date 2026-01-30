"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useBalance } from "wagmi";
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
import { Swap, SwapAmountInput, SwapButton, SwapMessage, SwapToggleButton } from "@coinbase/onchainkit/swap";
import { useAuth } from "../context/AuthContext";
import BottomNavbar from "../components/BottomNavbar";
import { ChevronLeft, Eye, Send, ArrowDownToLine, TrendingUp, TrendingDown, X, Copy, Check, Plus } from "lucide-react";
import { formatUnits } from "viem";
import { base } from "wagmi/chains";

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

// IDR exchange rate (mock - in production, fetch from API)
const IDR_RATES: Record<string, number> = {
  ETH: 50000000, // 1 ETH = 50,000,000 IDR
  USDC: 16000, // 1 USDC = 16,000 IDR
  MATIC: 1200, // 1 MATIC = 1,200 IDR
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

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<"tokens" | "nfts">("tokens");
  const [showBalance, setShowBalance] = useState(true);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [totalBalanceIDR, setTotalBalanceIDR] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Modal states
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  
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

  // ═══════════════════════════════════════════════════════════════════
  // ONCHAIN DATA FETCHING - Using Wagmi hooks to fetch real blockchain data
  // ═══════════════════════════════════════════════════════════════════

  // Fetch native ETH balance from Base network
  // This queries the blockchain and returns real-time balance
  const { data: ethBalance, isLoading: ethLoading } = useBalance({
    address: address,
    chainId: base.id,
  });

  // Fetch USDC token balance from Base network
  // USDC on Base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
  const { data: usdcBalance, isLoading: usdcLoading } = useBalance({
    address: address,
    token: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
    chainId: base.id,
  });

  // Calculate balances and convert to IDR
  // This effect updates whenever blockchain data changes
  useEffect(() => {
    setIsLoading(ethLoading || usdcLoading);
    
    if (!isConnected || !address) {
      setTokenBalances([]);
      setTotalBalanceIDR(0);
      return;
    }

    const balances: TokenBalance[] = [];
    let total = 0;

    // ETH Balance - FETCHED FROM BLOCKCHAIN
    if (ethBalance) {
      const ethAmount = parseFloat(formatUnits(ethBalance.value, ethBalance.decimals));
      const ethValueIDR = ethAmount * IDR_RATES.ETH;
      balances.push({
        name: "Ethereum",
        symbol: "ETH",
        balance: ethBalance.value.toString(),
        balanceFormatted: ethAmount.toFixed(4),
        valueIDR: ethValueIDR,
        logo: "◆",
        network: "Base",
        color: "bg-gray-100",
        textColor: "text-gray-900",
        priceChange: 3.8,
      });
      total += ethValueIDR;
    }

    // USDC Balance - FETCHED FROM BLOCKCHAIN
    if (usdcBalance) {
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
        color: "bg-blue-100",
        textColor: "text-blue-600",
        priceChange: -0.1,
      });
      total += usdcValueIDR;
    }

    // TODO: Add IDRX and MATIC balances by:
    // 1. Get contract address from deployment
    // 2. Use useReadContracts to fetch balanceOf from these contracts
    // 3. Add to balances array with real onchain data
    
    // Mock IDRX and MATIC for demo (replace with actual onchain data)
    if (!ethBalance || !usdcBalance) {
      // Only show mock data if no real data loaded yet
      balances.unshift({
        name: "Indonesian Rupiah X",
        symbol: "IDRX",
        balance: "1500000",
        balanceFormatted: "1.500.000",
        valueIDR: 1500000,
        logo: "💎",
        network: "Base",
        color: "bg-blue-100",
        textColor: "text-blue-600",
      });
      total += 1500000;

      balances.splice(1, 0, {
        name: "Polygon",
        symbol: "MATIC",
        balance: "125500000000000000000",
        balanceFormatted: "125,5",
        valueIDR: 150000,
        logo: "⬡",
        network: "Base",
        color: "bg-purple-100",
        textColor: "text-purple-600",
        priceChange: 5.2,
      });
      total += 150000;
    }

    setTokenBalances(balances);
    setTotalBalanceIDR(total);
  }, [ethBalance, usdcBalance, isConnected, address, ethLoading, usdcLoading]);

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
            onClick={() => setShowSwapModal(true)}
            disabled={!isConnected}
            className="bg-white/20 backdrop-blur-sm hover:bg-white/30 disabled:opacity-50 rounded-2xl p-4 transition-colors"
          >
            <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center mx-auto mb-2">
              <ArrowDownToLine className="w-6 h-6 text-white rotate-45" />
            </div>
            <span className="text-white text-sm font-medium">Swap</span>
          </button>
          <button 
            onClick={() => setShowSendModal(true)}
            disabled={!isConnected}
            className="bg-white/20 backdrop-blur-sm hover:bg-white/30 disabled:opacity-50 rounded-2xl p-4 transition-colors"
          >
            <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center mx-auto mb-2">
              <Send className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-sm font-medium">Send</span>
          </button>
          <button 
            onClick={() => setShowReceiveModal(true)}
            disabled={!isConnected}
            className="bg-white/20 backdrop-blur-sm hover:bg-white/30 disabled:opacity-50 rounded-2xl p-4 transition-colors"
          >
            <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center mx-auto mb-2">
              <ArrowDownToLine className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-sm font-medium">Receive</span>
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
            <button className="w-full bg-white rounded-2xl shadow-sm border-2 border-dashed border-gray-300 p-4 hover:border-[#155dfc] hover:bg-blue-50 transition-colors">
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
              {/* Select Network */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Network</label>
                <select
                  value={receiveNetwork}
                  onChange={(e) => setReceiveNetwork(e.target.value as "base" | "ethereum" | "polygon")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="base">Base (Mainnet)</option>
                  <option value="ethereum">Ethereum (Mainnet)</option>
                  <option value="polygon">Polygon (Mainnet)</option>
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
                <p className="text-xs text-gray-600 mb-2">Your Wallet Address on {receiveNetwork.toUpperCase()}</p>
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
                ⚠️ Only send {receiveNetwork.toUpperCase()} network tokens to this address. Sending from other networks may result in loss of funds.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SWAP MODAL */}
      {showSwapModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 max-w-[480px] mx-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Swap Tokens</h2>
              <button onClick={() => setShowSwapModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-600 text-sm">
                Exchange tokens instantly with the best rates on Base network.
              </p>
              
              {isConnected ? (
                <Swap>
                  <SwapAmountInput
                    label="Sell"
                    swappableTokens={[
                      {
                        name: "Ethereum",
                        address: "" as `0x${string}`,
                        symbol: "ETH",
                        decimals: 18,
                        image: "https://wallet-api-production.s3.amazonaws.com/uploads/tokens/eth_288.png",
                        chainId: 8453,
                      },
                      {
                        name: "USDC",
                        address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`,
                        symbol: "USDC",
                        decimals: 6,
                        image: "https://d3r81g40ber22s.cloudfront.net/wallet/wais/44/2b/442b80bd16af0c0d9b22e03a16753823fe826e5bfd457292b55fa0ba8c1ba213-ZWUzYjJmZGUtMDYxNy00NDcyLTg0NjQtMWI4OGEwYjBiODE2",
                        chainId: 8453,
                      },
                    ]}
                    token={{
                      name: "Ethereum",
                      address: "" as `0x${string}`,
                      symbol: "ETH",
                      decimals: 18,
                      image: "https://wallet-api-production.s3.amazonaws.com/uploads/tokens/eth_288.png",
                      chainId: 8453,
                    }}
                    type="from"
                  />
                  <SwapToggleButton />
                  <SwapAmountInput
                    label="Buy"
                    swappableTokens={[
                      {
                        name: "Ethereum",
                        address: "" as `0x${string}`,
                        symbol: "ETH",
                        decimals: 18,
                        image: "https://wallet-api-production.s3.amazonaws.com/uploads/tokens/eth_288.png",
                        chainId: 8453,
                      },
                      {
                        name: "USDC",
                        address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`,
                        symbol: "USDC",
                        decimals: 6,
                        image: "https://d3r81g40ber22s.cloudfront.net/wallet/wais/44/2b/442b80bd16af0c0d9b22e03a16753823fe826e5bfd457292b55fa0ba8c1ba213-ZWUzYjJmZGUtMDYxNy00NDcyLTg0NjQtMWI4OGEwYjBiODE2",
                        chainId: 8453,
                      },
                    ]}
                    token={{
                      name: "USDC",
                      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`,
                      symbol: "USDC",
                      decimals: 6,
                      image: "https://d3r81g40ber22s.cloudfront.net/wallet/wais/44/2b/442b80bd16af0c0d9b22e03a16753823fe826e5bfd457292b55fa0ba8c1ba213-ZWUzYjJmZGUtMDYxNy00NDcyLTg0NjQtMWI4OGEwYjBiODE2",
                      chainId: 8453,
                    }}
                    type="to"
                  />
                  <SwapButton />
                  <SwapMessage />
                </Swap>
              ) : (
                <p className="text-gray-500 text-center py-8">Connect wallet to swap tokens</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
