"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownBasename,
  WalletDropdownFundLink,
  WalletDropdownLink,
  WalletDropdownDisconnect,
  WalletAdvancedAddressDetails,
  WalletAdvancedTokenHoldings,
  WalletAdvancedTransactionActions,
  WalletAdvancedWalletActions,
} from "@coinbase/onchainkit/wallet";
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import { Swap, SwapAmountInput, SwapButton, SwapMessage, SwapToggleButton } from "@coinbase/onchainkit/swap";
import { FundButton } from "@coinbase/onchainkit/fund";
import { useAuth } from "../context/AuthContext";
import BottomNavbar from "../components/BottomNavbar";
import { ChevronLeft, Settings, History, User, ArrowLeftRight, Plus, QrCode, Send, ArrowDownToLine } from "lucide-react";

// Token configurations for swap
const ETH_TOKEN = {
  name: "Ethereum",
  address: "" as `0x${string}`,
  symbol: "ETH",
  decimals: 18,
  image: "https://wallet-api-production.s3.amazonaws.com/uploads/tokens/eth_288.png",
  chainId: 8453,
};

const USDC_TOKEN = {
  name: "USDC",
  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`,
  symbol: "USDC",
  decimals: 6,
  image: "https://d3r81g40ber22s.cloudfront.net/wallet/wais/44/2b/442b80bd16af0c0d9b22e03a16753823fe826e5bfd457292b55fa0ba8c1ba213-ZWUzYjJmZGUtMDYxNy00NDcyLTg0NjQtMWI4OGEwYjBiODE2",
  chainId: 8453,
};

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "swap" | "buy">("overview");
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 pb-24 max-w-[480px] mx-auto">
      {/* Header */}
      <div className="bg-linear-to-br from-[#155dfc] to-[#0092b8] px-4 py-4">
        <div className="flex items-center justify-between">
          <button 
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            onClick={() => router.back()}
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white text-lg font-semibold">My Wallet</h1>
          
          {/* Advanced Wallet Component */}
          <div className="flex items-center">
            <Wallet>
              <ConnectWallet className="!bg-white/20 !border-white/30 hover:!bg-white/30">
                <Avatar className="h-6 w-6" />
                <Name className="text-white text-sm" />
              </ConnectWallet>
              <WalletDropdown>
                <WalletAdvancedWalletActions />
                <WalletAdvancedAddressDetails />
                <WalletAdvancedTransactionActions />
                <WalletAdvancedTokenHoldings />
              </WalletDropdown>
            </Wallet>
          </div>
        </div>

        {/* User Welcome */}
        {isConnected && user?.fullName && (
          <div className="mt-4 text-center">
            <p className="text-white/80 text-sm">Welcome back,</p>
            <p className="text-white text-xl font-medium">{user.fullName}</p>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex">
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "overview"
                ? "text-[#155dfc] border-b-2 border-[#155dfc]"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "swap"
                ? "text-[#155dfc] border-b-2 border-[#155dfc]"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("swap")}
          >
            Swap
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "buy"
                ? "text-[#155dfc] border-b-2 border-[#155dfc]"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("buy")}
          >
            Buy
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Wallet Identity Card */}
            {isConnected && address ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-linear-to-br from-[#155dfc]/10 to-[#0092b8]/10 p-4">
                  <Identity
                    address={address}
                    className="!bg-transparent"
                    hasCopyAddressOnClick
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16 rounded-full shadow-lg" />
                      <div className="flex-1">
                        <Name className="text-lg font-semibold text-gray-900" />
                        <Address className="text-sm text-gray-500" />
                        <EthBalance className="text-sm font-medium text-[#155dfc] mt-1" />
                      </div>
                    </div>
                  </Identity>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                <p className="text-gray-500 mb-4">Connect your wallet to view your assets</p>
                <Wallet>
                  <ConnectWallet className="mx-auto">
                    <span>Connect Wallet</span>
                  </ConnectWallet>
                </Wallet>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-4 gap-2">
                <button 
                  onClick={() => setActiveTab("buy")}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Plus className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-xs text-gray-600">Buy</span>
                </button>
                <button 
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Send className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-xs text-gray-600">Send</span>
                </button>
                <button 
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <ArrowDownToLine className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-xs text-gray-600">Receive</span>
                </button>
                <button 
                  onClick={() => setActiveTab("swap")}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <ArrowLeftRight className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="text-xs text-gray-600">Swap</span>
                </button>
              </div>
            </div>

            {/* Fund Wallet Section */}
            {isConnected && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Add Funds</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Easily add funds to your wallet using Coinbase Onramp or Magic Spend.
                </p>
                <FundButton className="w-full" />
              </div>
            )}

            {/* Advanced Wallet Default */}
            {isConnected && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <h3 className="text-sm font-semibold text-gray-700 p-4 border-b border-gray-100">
                  Wallet Details
                </h3>
                <div className="p-2">
                  <Wallet>
                    <ConnectWallet>
                      <Avatar className="h-6 w-6" />
                      <Name />
                    </ConnectWallet>
                    <WalletDropdown>
                      <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                        <Avatar />
                        <Name />
                        <Address className="text-gray-500" />
                        <EthBalance />
                      </Identity>
                      <WalletDropdownBasename />
                      <WalletDropdownLink icon="wallet" href="https://keys.coinbase.com" target="_blank">
                        Coinbase Wallet
                      </WalletDropdownLink>
                      <WalletDropdownLink icon={<Settings className="w-4 h-4" />} href="/settings">
                        Settings
                      </WalletDropdownLink>
                      <WalletDropdownLink icon={<History className="w-4 h-4" />} href="/history">
                        History
                      </WalletDropdownLink>
                      <WalletDropdownLink icon={<User className="w-4 h-4" />} href="/profile">
                        Profile
                      </WalletDropdownLink>
                      <WalletDropdownFundLink />
                      <WalletDropdownDisconnect />
                    </WalletDropdown>
                  </Wallet>
                </div>
              </div>
            )}

            {/* Menu Links */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button 
                onClick={() => router.push("/history")}
                className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <History className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">Transaction History</p>
                  <p className="text-sm text-gray-500">View all transactions</p>
                </div>
                <ChevronLeft className="w-5 h-5 text-gray-400 rotate-180" />
              </button>
              <button 
                onClick={() => router.push("/settings")}
                className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Settings className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">Wallet Settings</p>
                  <p className="text-sm text-gray-500">Manage preferences</p>
                </div>
                <ChevronLeft className="w-5 h-5 text-gray-400 rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* Swap Tab */}
        {activeTab === "swap" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Swap Tokens</h3>
              <p className="text-sm text-gray-500 mb-4">
                Exchange tokens instantly with the best rates on Base network.
              </p>
              
              {isConnected ? (
                <Swap>
                  <SwapAmountInput
                    label="Sell"
                    swappableTokens={[ETH_TOKEN, USDC_TOKEN]}
                    token={ETH_TOKEN}
                    type="from"
                  />
                  <SwapToggleButton />
                  <SwapAmountInput
                    label="Buy"
                    swappableTokens={[ETH_TOKEN, USDC_TOKEN]}
                    token={USDC_TOKEN}
                    type="to"
                  />
                  <SwapButton />
                  <SwapMessage />
                </Swap>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Connect wallet to swap tokens</p>
                  <Wallet>
                    <ConnectWallet className="mx-auto">
                      <span>Connect Wallet</span>
                    </ConnectWallet>
                  </Wallet>
                </div>
              )}
            </div>

            {/* Swap Info */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <h4 className="font-medium text-blue-900 mb-2">About Swapping</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• No hidden fees - you see the exact amount you&apos;ll receive</li>
                <li>• Swaps happen on Base network for low gas fees</li>
                <li>• Powered by OnchainKit for secure transactions</li>
              </ul>
            </div>
          </div>
        )}

        {/* Buy Tab */}
        {activeTab === "buy" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Buy Crypto</h3>
              <p className="text-sm text-gray-500 mb-4">
                Purchase crypto with fiat using Coinbase Onramp. Fast, secure, and easy.
              </p>
              
              {isConnected ? (
                <div className="space-y-4">
                  <FundButton className="w-full h-14 text-lg" />
                  
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-sm text-gray-500">or</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {/* QR Code for receiving */}
                  <div className="bg-gray-50 rounded-xl p-6 text-center">
                    <div className="w-32 h-32 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center border-2 border-dashed border-gray-300">
                      <QrCode className="w-16 h-16 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Receive crypto to your address</p>
                    {address && (
                      <p className="text-xs text-gray-500 font-mono break-all">
                        {address}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Connect wallet to buy crypto</p>
                  <Wallet>
                    <ConnectWallet className="mx-auto">
                      <span>Connect Wallet</span>
                    </ConnectWallet>
                  </Wallet>
                </div>
              )}
            </div>

            {/* Buy Info */}
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
              <h4 className="font-medium text-green-900 mb-2">Coinbase Onramp</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Buy crypto with credit/debit card or bank transfer</li>
                <li>• Use existing Coinbase balance with Magic Spend</li>
                <li>• Competitive rates and fast transactions</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavbar activeTab="wallet" />
    </div>
  );
}
