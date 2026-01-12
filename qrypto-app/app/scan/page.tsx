"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "../context/AuthContext";
import { parseQRIS, isQRISCode, formatIDR, SAMPLE_QRIS } from "../lib/qrisParser";
import { ChevronLeft, QrCode, Keyboard, AlertCircle } from "lucide-react";

// Dynamic import for QR Scanner to avoid SSR issues
const QRScanner = dynamic(() => import("../components/QRScanner"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white">Loading camera...</p>
      </div>
    </div>
  ),
});

export default function ScanPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [showScanner, setShowScanner] = useState(true);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleQRScan = async (result: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      console.log("Scanned QR:", result);

      // Check if it's a QRIS code
      if (!isQRISCode(result)) {
        setError("This doesn't look like a valid QRIS code. Please scan a QRIS payment code.");
        setShowScanner(true);
        setIsProcessing(false);
        return;
      }

      // Parse QRIS
      const qrisData = parseQRIS(result);
      
      if (!qrisData.isValid) {
        setError(qrisData.error || "Invalid QRIS code");
        setShowScanner(true);
        setIsProcessing(false);
        return;
      }

      // Store QRIS data and navigate to payment confirmation
      sessionStorage.setItem("qrisData", JSON.stringify(qrisData));
      router.push("/payment/confirm");

    } catch (err) {
      console.error("Error processing QR:", err);
      setError("Failed to process QR code. Please try again.");
      setShowScanner(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleQRScan(manualCode.trim());
    }
  };

  const handleUseSample = (type: "static" | "dynamic") => {
    const sampleQris = type === "static" ? SAMPLE_QRIS.static : SAMPLE_QRIS.dynamic;
    // For demo, create a mock QRIS data
    const mockQrisData = {
      isValid: true,
      merchantName: type === "static" ? "TOKO SANJAYA" : "KOPI KENANGAN",
      merchantCity: "JAKARTA",
      transactionAmount: type === "static" ? undefined : 50000,
      pointOfInitiation: type,
      transactionCurrency: "360",
      countryCode: "ID",
      rawData: sampleQris,
    };
    sessionStorage.setItem("qrisData", JSON.stringify(mockQrisData));
    router.push("/payment/confirm");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {showScanner && !showManualInput && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => router.back()}
          isActive={showScanner && !isProcessing}
        />
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed top-20 left-4 right-4 z-[60] max-w-[480px] mx-auto">
          <div className="bg-red-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-white/80 hover:text-white">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Manual Input Mode */}
      {showManualInput && (
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
          {/* Header */}
          <div className="bg-gray-800 px-4 py-4 pt-12">
            <div className="flex items-center gap-4 max-w-[480px] mx-auto">
              <button
                onClick={() => {
                  setShowManualInput(false);
                  setShowScanner(true);
                }}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <h1 className="text-white text-lg font-semibold">Enter QRIS Code</h1>
            </div>
          </div>

          {/* Form */}
          <div className="flex-1 p-4 max-w-[480px] mx-auto w-full">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">
                  Paste QRIS string here
                </label>
                <textarea
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="00020101021126..."
                  className="w-full h-40 bg-gray-800 border border-gray-700 rounded-xl p-4 text-white placeholder:text-gray-500 font-mono text-sm resize-none focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={!manualCode.trim() || isProcessing}
                className="w-full h-14 bg-blue-500 text-white rounded-xl font-medium disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : "Submit"}
              </button>
            </form>

            {/* Demo Section */}
            <div className="mt-8 pt-8 border-t border-gray-700">
              <p className="text-gray-400 text-sm mb-4">Or try with sample QRIS:</p>
              <div className="space-y-3">
                <button
                  onClick={() => handleUseSample("static")}
                  className="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl text-left hover:border-blue-500 transition-colors"
                >
                  <p className="text-white font-medium">Static QRIS (No Amount)</p>
                  <p className="text-gray-400 text-sm">TOKO SANJAYA - Jakarta</p>
                </button>
                <button
                  onClick={() => handleUseSample("dynamic")}
                  className="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl text-left hover:border-blue-500 transition-colors"
                >
                  <p className="text-white font-medium">Dynamic QRIS (With Amount)</p>
                  <p className="text-gray-400 text-sm">KOPI KENANGAN - Rp 50.000</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Bar (when scanner is active) */}
      {showScanner && !showManualInput && (
        <div className="fixed bottom-24 left-0 right-0 z-[51] px-4">
          <div className="max-w-[480px] mx-auto">
            <button
              onClick={() => {
                setShowScanner(false);
                setShowManualInput(true);
              }}
              className="w-full py-4 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center gap-3"
            >
              <Keyboard className="w-5 h-5 text-white" />
              <span className="text-white font-medium">Enter Code Manually</span>
            </button>
          </div>
        </div>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">Processing QRIS...</p>
          </div>
        </div>
      )}
    </>
  );
}
