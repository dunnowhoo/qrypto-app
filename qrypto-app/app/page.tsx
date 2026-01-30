"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, QrCode, ChevronDown, ArrowUpRight, ArrowDownLeft, AlertCircle } from "lucide-react";
import BottomNavbar from "./components/BottomNavbar";
import Link from "next/link";
import { useAuth } from "./context/AuthContext";
import Onboarding from "./components/Onboarding";

// Transaction interface
interface Transaction {
  id: string;
  name: string;
  date: string;
  amount: number;
  status: "success" | "pending" | "failed";
  category: string;
  icon: string;
  bgColor: string;
}

// Sample transactions
const transactions: Transaction[] = [
  {
    id: "1",
    name: "Kopi Kenangan",
    date: "28 Dec",
    amount: -35000,
    status: "success",
    category: "cafe",
    icon: "☕",
    bgColor: "#fef3c6",
  },
  {
    id: "2",
    name: "Indomaret",
    date: "27 Dec",
    amount: -125000,
    status: "success",
    category: "grocery",
    icon: "🛒",
    bgColor: "#cefafe",
  },
  {
    id: "3",
    name: "Grab Transport",
    date: "26 Dec",
    amount: -45000,
    status: "success",
    category: "transport",
    icon: "🚗",
    bgColor: "#dcfce7",
  },
  {
    id: "4",
    name: "Shopee",
    date: "25 Dec",
    amount: -250000,
    status: "pending",
    category: "shopping",
    icon: "🛍️",
    bgColor: "#dbeafe",
  },
  {
    id: "5",
    name: "Warteg Bahari",
    date: "24 Dec",
    amount: -25000,
    status: "success",
    category: "food",
    icon: "🍜",
    bgColor: "#ffedd4",
  },
];

const categories = [
  { id: "all", name: "All", icon: null },
  { id: "food", name: "Food", icon: "🍔" },
  { id: "shopping", name: "Shopping", icon: "🛍️" },
  { id: "transport", name: "Transport", icon: "🚗" },
  { id: "grocery", name: "Grocery", icon: "🛒" },
  { id: "cafe", name: "Cafe", icon: "☕" },
  { id: "tech", name: "Tech", icon: "💻" },
  { id: "other", name: "Other", icon: "📦" },
];

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user, needsOnboarding } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Get user initials from fullName
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  const [selectedMonth] = useState("December 2025");
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    
    if (!hasSeenOnboarding) {
      // First time user - show onboarding
      setShowOnboarding(true);
    } else if (!isAuthenticated) {
      // Has seen onboarding but not logged in - redirect to login
      router.push("/login");
    } else {
      // Already logged in - show homepage
      setShowOnboarding(false);
    }
  }, [isAuthenticated, router]);

  const handleOnboardingComplete = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setShowOnboarding(false);
    router.push("/login");
  };

  // Show nothing while checking auth status
  if (showOnboarding === null) {
    return null;
  }

  // Show onboarding for first-time users
  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Don't render homepage if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  const filteredTransactions = selectedCategory === "all" 
    ? transactions 
    : transactions.filter(t => t.category === selectedCategory);

  const monthTotal = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="min-h-screen bg-white relative overflow-hidden pb-20 max-w-[480px] mx-auto">
      {/* Background Blur Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-20 top-20 w-64 h-64 bg-[rgba(219,234,254,0.3)] rounded-full blur-3xl" />
        <div className="absolute left-52 top-[456px] w-80 h-80 bg-[rgba(206,250,254,0.3)] rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative">
        {/* Header */}
        <div className="px-6 py-6 flex items-center justify-between">
          <Link href="/profile" className="flex items-center gap-3">
            {/* User Avatar with KYC Badge */}
            <div className="relative">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium shadow-lg"
                style={{
                  background: "linear-gradient(135deg, rgba(43, 127, 255, 1) 0%, rgba(0, 184, 219, 1) 100%)",
                }}
              >
                {getInitials(user?.fullName)}
              </div>
              <div className="absolute -bottom-1 left-3 bg-[#00c950] text-white text-[10px] px-2 py-0.5 rounded-full border-2 border-white font-medium tracking-wide">
                KYC
              </div>
            </div>
            <div>
              <p className="text-[#6a7282] text-sm tracking-[-0.15px]">Welcome back</p>
              <p className="text-[#101828] text-base font-medium tracking-[-0.31px]">{user?.fullName || "User"}</p>
            </div>
          </Link>
          
          {/* Notification Button */}
          <Link href="/notifications" className="relative w-10 h-10 bg-[#f3f4f6] rounded-full flex items-center justify-center">
            <Bell className="w-5 h-5 text-[#6a7282]" />
            <div className="absolute top-1 right-1 w-2 h-2 bg-[#fb2c36] rounded-full" />
          </Link>
        </div>

        {/* Balance Card */}
        <div className="mx-6 mb-4">
          <div
            className="rounded-3xl shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] p-6 pb-7"
            style={{
              background: "linear-gradient(151.85deg, rgba(21, 93, 252, 1) 0%, rgba(0, 146, 184, 1) 100%)",
            }}
          >
            <p className="text-white/80 text-sm tracking-[-0.15px] mb-2">Total Balance</p>
            <h2 className="text-white text-4xl font-normal tracking-wide mb-2">
              1.500.000 IDRX
            </h2>
            <p className="text-white/90 text-sm tracking-[-0.15px] mb-6">≈ Rp 1.500.000</p>
            
            <div className="grid grid-cols-2 gap-3">
              <Link 
                href="/transfer"
                className="h-[46px] bg-white/20 border border-white/30 rounded-xl flex items-center justify-center gap-2 hover:bg-white/30 transition-colors"
              >
                <ArrowUpRight className="w-4 h-4 text-white" />
                <span className="text-white text-sm tracking-[-0.15px]">Transfer</span>
              </Link>
              <Link 
                href="/scan"
                className="h-[46px] bg-white rounded-xl flex items-center justify-center gap-2 shadow-lg hover:bg-gray-50 transition-colors"
              >
                <QrCode className="w-4 h-4 text-[#155dfc]" />
                <span className="text-[#155dfc] text-sm tracking-[-0.15px]">Scan QR</span>
              </Link>
            </div>
          </div>
        </div>

        {/* KYC Warning Banner */}
        {needsOnboarding && (
          <div className="mx-6 mb-4">
            <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-orange-900 font-semibold text-sm mb-1">
                    Complete KYC to Start Transacting
                  </h3>
                  <p className="text-orange-800 text-xs mb-3">
                    You need to verify your identity before you can scan QR codes and make payments.
                  </p>
                  <button
                    onClick={() => router.push("/onboarding")}
                    className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    Complete KYC Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Month Selector */}
        <div className="mx-6 mb-4">
          <button className="w-full h-[52px] bg-white border-2 border-[#e5e7eb] rounded-xl px-5 flex items-center justify-between hover:border-[#155dfc] transition-colors">
            <span className="text-[#364153] font-medium text-base tracking-[-0.31px]">
              {selectedMonth}
            </span>
            <ChevronDown className="w-5 h-5 text-[#6a7282]" />
          </button>
        </div>

        {/* Category Filter */}
        <div className="mx-6 mb-4">
          <h3 className="text-[#4a5565] text-base tracking-[-0.31px] mb-3 px-1">
            Filter by Category
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 h-11 px-5 rounded-xl border-2 flex items-center gap-2 transition-all ${
                  selectedCategory === cat.id
                    ? "bg-[#155dfc] border-[#155dfc] text-white"
                    : "bg-white border-[#e5e7eb] text-[#4a5565] hover:border-[#155dfc]"
                }`}
              >
                {cat.icon && <span className="text-sm">{cat.icon}</span>}
                <span className="text-sm tracking-[-0.15px]">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mx-6 mb-4 grid grid-cols-2 gap-4">
          {/* This Month */}
          <div
            className="border border-[#dcfce7] rounded-2xl p-4"
            style={{
              background: "linear-gradient(146.73deg, rgba(240, 253, 244, 1) 0%, rgba(236, 253, 245, 1) 100%)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-[#00c950] rounded-full flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-white" />
              </div>
              <span className="text-[#4a5565] text-sm tracking-[-0.15px]">This Month</span>
            </div>
            <p className="text-[#101828] text-2xl font-normal tracking-wide mb-1">
              Rp {monthTotal.toLocaleString()}
            </p>
            <p className="text-[#00a63e] text-xs">{transactions.length} transactions</p>
          </div>

          {/* Filtered */}
          <div
            className="border border-[#dbeafe] rounded-2xl p-4"
            style={{
              background: "linear-gradient(146.73deg, rgba(239, 246, 255, 1) 0%, rgba(236, 254, 255, 1) 100%)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-[#2b7fff] rounded-full flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4 text-white" />
              </div>
              <span className="text-[#4a5565] text-sm tracking-[-0.15px]">Filtered</span>
            </div>
            <p className="text-[#101828] text-2xl font-normal tracking-wide mb-1">
              {filteredTransactions.length}
            </p>
            <p className="text-[#155dfc] text-xs">
              {selectedCategory === "all" ? "All categories" : categories.find(c => c.id === selectedCategory)?.name}
            </p>
          </div>
        </div>

        {/* Transactions */}
        <div className="mx-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-[#4a5565] text-base tracking-[-0.31px]">
              Filtered Transactions
            </h3>
            <Link href="/history" className="text-[#155dfc] text-sm tracking-[-0.15px] hover:opacity-80">
              View All
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-white border border-[#f3f4f6] rounded-2xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: transaction.bgColor }}
                  >
                    {transaction.icon}
                  </div>
                  <div>
                    <p className="text-[#101828] font-medium text-base tracking-[-0.31px]">
                      {transaction.name}
                    </p>
                    <p className="text-[#6a7282] text-sm tracking-[-0.15px]">
                      {transaction.date}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`font-medium text-base tracking-[-0.31px] ${
                    transaction.amount < 0 ? "text-[#fb2c36]" : "text-[#00c950]"
                  }`}>
                    {transaction.amount < 0 ? "-" : "+"}Rp {Math.abs(transaction.amount).toLocaleString()}
                  </p>
                  <p className={`text-xs capitalize ${
                    transaction.status === "success" ? "text-[#00a63e]" :
                    transaction.status === "pending" ? "text-[#f54900]" :
                    "text-[#fb2c36]"
                  }`}>
                    {transaction.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Development Only: Reset Onboarding */}
        {process.env.NODE_ENV === "development" && (
          <div className="mx-6 mt-8 mb-4">
            <button
              onClick={() => {
                localStorage.removeItem("qrypto_onboarding_complete");
                window.location.reload();
              }}
              className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
            >
              Reset Onboarding (Dev Only)
            </button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavbar activeTab="home" />
    </div>
  );
}
