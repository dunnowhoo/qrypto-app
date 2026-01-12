"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { formatIDR } from "../../lib/qrisParser";
import { 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  Home,
  Share2,
  Download
} from "lucide-react";
import BottomNavbar from "../../components/BottomNavbar";

interface PaymentInfo {
  paymentId: string;
  txHash: string;
  amount: number;
  merchantName: string;
  merchantCity?: string;
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [copied, setCopied] = useState(false);

  // Load payment data from session storage
  useEffect(() => {
    const storedData = sessionStorage.getItem("lastPayment");
    if (storedData) {
      try {
        setPayment(JSON.parse(storedData));
      } catch {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleCopyTxHash = () => {
    if (payment?.txHash) {
      navigator.clipboard.writeText(payment.txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleViewOnExplorer = () => {
    if (payment?.txHash) {
      window.open(`https://basescan.org/tx/${payment.txHash}`, "_blank");
    }
  };

  const handleGoHome = () => {
    // Clear payment data
    sessionStorage.removeItem("lastPayment");
    sessionStorage.removeItem("qrisData");
    router.push("/");
  };

  if (isLoading || !payment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const timestamp = new Date().toLocaleString("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24 max-w-[480px] mx-auto">
      {/* Success Header */}
      <div className="bg-linear-to-br from-green-500 to-emerald-600 px-6 py-12 text-center">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <h1 className="text-white text-2xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-white/80">Your QRIS payment has been completed</p>
      </div>

      <div className="p-4 -mt-4 space-y-4">
        {/* Amount Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <p className="text-gray-500 text-sm mb-1">Amount Paid</p>
          <p className="text-3xl font-bold text-gray-900">{formatIDR(payment.amount)}</p>
          <p className="text-blue-600 text-sm mt-1">{payment.amount.toLocaleString()} IDRX</p>
        </div>

        {/* Transaction Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
          <h3 className="font-semibold text-gray-900">Transaction Details</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Merchant</span>
              <span className="text-gray-900 text-sm font-medium">{payment.merchantName}</span>
            </div>
            
            {payment.merchantCity && (
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Location</span>
                <span className="text-gray-900 text-sm">{payment.merchantCity}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Date & Time</span>
              <span className="text-gray-900 text-sm">{timestamp}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Payment ID</span>
              <span className="text-gray-900 text-sm font-mono">{payment.paymentId.slice(0, 12)}...</span>
            </div>
          </div>
        </div>

        {/* Transaction Hash */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Transaction Hash</span>
            <button
              onClick={handleCopyTxHash}
              className="text-blue-500 text-sm flex items-center gap-1"
            >
              <Copy className="w-4 h-4" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-gray-900 font-mono text-xs break-all bg-gray-50 p-3 rounded-xl">
            {payment.txHash}
          </p>
          <button
            onClick={handleViewOnExplorer}
            className="mt-3 w-full flex items-center justify-center gap-2 text-blue-600 text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            View on BaseScan
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button className="flex flex-col items-center gap-2 bg-white rounded-xl p-4 border border-gray-200">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <Share2 className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-gray-700 text-sm font-medium">Share</span>
          </button>
          <button className="flex flex-col items-center gap-2 bg-white rounded-xl p-4 border border-gray-200">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <Download className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-gray-700 text-sm font-medium">Download</span>
          </button>
        </div>

        {/* Go Home Button */}
        <button
          onClick={handleGoHome}
          className="w-full h-14 bg-blue-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
        >
          <Home className="w-5 h-5" />
          <span>Back to Home</span>
        </button>
      </div>

      <BottomNavbar activeTab="home" />
    </div>
  );
}
