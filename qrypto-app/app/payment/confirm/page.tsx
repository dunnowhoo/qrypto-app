"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useAuth } from "../../context/AuthContext";
import { formatIDR, QrisData } from "../../lib/qrisParser";
import { 
  ChevronLeft, 
  Store, 
  MapPin, 
  Wallet, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck
} from "lucide-react";
import BottomNavbar from "../../components/BottomNavbar";

// QRypto Treasury wallet address (for receiving IDRX payments)
const TREASURY_WALLET = "0x742d35Cc6634C0532925a3b844Bc9e7595f0Fa1A";

export default function PaymentConfirmPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [qrisData, setQrisData] = useState<QrisData | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"confirm" | "processing" | "success" | "failed">("confirm");
  
  // Mock user balance (in production, fetch from blockchain)
  const userBalance = 1500000; // 1.5 million IDRX

  // Load QRIS data from session storage
  useEffect(() => {
    const storedData = sessionStorage.getItem("qrisData");
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData) as QrisData;
        setQrisData(parsed);
        if (parsed.transactionAmount) {
          setAmount(parsed.transactionAmount.toString());
        }
      } catch {
        router.push("/scan");
      }
    } else {
      router.push("/scan");
    }
  }, [router]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  const paymentAmount = parseFloat(amount) || 0;
  const serviceFee = Math.ceil(paymentAmount * 0.001); // 0.1% service fee
  const totalAmount = paymentAmount + serviceFee;
  const hasEnoughBalance = userBalance >= totalAmount;

  const handlePayment = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }

    if (!paymentAmount || paymentAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!hasEnoughBalance) {
      setError("Insufficient IDRX balance");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setStep("processing");

    try {
      // 1. Create payment record in database
      const createResponse = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrisData,
          amount: paymentAmount,
          serviceFee,
          totalAmount,
          fromAddress: address,
          toAddress: TREASURY_WALLET,
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || "Failed to create payment");
      }

      const { paymentId } = await createResponse.json();

      // 2. In production: Send IDRX transaction using wagmi
      // For now, simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock transaction hash
      const mockTxHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;

      // 3. Confirm payment (this would trigger fiat settlement to merchant)
      const confirmResponse = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          txHash: mockTxHash,
        }),
      });

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json();
        throw new Error(errorData.error || "Failed to confirm payment");
      }

      // Store payment info for success page
      sessionStorage.setItem("lastPayment", JSON.stringify({
        paymentId,
        txHash: mockTxHash,
        amount: paymentAmount,
        merchantName: qrisData?.merchantName,
        merchantCity: qrisData?.merchantCity,
      }));

      setStep("success");
      
      // Navigate to success page after delay
      setTimeout(() => {
        router.push("/payment/success");
      }, 2000);

    } catch (err) {
      console.error("Payment error:", err);
      setError(err instanceof Error ? err.message : "Payment failed");
      setStep("failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !qrisData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Processing Screen
  if (step === "processing") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center px-8">
          <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-white text-xl font-semibold mb-2">Processing Payment</h2>
          <p className="text-gray-400">Please wait while we process your IDRX payment...</p>
        </div>
      </div>
    );
  }

  // Success Screen
  if (step === "success") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center px-8">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-white text-xl font-semibold mb-2">Payment Successful!</h2>
          <p className="text-gray-400">Redirecting to receipt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 max-w-[480px] mx-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-gray-900 text-lg font-semibold">Confirm Payment</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Merchant Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
              <Store className="w-7 h-7 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900 text-lg">
                {qrisData.merchantName || "Unknown Merchant"}
              </h2>
              {qrisData.merchantCity && (
                <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>{qrisData.merchantCity}</span>
                </div>
              )}
              <div className="mt-2 inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified QRIS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Amount Input */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <label className="block text-gray-500 text-sm mb-2">Payment Amount</label>
          {qrisData.transactionAmount ? (
            // Fixed amount from QRIS
            <div className="text-center py-4">
              <p className="text-3xl font-bold text-gray-900">
                {formatIDR(qrisData.transactionAmount)}
              </p>
              <p className="text-gray-500 text-sm mt-1">Fixed amount from merchant</p>
            </div>
          ) : (
            // Input for variable amount
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                Rp
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full h-16 bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 text-2xl font-semibold text-gray-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
        </div>

        {/* Payment Details */}
        {paymentAmount > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
            <h3 className="font-semibold text-gray-900">Payment Details</h3>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Amount</span>
              <span className="text-gray-900">{formatIDR(paymentAmount)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Service Fee (0.1%)</span>
              <span className="text-gray-900">{formatIDR(serviceFee)}</span>
            </div>
            
            <div className="border-t border-gray-100 pt-3 flex justify-between">
              <span className="font-medium text-gray-900">Total</span>
              <span className="font-bold text-blue-600 text-lg">{formatIDR(totalAmount)}</span>
            </div>
          </div>
        )}

        {/* Wallet Balance */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Wallet className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">IDRX Balance</p>
                <p className="font-semibold text-gray-900">{formatIDR(userBalance)}</p>
              </div>
            </div>
            {paymentAmount > 0 && (
              <div className={`text-sm font-medium ${hasEnoughBalance ? "text-green-600" : "text-red-600"}`}>
                {hasEnoughBalance ? "Sufficient" : "Insufficient"}
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={handlePayment}
          disabled={!paymentAmount || !hasEnoughBalance || isSubmitting || !isConnected}
          className="w-full h-14 bg-blue-500 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>Pay with IDRX</span>
            </>
          )}
        </button>

        {/* Info */}
        <p className="text-center text-gray-400 text-xs px-4">
          By confirming, you agree to pay {formatIDR(totalAmount)} IDRX from your wallet. 
          The payment will be settled to the merchant via QRIS.
        </p>
      </div>

      <BottomNavbar activeTab="home" />
    </div>
  );
}
