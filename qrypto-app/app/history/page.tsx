"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useAuth } from "../context/AuthContext";
import BottomNavbar from "../components/BottomNavbar";
import { ArrowLeft, Calendar, Filter } from "lucide-react";

interface TransactionRecord {
  id: number;
  amount: string;
  burnStatus?: string;
  userMintStatus?: string;
  paymentStatus?: string;
  merchantName?: string;
  bankName?: string;
  bankAccountNumber?: string;
  createdAt: string;
  txHash?: string;
  status?: string;
}

type TransactionType = 'MINT' | 'BURN' | 'BRIDGE' | 'DEPOSIT_REDEEM';

export default function HistoryPage() {
  const router = useRouter();
  const { address } = useAccount();
  const { isAuthenticated, needsOnboarding } = useAuth();
  
  const [selectedType, setSelectedType] = useState<TransactionType>('BURN');
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [metadata, setMetadata] = useState<any>(null);

  const transactionTypes: { value: TransactionType; label: string }[] = [
    { value: 'BURN', label: 'Transfers to Bank' },
    { value: 'MINT', label: 'Top Up' },
    { value: 'BRIDGE', label: 'Bridge' },
    { value: 'DEPOSIT_REDEEM', label: 'Deposit & Redeem' },
  ];

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (needsOnboarding) {
      router.push("/onboarding");
    }
  }, [isAuthenticated, needsOnboarding, router]);

  // Fetch transaction history
  useEffect(() => {
    const fetchHistory = async () => {
      if (!address) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams({
          walletAddress: address,
          transactionType: selectedType,
          page: currentPage.toString(),
          take: '10',
          orderByDate: 'DESC',
        });

        const response = await fetch(`/api/transaction/user-transaction-history?${params}`);
        const data = await response.json();
        
        if (response.ok) {
          setTransactions(data.records || []);
          setMetadata(data.metadata || {});
          setTotalCount(data.metadata?.totalCount || 0);
        } else {
          setError(data.error || "Failed to load transaction history");
        }
      } catch (err) {
        setError("Failed to load transaction history");
        console.error("History fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && !needsOnboarding) {
      fetchHistory();
    }
  }, [address, selectedType, currentPage, isAuthenticated, needsOnboarding]);

  const getStatusBadge = (record: TransactionRecord) => {
    let status = '';
    let colorClass = '';

    if (selectedType === 'BURN') {
      status = record.burnStatus || 'UNKNOWN';
      colorClass = status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                   status === 'IN_PROCESS' ? 'bg-yellow-100 text-yellow-800' :
                   status === 'REQUESTED' ? 'bg-blue-100 text-blue-800' :
                   'bg-red-100 text-red-800';
    } else if (selectedType === 'MINT') {
      status = record.userMintStatus || 'UNKNOWN';
      colorClass = status === 'MINTED' ? 'bg-green-100 text-green-800' :
                   status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                   'bg-gray-100 text-gray-800';
    } else {
      status = record.status || 'UNKNOWN';
      colorClass = status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                   status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                   'bg-gray-100 text-gray-800';
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return `Rp ${num.toLocaleString("id-ID")}`;
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading transaction history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-24">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push("/")}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
            <p className="text-sm text-gray-600">
              {totalCount} total transaction{totalCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Transaction Type Filter */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">Transaction Type</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {transactionTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => {
                  setSelectedType(type.value);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedType === type.value
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Transaction List */}
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No transactions found</p>
              <p className="text-sm text-gray-500 mt-2">
                Your {transactionTypes.find(t => t.value === selectedType)?.label.toLowerCase()} history will appear here
              </p>
            </div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {selectedType === 'BURN' && tx.bankName}
                        {selectedType === 'MINT' && 'Top Up IDRX'}
                        {selectedType === 'BRIDGE' && 'Bridge Transaction'}
                        {selectedType === 'DEPOSIT_REDEEM' && 'Deposit & Redeem'}
                      </h3>
                      {getStatusBadge(tx)}
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatDate(tx.createdAt)}
                    </p>
                    {selectedType === 'BURN' && tx.bankAccountNumber && (
                      <p className="text-xs text-gray-500 mt-1">
                        Account: {tx.bankAccountNumber}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatAmount(tx.amount)}
                    </p>
                  </div>
                </div>
                
                {tx.txHash && (
                  <div className="border-t border-gray-100 pt-3 mt-3">
                    <p className="text-xs text-gray-500 mb-1">Transaction Hash:</p>
                    <p className="text-xs font-mono text-gray-700 break-all">
                      {tx.txHash}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {metadata && metadata.pageCount > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
            >
              Previous
            </button>
            <span className="px-4 py-2 bg-white rounded-lg shadow-md">
              Page {currentPage} of {metadata.pageCount}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(metadata.pageCount, p + 1))}
              disabled={currentPage === metadata.pageCount}
              className="px-4 py-2 bg-white rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-started hover:shadow-lg transition-shadow"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <BottomNavbar />
    </div>
  );
}
