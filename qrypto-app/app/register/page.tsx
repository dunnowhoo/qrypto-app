"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, ChevronLeft } from "lucide-react";
import { ConnectWallet, Wallet } from "@coinbase/onchainkit/wallet";
import { useAccount, useSignMessage } from "wagmi";
import { useAuth } from "../context/AuthContext";

const logoIcon = "/logo.svg";
const googleIcon = "/Icon.svg";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { isAuthenticated, isNewUser, user, updateProfile, refreshUser, needsOnboarding } = useAuth();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect logic based on user state
  useEffect(() => {
    if (isAuthenticated && !isNewUser && user?.fullName) {
      // If user has completed profile but needs onboarding, redirect to onboarding
      if (needsOnboarding) {
        router.push("/onboarding");
      } else {
        // Otherwise redirect to home
        router.push("/");
      }
    }
  }, [isAuthenticated, isNewUser, user, needsOnboarding, router]);

  // If already authenticated (new user completing profile), show form immediately
  useEffect(() => {
    if (isAuthenticated && isNewUser) {
      setShowProfileForm(true);
      // Pre-fill form with existing data
      if (user) {
        setFormData({
          fullName: user.fullName || "",
          email: user.email || "",
          phone: user.phone || "",
        });
      }
    }
  }, [isAuthenticated, isNewUser, user]);

  // Handle wallet connection - show profile form
  useEffect(() => {
    if (isConnected && address && !isAuthenticated) {
      setShowProfileForm(true);
    }
  }, [isConnected, address, isAuthenticated]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address) {
      setError("Please connect your wallet first");
      return;
    }

    if (!formData.fullName) {
      setError("Please enter your full name");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // If already authenticated (completing profile), use updateProfile
      if (isAuthenticated) {
        await updateProfile(formData);
        router.push("/");
        return;
      }

      // New user - sign message for verification
      const message = `Register with QRypto\n\nAddress: ${address}\nName: ${formData.fullName}\nTimestamp: ${Date.now()}`;
      const signature = await signMessageAsync({ message });

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          signature,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Auto login after registration
        const loginResponse = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, signature }),
        });

        if (loginResponse.ok) {
          await refreshUser();
          // Redirect to onboarding for KYC
          router.push("/onboarding");
        }
      } else {
        // If user already exists, update their profile instead
        if (response.status === 409) {
          const updateResponse = await fetch("/api/auth/update-profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              address,
              fullName: formData.fullName,
              email: formData.email,
              phone: formData.phone,
            }),
          });
          
          if (updateResponse.ok) {
            await refreshUser();
            // Redirect to onboarding for KYC
            router.push("/onboarding");
          } else {
            setError("Failed to update profile");
          }
        } else {
          setError(data.error || "Registration failed");
        }
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden max-w-[480px] mx-auto">
      {/* Background Blur Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-36 -top-40 w-93.75 h-93.75 bg-[rgba(219,234,254,0.5)] rounded-full blur-3xl" />
        <div className="absolute left-40 top-100 w-115 h-115 bg-[rgba(206,250,254,0.5)] rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative px-8 py-8 min-h-screen overflow-y-auto">
        <div className="flex flex-col gap-6">
          {/* Back Button & Logo */}
          <div className="flex flex-col gap-8">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 bg-[#f3f4f6] rounded-full flex items-center justify-center hover:bg-[#e5e7eb] transition-colors self-start"
            >
              <ChevronLeft className="w-5 h-5 text-[#101828]" />
            </button>

            <div className="flex flex-col items-center gap-8">
              <div
                className="w-20 h-20 rounded-3xl shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(21, 93, 252, 1) 0%, rgba(0, 146, 184, 1) 100%)",
                }}
              >
                <img src={logoIcon} alt="QRypto" className="w-10 h-10" />
              </div>

              <div className="text-center">
                <h1 className="text-[#101828] text-3xl font-normal mb-1 tracking-[0.4px]">
                  {isAuthenticated && isNewUser ? "Complete Profile" : "Create Account"}
                </h1>
                <p className="text-[#4a5565] text-base tracking-[-0.31px]">
                  {isAuthenticated && isNewUser ? "Tell us a bit about yourself" : "Join QRypto today"}
                </p>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="flex flex-col gap-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {!showProfileForm ? (
              <>
                {/* Wallet Connect Section */}
                <div className="text-center py-8">
                  <p className="text-[#4a5565] text-base mb-6 tracking-[-0.31px]">
                    First, connect your wallet to continue
                  </p>
                  <Wallet>
                    <ConnectWallet className="w-full">
                      <div className="w-full h-16 bg-linear-to-r from-[#155dfc] to-[#0092b8] rounded-2xl flex items-center justify-center gap-3 hover:opacity-90 transition-opacity cursor-pointer shadow-lg">
                        <span className="text-white text-lg tracking-[-0.44px] font-medium">
                          {mounted && isConnected ? "Wallet Connected ✓" : "Connect Wallet to Sign Up"}
                        </span>
                      </div>
                    </ConnectWallet>
                  </Wallet>
                </div>
              </>
            ) : (
              <>
                {/* Wallet Info */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-green-600 text-sm font-medium mb-1">Wallet Connected ✓</p>
                  <p className="text-green-700 text-xs truncate">{address || user?.address}</p>
                </div>

                <p className="text-[#4a5565] text-sm text-center -mt-2">
                  {isAuthenticated && isNewUser 
                    ? "Complete your profile to continue" 
                    : "Complete your profile to finish registration"}
                </p>

                {/* Full Name Input */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#99a1af]">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Full name *"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full h-14.5 bg-[rgba(243,244,246,0.5)] border border-[#e5e7eb] rounded-2xl pl-12 pr-4 text-base text-[#101828] placeholder:text-[#99a1af] tracking-[-0.31px] focus:outline-none focus:border-[#155dfc] focus:ring-1 focus:ring-[#155dfc]"
                  />
                </div>

                {/* Email Input */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#99a1af]">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email address (optional)"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full h-14.5 bg-[rgba(243,244,246,0.5)] border border-[#e5e7eb] rounded-2xl pl-12 pr-4 text-base text-[#101828] placeholder:text-[#99a1af] tracking-[-0.31px] focus:outline-none focus:border-[#155dfc] focus:ring-1 focus:ring-[#155dfc]"
                  />
                </div>

                {/* Phone Input */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#99a1af]">
                    <Phone className="w-5 h-5" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone number (optional)"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full h-14.5 bg-[rgba(243,244,246,0.5)] border border-[#e5e7eb] rounded-2xl pl-12 pr-4 text-base text-[#101828] placeholder:text-[#99a1af] tracking-[-0.31px] focus:outline-none focus:border-[#155dfc] focus:ring-1 focus:ring-[#155dfc]"
                  />
                </div>

                {/* Create Account Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-15 bg-[#155dfc] rounded-2xl shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] text-white text-lg tracking-[-0.44px] hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? "Saving..." : (isAuthenticated && isNewUser ? "Save Profile" : "Create Account")}
                </button>
              </>
            )}
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-[#e5e7eb]" />
            <span className="text-[#6a7282] text-sm tracking-[-0.15px]">or continue with</span>
            <div className="flex-1 h-px bg-[#e5e7eb]" />
          </div>

          {/* Google Sign Up */}
          <button
            type="button"
            className="w-full h-16 bg-white border-2 border-[#e5e7eb] rounded-2xl flex items-center justify-center gap-3 hover:border-[#155dfc] transition-colors"
          >
            <img src={googleIcon} alt="Google" className="w-6 h-6" />
            <span className="text-[#101828] text-lg tracking-[-0.44px]">
              Sign up with Google
            </span>
          </button>

          {/* Sign In Link */}
          <div className="text-center pb-8">
            <span className="text-[#4a5565] text-base tracking-[-0.31px]">
              Already have an account?{" "}
            </span>
            <Link
              href="/login"
              className="text-[#155dfc] text-base font-medium tracking-[-0.31px] hover:opacity-80"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
