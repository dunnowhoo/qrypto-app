"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConnectWallet, Wallet } from "@coinbase/onchainkit/wallet";
import { Avatar, Name, Identity, Address } from "@coinbase/onchainkit/identity";
import { useAccount } from "wagmi";
import { useAuth } from "../context/AuthContext";

const logoIcon = "https://www.figma.com/api/mcp/asset/ec8fba16-0d72-4a16-a0b2-a3eca811dc2c";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  
  const { address, isConnected } = useAccount();
  const { signAndLogin, isAuthenticated } = useAuth();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const handleWalletLogin = async () => {
    if (loading) return; // Prevent double execution
    
    try {
      setLoading(true);
      setError("");
      await signAndLogin();
      // Don't navigate here - let isAuthenticated effect handle it
    } catch (err) {
      console.error("Wallet login error:", err);
      setError("Failed to authenticate. Please try again.");
      setLoading(false); // Only set false on error
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden max-w-[480px] mx-auto">
      {/* Background Blur Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-36 -top-40 w-90 h-90 bg-[rgba(219,234,254,0.5)] rounded-full blur-3xl" />
        <div className="absolute left-48 top-105 w-108.5 h-108.5 bg-[rgba(206,250,254,0.5)] rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative px-8 py-16 flex flex-col gap-8 min-h-screen">
        {/* Logo & Header */}
        <div className="flex flex-col items-center gap-8">
          <div
            className="w-20 h-20 rounded-3xl shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(21, 93, 252, 1) 0%, rgba(0, 146, 184, 1) 100%)",
            }}
          >
            <img src={logoIcon} alt="QRypto" className="w-10 h-10" />
          </div>

          <div className="text-center">
            <h1 className="text-[#101828] text-3xl font-normal mb-1 tracking-[0.4px]">
              Welcome Back
            </h1>
            <p className="text-[#4a5565] text-base tracking-[-0.31px]">
              Sign in to continue to QRypto
            </p>
          </div>
        </div>

        {/* Login Form */}
        <div className="flex-1 flex flex-col gap-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Connected Wallet Info */}
          {mounted && isConnected && address && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <Identity address={address} className="bg-transparent">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10" />
                  <div className="flex-1">
                    <Name className="text-sm font-medium text-blue-900" />
                    <Address className="text-xs text-blue-600" />
                  </div>
                </div>
              </Identity>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-[#e5e7eb]" />
            <span className="text-[#6a7282] text-sm tracking-[-0.15px]">
              {isConnected ? "Sign to authenticate" : "Connect wallet to continue"}
            </span>
            <div className="flex-1 h-px bg-[#e5e7eb]" />
          </div>

          {/* Wallet Connect / Sign In Button */}
          <div className="flex flex-col gap-4">
            {mounted && isConnected && address ? (
              <button
                onClick={handleWalletLogin}
                disabled={loading}
                className="w-full h-16 bg-linear-to-r from-[#155dfc] to-[#0092b8] rounded-2xl flex items-center justify-center gap-3 hover:opacity-90 transition-opacity cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-white text-lg tracking-[-0.44px] font-medium">
                  {loading ? "Authenticating..." : "Sign In with Wallet"}
                </span>
              </button>
            ) : (
              <Wallet>
                <ConnectWallet className="w-full">
                  <div className="w-full h-16 bg-linear-to-r from-[#155dfc] to-[#0092b8] rounded-2xl flex items-center justify-center gap-3 hover:opacity-90 transition-opacity cursor-pointer shadow-lg">
                    <span className="text-white text-lg tracking-[-0.44px] font-medium">
                      Connect Wallet
                    </span>
                  </div>
                </ConnectWallet>
              </Wallet>
            )}
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <span className="text-[#6a7282] text-base tracking-[-0.31px]">
              Don't have an account?{" "}
            </span>
            <Link
              href="/register"
              className="text-[#101828] text-base font-medium tracking-[-0.31px] hover:text-[#155dfc]"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
