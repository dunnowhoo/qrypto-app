"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, Banknote, AlertCircle, CheckCircle2 } from "lucide-react";
import { BrowserProvider } from "ethers";
import { burnIDRX, getIDRXBalance } from "../lib/burnIDRX";

interface BankMethod {
  bankCode: string;
  bankName: string;
  maxAmountTransfer: string;
}

type ErrorType = {
  type: 'validation' | 'network' | 'kyc' | 'balance' | 'api' | 'blockchain';
  message: string;
  details?: string;
};

type LoadingStage = 'idle' | 'checking' | 'burning' | 'submitting';

interface LoadingState {
  stage: LoadingStage;
  message: string;
}

export default function TransferPage() {
  const router = useRouter();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { isAuthenticated, needsOnboarding } = useAuth();
  
  const [banks, setBanks] = useState<BankMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorType | null>(null);
  const [success, setSuccess] = useState(false);
  const [idrxBalance, setIdrxBalance] = useState<string>("0");
  
  const [loadingState, setLoadingState] = useState<LoadingState>({
    stage: 'idle',
    message: ''
  });
  
  const [formData, setFormData] = useState({
    selectedBank: "",
    bankAccountNumber: "",
    bankAccountName: "",
    amount: "",
    notes: "",
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (needsOnboarding) {
      router.push("/onboarding");
    }
  }, [isAuthenticated, needsOnboarding, router]);

  // Fetch available banks and IDRX balance
  useEffect(() => {
    const fetchBanks = async () => {
      if (!address) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/transaction/method?walletAddress=${address}`);
        const data = await response.json();
        
        if (response.ok && data.data) {
          setBanks(data.data);
        } else {
          setError({
            type: 'api',
            message: 'Failed to load banks',
            details: data.error
          });
        }
      } catch (err) {
        setError({
          type: 'network',
          message: 'Network error',
          details: 'Unable to fetch bank list'
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchBalance = async () => {
      if (!address || !publicClient) return;
      
      try {
        const balance = await getIDRXBalance(address, publicClient as any);
        setIdrxBalance(balance);
      } catch (err) {
        console.error('Failed to fetch IDRX balance:', err);
      }
    };

    if (isAuthenticated && !needsOnboarding) {
      fetchBanks();
      fetchBalance();
    }
  }, [address, isAuthenticated, needsOnboarding, publicClient]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address) {
      setError({
        type: 'validation',
        message: 'Wallet not connected',
        details: 'Please connect your wallet to continue'
      });
      return;
    }

    // Validation
    if (!formData.selectedBank || !formData.bankAccountNumber || !formData.bankAccountName || !formData.amount) {
      setError({
        type: 'validation',
        message: 'Incomplete form',
        details: 'Please fill in all required fields'
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount < 20000) {
      setError({
        type: 'validation',
        message: 'Invalid amount',
        details: 'Minimum transfer amount is Rp 20,000'
      });
      return;
    }

    const selectedBank = banks.find(b => b.bankCode === formData.selectedBank);
    if (!selectedBank) {
      setError({
        type: 'validation',
        message: 'Invalid bank selection',
        details: 'Please select a valid bank'
      });
      return;
    }

    const maxAmount = parseFloat(selectedBank.maxAmountTransfer);
    if (amount > maxAmount) {
      setError({
        type: 'validation',
        message: 'Amount exceeds limit',
        details: `Maximum transfer amount for this bank is Rp ${maxAmount.toLocaleString("id-ID")}`
      });
      return;
    }

    // Check balance
    const balanceNum = parseFloat(idrxBalance);
    if (balanceNum < amount) {
      setError({
        type: 'balance',
        message: 'Insufficient balance',
        details: `You have ${balanceNum.toLocaleString("id-ID")} IDRX but need ${amount.toLocaleString("id-ID")} IDRX`
      });
      return;
    }

    setError(null);

    try {
      // Stage 1: Check wallet connection
      setLoadingState({
        stage: 'checking',
        message: 'Preparing transaction...'
      });

      if (!walletClient) {
        throw {
          type: 'blockchain',
          message: 'Wallet not connected',
          details: 'Please make sure your wallet is connected'
        };
      }

      // Stage 2: Burn IDRX tokens on blockchain
      setLoadingState({
        stage: 'burning',
        message: 'Burning IDRX tokens on blockchain...'
      });

      const provider = new BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();
      
      let txHash: string;
      try {
        txHash = await burnIDRX(signer, formData.amount);
      } catch (burnError: any) {
        if (burnError.message?.includes('cancelled') || burnError.message?.includes('rejected')) {
          throw {
            type: 'validation',
            message: 'Transaction cancelled',
            details: 'You rejected the transaction in your wallet'
          };
        }
        if (burnError.message?.includes('gas')) {
          throw {
            type: 'blockchain',
            message: 'Insufficient gas',
            details: 'You need ETH on Base network to pay for gas fees'
          };
        }
        throw {
          type: 'blockchain',
          message: 'Burn transaction failed',
          details: burnError.message
        };
      }

      // Stage 3: Submit to IDRX API
      setLoadingState({
        stage: 'submitting',
        message: 'Submitting transfer request to IDRX...'
      });

      const response = await fetch("/api/transaction/redeem-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          txHash,
          networkChainId: "8453", // Base mainnet
          amountTransfer: formData.amount,
          bankAccount: formData.bankAccountNumber,
          bankCode: formData.selectedBank,
          bankName: selectedBank.bankName,
          bankAccountName: formData.bankAccountName,
          walletAddress: address,
          notes: formData.notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && data.code === 'KYC_REQUIRED') {
          throw {
            type: 'kyc',
            message: 'KYC verification required',
            details: 'Please complete KYC verification to make transfers'
          };
        }
        throw {
          type: 'api',
          message: 'Transfer request failed',
          details: data.error || data.details || 'Unknown error'
        };
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/history");
      }, 2000);
    } catch (err: any) {
      console.error('Transfer error:', err);
      
      if (err.type) {
        setError(err);
      } else {
        setError({
          type: 'network',
          message: 'Transaction failed',
          details: err.message || 'An unexpected error occurred'
        });
      }
    } finally {
      setLoadingState({
        stage: 'idle',
        message: ''
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="min-h-screen bg-white relative max-w-[480px] mx-auto flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading banks...</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black">
        <div className="min-h-screen bg-white relative max-w-[480px] mx-auto flex items-center justify-center p-6">
          <div className="w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Transfer Request Submitted!
            </h1>
            <p className="text-gray-600 mb-4">
              Your transfer request has been submitted successfully. The balance will be processed and credited to your bank account within 24 hours.
            </p>
            <button
              onClick={() => router.push("/history")}
              className="w-full bg-gradient-to-r from-[#155dfc] to-[#0092b8] text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all"
            >
              View Transaction History
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="min-h-screen bg-white relative overflow-hidden max-w-[480px] mx-auto pb-20">
        {/* Background Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -left-20 top-0 w-64 h-64 bg-[rgba(219,234,254,0.3)] rounded-full blur-3xl" />
          <div className="absolute left-52 top-96 w-80 h-80 bg-[rgba(206,250,254,0.3)] rounded-full blur-3xl" />
        </div>

        <div className="relative">
          {/* Header */}
          <div className="relative h-32 bg-gradient-to-br from-[#155dfc] to-[#0092b8]">
            <div className="absolute top-6 left-6">
              <button
                onClick={() => router.push("/")}
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="absolute bottom-6 left-6">
              <h1 className="text-white text-2xl font-semibold">Transfer to Bank</h1>
              <p className="text-white/80 text-sm mt-1">Redeem IDRX to your bank account</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="px-6 mt-6">

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Banknote className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Important Information:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Minimum transfer: Rp 20,000</li>
                <li>Maximum transfer: Rp 1,000,000,000 (per bank limit may vary)</li>
                <li>Processing time: max 24 hours</li>
                <li>Request will be canceled if payment not made within 24 hours</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Bank Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Bank <span className="text-red-500">*</span>
              </label>
              <select
                name="selectedBank"
                value={formData.selectedBank}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Choose a bank</option>
                {banks.map((bank) => (
                  <option key={bank.bankCode} value={bank.bankCode}>
                    {bank.bankName} (Max: Rp {parseInt(bank.maxAmountTransfer).toLocaleString("id-ID")})
                  </option>
                ))}
              </select>
            </div>

            {/* Bank Account Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="bankAccountNumber"
                value={formData.bankAccountNumber}
                onChange={handleInputChange}
                required
                placeholder="1234567890"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Account Holder Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Holder Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="bankAccountName"
                value={formData.bankAccountName}
                onChange={handleInputChange}
                required
                placeholder="JOHN DOE"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
              />
              <p className="text-xs text-gray-500 mt-1">
                Must match the name registered with the bank
              </p>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (IDR) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  min="20000"
                  step="1000"
                  placeholder="20000"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Minimum: Rp 20,000
              </p>
            </div>

            {/* Notes (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder="Add notes if account holder name differs from your IDRX account"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Required if transferring to a different account holder name
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className={`rounded-xl p-4 border ${
                error.type === 'validation' ? 'bg-yellow-50 border-yellow-200' :
                error.type === 'kyc' ? 'bg-orange-50 border-orange-200' :
                error.type === 'balance' ? 'bg-red-50 border-red-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${
                    error.type === 'validation' ? 'text-yellow-600' :
                    error.type === 'kyc' ? 'text-orange-600' :
                    error.type === 'balance' ? 'text-red-600' :
                    'text-red-600'
                  }`} />
                  <div className="flex-1">
                    <h3 className={`font-semibold text-sm mb-1 ${
                      error.type === 'validation' ? 'text-yellow-900' :
                      error.type === 'kyc' ? 'text-orange-900' :
                      error.type === 'balance' ? 'text-red-900' :
                      'text-red-900'
                    }`}>
                      {error.message}
                    </h3>
                    {error.details && (
                      <p className={`text-xs ${
                        error.type === 'validation' ? 'text-yellow-800' :
                        error.type === 'kyc' ? 'text-orange-800' :
                        error.type === 'balance' ? 'text-red-800' :
                        'text-red-800'
                      }`}>
                        {error.details}
                      </p>
                    )}
                    {error.type === 'kyc' && (
                      <button
                        onClick={() => router.push('/onboarding')}
                        className="mt-2 text-xs font-medium text-orange-700 hover:text-orange-900 underline"
                      >
                        Complete KYC Now →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Balance Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-900 font-medium">Your IDRX Balance:</span>
                <span className="text-lg font-bold text-blue-600">
                  {parseFloat(idrxBalance).toLocaleString("id-ID")} IDRX
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loadingState.stage !== 'idle'}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loadingState.stage !== 'idle' ? "Processing..." : "Submit Transfer Request"}
            </button>
          </form>
        </div>

        {/* Warning */}
        <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <p className="text-sm text-orange-900">
              <span className="font-semibold">Note:</span> IDRX is not responsible if a redeem error occurs due to an incorrect bank account number. Please double-check your account details before submitting.
            </p>
          </div>
        </div>
      </div>
        </div>

      {/* Loading Overlay */}
      {loadingState.stage !== 'idle' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 shadow-2xl">
            <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <p className="text-center font-bold text-lg text-gray-900 mb-2">
              {loadingState.stage === 'checking' && 'Preparing Transaction'}
              {loadingState.stage === 'burning' && 'Burning IDRX Tokens'}
              {loadingState.stage === 'submitting' && 'Submitting Request'}
            </p>
            <p className="text-center text-sm text-gray-600 mb-4">
              {loadingState.message}
            </p>
            {loadingState.stage === 'burning' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-900 text-center font-medium">
                  ⚠️ Please confirm the transaction in your wallet
                </p>
              </div>
            )}
            {loadingState.stage === 'submitting' && (
              <p className="text-xs text-gray-500 text-center">
                This may take a few moments...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
