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
} from "@coinbase/onchainkit/wallet";
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import { useAuth } from "../context/AuthContext";
import BottomNavbar from "../components/BottomNavbar";
import { History, Settings, User } from "lucide-react";

// Token data
const tokens = [
  {
    id: 1,
    name: "Indonesian Rupiah X",
    symbol: "IDRX",
    network: "Polygon",
    balance: "1.500.000",
    balanceUsd: "Rp 1.500.000",
    change: null,
    icon: "💎",
    iconBg: "#E8F4FD",
  },
  {
    id: 2,
    name: "Polygon",
    symbol: "MATIC",
    network: "Polygon",
    balance: "125,5",
    balanceUsd: "Rp 150.000",
    change: "+5.2%",
    changeType: "positive",
    icon: "🟣",
    iconBg: "#F3E8FF",
  },
  {
    id: 3,
    name: "USD Coin",
    symbol: "USDC",
    network: "Polygon",
    balance: "50",
    balanceUsd: "Rp 800.000",
    change: "-0.1%",
    changeType: "negative",
    icon: "💵",
    iconBg: "#E8F8F0",
  },
  {
    id: 4,
    name: "Ethereum",
    symbol: "ETH",
    network: "Ethereum",
    balance: "0,0500",
    balanceUsd: "Rp 2.500.000",
    change: "-3.8%",
    changeType: "negative",
    icon: "◇",
    iconBg: "#F0F0F0",
  },
];

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<"tokens" | "nfts">("tokens");
  const [balanceVisible, setBalanceVisible] = useState(true);
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { user } = useAuth();

  const totalBalance = "Rp 4.950.000";

  return (
    <div className="app-container">
      {/* Header with Wallet Component */}
      <div className="wallet-header">
        <button className="header-btn-light" onClick={() => router.back()}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18L9 12L15 6"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1 className="header-title-light">My Wallet</h1>
        
        {/* OnchainKit Wallet Component */}
        <div className="flex items-center">
          <Wallet>
            <ConnectWallet>
              <Avatar className="h-6 w-6" />
              <Name className="text-white text-sm" />
            </ConnectWallet>
            <WalletDropdown>
              <Identity 
                className="px-4 pt-3 pb-2 hover:bg-gray-100"
                hasCopyAddressOnClick
              >
                <Avatar />
                <Name />
                <Address className="text-gray-500" />
                <EthBalance />
              </Identity>
              <WalletDropdownBasename />
              <WalletDropdownLink
                icon="wallet"
                href="https://keys.coinbase.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Coinbase Wallet
              </WalletDropdownLink>
              <WalletDropdownLink
                icon={<Settings className="w-4 h-4" />}
                href="/settings"
              >
                Settings
              </WalletDropdownLink>
              <WalletDropdownLink
                icon={<History className="w-4 h-4" />}
                href="/history"
              >
                History
              </WalletDropdownLink>
              <WalletDropdownLink
                icon={<User className="w-4 h-4" />}
                href="/profile"
              >
                Profile
              </WalletDropdownLink>
              <WalletDropdownFundLink />
              <WalletDropdownDisconnect />
            </WalletDropdown>
          </Wallet>
        </div>
      </div>

      {/* User Info Card - Show logged in user */}
      {isConnected && user && (
        <div className="mx-4 mt-4 p-4 bg-linear-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Avatar address={address} className="h-12 w-12" />
            <div className="flex-1">
              <Name address={address} className="text-white font-semibold text-lg" />
              <Address address={address} className="text-white/80 text-sm" />
            </div>
          </div>
          {user.fullName && (
            <p className="text-white/90 text-sm mt-2">
              Welcome back, {user.fullName}!
            </p>
          )}
        </div>
      )}

      {/* Balance Section */}
      <div className="balance-section">
        <p className="balance-label">Total Balance</p>
        <div className="flex items-center justify-center gap-2">
          <h2 className="balance-amount">
            {balanceVisible ? totalBalance : "••••••••"}
          </h2>
          <button
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setBalanceVisible(!balanceVisible)}
          >
            {balanceVisible ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="3"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M17.94 17.94A10.07 10.07 0 0112 20C5 20 1 12 1 12A18.45 18.45 0 015.06 6.06M9.9 4.24A9.12 9.12 0 0112 4C19 4 23 12 23 12A18.5 18.5 0 0119.18 16.82M1 1L23 23"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
        <p className="asset-count">Across 4 assets</p>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="action-btn">
            <div className="action-icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5V19M5 12H19"
                  stroke="#2563EB"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="action-label">Buy</span>
          </button>
          <button className="action-btn">
            <div className="action-icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                  stroke="#2563EB"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="action-label">Send</span>
          </button>
          <button className="action-btn">
            <div className="action-icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 19V5M5 12L12 5L19 12"
                  stroke="#22C55E"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="action-label">Receive</span>
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="content-section">
        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === "tokens" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("tokens")}
          >
            Tokens
          </button>
          <button
            className={`tab ${activeTab === "nfts" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("nfts")}
          >
            NFTs
          </button>
        </div>

        {/* Token List */}
        {activeTab === "tokens" && (
          <div className="token-list">
            {tokens.map((token) => (
              <div key={token.id} className="token-item">
                <div className="token-icon" style={{ backgroundColor: token.iconBg }}>
                  {token.icon}
                </div>
                <div className="token-info">
                  <p className="token-name">{token.name}</p>
                  <p className="token-meta">
                    {token.symbol} • {token.network}
                  </p>
                </div>
                <div className="token-balance">
                  <p className="token-amount">
                    {balanceVisible ? `${token.balance} ${token.symbol}` : "••••••"}
                  </p>
                  <p className="token-usd">
                    {balanceVisible ? token.balanceUsd : "••••••"}
                    {token.change && (
                      <span
                        className={
                          token.changeType === "positive"
                            ? "change-positive"
                            : "change-negative"
                        }
                      >
                        {" "}
                        {token.change}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}

            {/* Add Custom Token */}
            <button className="add-token-btn">
              <span className="add-token-icon">+</span>
              <span>Add Custom Token</span>
            </button>
          </div>
        )}

        {activeTab === "nfts" && (
          <div className="nft-section">
            <p className="empty-message">No NFTs found</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavbar activeTab="wallet" />
    </div>
  );
}
