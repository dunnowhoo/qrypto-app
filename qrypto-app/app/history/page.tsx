"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import BottomNavbar from "../components/BottomNavbar";

// Transaction types
type TransactionStatus = "Success" | "Pending" | "Failed";
type TransactionCategory = "Food" | "Shopping" | "Transport" | "Grocery" | "Cafe" | "Tech" | "Order";

interface Transaction {
  id: string;
  txId: string;
  name: string;
  date: string;
  time: string;
  amount: string;
  status: TransactionStatus;
  category: TransactionCategory;
  icon: string;
  iconBg: string;
  iconColor: string;
  paymentMethod: string;
  network: string;
  gasFee: string;
  block: string;
}

// Sample transaction data
const transactions: Transaction[] = [
  {
    id: "1",
    txId: "TX-12345678",
    name: "Sate Khas Senayan",
    date: "29 Dec 2025",
    time: "14:30",
    amount: "-Rp 55.000",
    status: "Success",
    category: "Food",
    icon: "🍴",
    iconBg: "#FEF3C7",
    iconColor: "#D97706",
    paymentMethod: "IDRX",
    network: "Polygon",
    gasFee: "0.0015 MATIC",
    block: "#52847391",
  },
  {
    id: "2",
    txId: "TX-12345677",
    name: "Kopi Kenangan",
    date: "28 Dec 2025",
    time: "09:15",
    amount: "-Rp 35.000",
    status: "Success",
    category: "Cafe",
    icon: "☕",
    iconBg: "#FEF3C7",
    iconColor: "#D97706",
    paymentMethod: "IDRX",
    network: "Polygon",
    gasFee: "0.0012 MATIC",
    block: "#52847390",
  },
  {
    id: "3",
    txId: "TX-12345676",
    name: "Indomaret Sudirman",
    date: "27 Dec 2025",
    time: "18:45",
    amount: "-Rp 125.000",
    status: "Success",
    category: "Grocery",
    icon: "🛒",
    iconBg: "#DBEAFE",
    iconColor: "#2563EB",
    paymentMethod: "IDRX",
    network: "Polygon",
    gasFee: "0.0018 MATIC",
    block: "#52847389",
  },
  {
    id: "4",
    txId: "TX-12345675",
    name: "Grab Transport",
    date: "26 Dec 2025",
    time: "16:20",
    amount: "-Rp 45.000",
    status: "Success",
    category: "Transport",
    icon: "🚗",
    iconBg: "#D1FAE5",
    iconColor: "#059669",
    paymentMethod: "IDRX",
    network: "Polygon",
    gasFee: "0.0010 MATIC",
    block: "#52847388",
  },
  {
    id: "5",
    txId: "TX-12345674",
    name: "Shopee",
    date: "25 Dec 2025",
    time: "12:00",
    amount: "-Rp 250.000",
    status: "Pending",
    category: "Shopping",
    icon: "🛍️",
    iconBg: "#FEE2E2",
    iconColor: "#DC2626",
    paymentMethod: "IDRX",
    network: "Polygon",
    gasFee: "0.0025 MATIC",
    block: "#52847387",
  },
  {
    id: "6",
    txId: "TX-12345673",
    name: "Tokopedia",
    date: "24 Dec 2025",
    time: "10:30",
    amount: "-Rp 180.000",
    status: "Success",
    category: "Tech",
    icon: "💻",
    iconBg: "#E0E7FF",
    iconColor: "#4F46E5",
    paymentMethod: "USDC",
    network: "Polygon",
    gasFee: "0.0020 MATIC",
    block: "#52847386",
  },
  {
    id: "7",
    txId: "TX-12345672",
    name: "GoFood Order",
    date: "23 Dec 2025",
    time: "19:45",
    amount: "-Rp 78.000",
    status: "Success",
    category: "Order",
    icon: "📦",
    iconBg: "#FCE7F3",
    iconColor: "#DB2777",
    paymentMethod: "IDRX",
    network: "Polygon",
    gasFee: "0.0014 MATIC",
    block: "#52847385",
  },
  {
    id: "8",
    txId: "TX-12345671",
    name: "Starbucks",
    date: "22 Dec 2025",
    time: "08:00",
    amount: "-Rp 70.000",
    status: "Failed",
    category: "Cafe",
    icon: "☕",
    iconBg: "#FEF3C7",
    iconColor: "#D97706",
    paymentMethod: "IDRX",
    network: "Polygon",
    gasFee: "0.0015 MATIC",
    block: "#52847384",
  },
];

const categories = ["All", "Food", "Shopping", "Transport", "Grocery", "Cafe", "Tech", "Order"];

export default function HistoryPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedMonth, _setSelectedMonth] = useState("December 2025");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Filter transactions
  const filteredTransactions = selectedCategory === "All"
    ? transactions
    : transactions.filter((t) => t.category === selectedCategory);

  // Calculate stats
  const totalSpent = filteredTransactions.reduce((sum, t) => {
    const amount = parseInt(t.amount.replace(/[^0-9]/g, ""));
    return sum + amount;
  }, 0);

  const successCount = filteredTransactions.filter((t) => t.status === "Success").length;
  const successRate = filteredTransactions.length > 0
    ? ((successCount / filteredTransactions.length) * 100).toFixed(1)
    : "0.0";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="history-header">
        <button className="header-btn" onClick={() => router.back()}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18L9 12L15 6"
              stroke="#1F2937"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1 className="header-title">Transaction History</h1>
        <button className="header-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z"
              stroke="#1F2937"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Month Selector */}
      <div className="month-selector" onClick={() => setShowMonthPicker(!showMonthPicker)}>
        <div className="month-content">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="#6B7280" strokeWidth="2" />
            <path d="M16 2V6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
            <path d="M8 2V6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
            <path d="M3 10H21" stroke="#6B7280" strokeWidth="2" />
          </svg>
          <span>{selectedMonth}</span>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M6 9L12 15L18 9"
            stroke="#6B7280"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Category Filter */}
      <div className="category-filter">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? "category-btn-active" : ""}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="stats">
        <div className="stat-item">
          <p className="stat-label">Total Spent</p>
          <p className="stat-value">Rp {totalSpent.toLocaleString("id-ID")}</p>
        </div>
        <div className="stat-item">
          <p className="stat-label">Transactions</p>
          <p className="stat-value">{filteredTransactions.length}</p>
        </div>
        <div className="stat-item">
          <p className="stat-label">Success Rate</p>
          <p className="stat-value stat-value-green">{successRate}%</p>
        </div>
      </div>

      {/* Transaction List */}
      <div className="transaction-list">
        {filteredTransactions.map((transaction) => (
          <div key={transaction.id} className="transaction-item">
            <div
              className="transaction-icon"
              style={{ backgroundColor: transaction.iconBg }}
            >
              <span style={{ color: transaction.iconColor }}>{transaction.icon}</span>
            </div>
            <div className="transaction-info">
              <p className="transaction-name">{transaction.name}</p>
              <p className="transaction-date">
                {transaction.date} • {transaction.time}
              </p>
              <p className="transaction-txid">{transaction.txId}</p>
            </div>
            <div className="transaction-right">
              <p className="transaction-amount">{transaction.amount}</p>
              <span
                className={`transaction-status ${
                  transaction.status === "Success"
                    ? "status-success"
                    : transaction.status === "Pending"
                    ? "status-pending"
                    : "status-failed"
                }`}
              >
                {transaction.status}
              </span>
              <button
                className="view-details-btn"
                onClick={() => setSelectedTransaction(transaction)}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="modal-overlay" onClick={() => setSelectedTransaction(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-header-left">
                <div
                  className="modal-icon"
                  style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                >
                  <span>{selectedTransaction.icon}</span>
                </div>
                <div className="modal-header-info">
                  <h3 className="modal-name">{selectedTransaction.name}</h3>
                  <div className="modal-status-row">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M22 4L12 14.01L9 11.01"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="modal-status">{selectedTransaction.status}</span>
                  </div>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setSelectedTransaction(null)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Amount */}
            <div className="modal-amount">
              <p className="modal-amount-label">Amount</p>
              <p className="modal-amount-value">{selectedTransaction.amount}</p>
            </div>

            {/* Transaction ID */}
            <div className="modal-section">
              <div className="modal-txid-row">
                <div>
                  <p className="modal-section-label">Transaction ID</p>
                  <p className="modal-txid">{selectedTransaction.txId}</p>
                </div>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(selectedTransaction.txId)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="9"
                      y="9"
                      width="13"
                      height="13"
                      rx="2"
                      stroke="#2563EB"
                      strokeWidth="2"
                    />
                    <path
                      d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5"
                      stroke="#2563EB"
                      strokeWidth="2"
                    />
                  </svg>
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {/* Details Grid */}
            <div className="modal-details-grid">
              <div className="modal-detail-item">
                <p className="modal-detail-label">Date</p>
                <p className="modal-detail-value">{selectedTransaction.date}</p>
              </div>
              <div className="modal-detail-item">
                <p className="modal-detail-label">Time</p>
                <p className="modal-detail-value">{selectedTransaction.time}</p>
              </div>
              <div className="modal-detail-item">
                <p className="modal-detail-label">Category</p>
                <p className="modal-detail-value">{selectedTransaction.category}</p>
              </div>
              <div className="modal-detail-item">
                <p className="modal-detail-label">Payment Method</p>
                <p className="modal-detail-value">{selectedTransaction.paymentMethod}</p>
              </div>
            </div>

            {/* Blockchain Details */}
            <div className="blockchain-details">
              <p className="blockchain-title">Blockchain Details</p>
              <div className="blockchain-row">
                <span className="blockchain-label">Network</span>
                <span className="blockchain-value">{selectedTransaction.network}</span>
              </div>
              <div className="blockchain-row">
                <span className="blockchain-label">Gas Fee</span>
                <span className="blockchain-value">{selectedTransaction.gasFee}</span>
              </div>
              <div className="blockchain-row">
                <span className="blockchain-label">Block</span>
                <span className="blockchain-value">{selectedTransaction.block}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="modal-actions">
              <button className="download-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
                    stroke="#1F2937"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 10L12 15L17 10"
                    stroke="#1F2937"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 15V3"
                    stroke="#1F2937"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Download Receipt</span>
              </button>
              <button className="share-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="18" cy="5" r="3" stroke="white" strokeWidth="2" />
                  <circle cx="6" cy="12" r="3" stroke="white" strokeWidth="2" />
                  <circle cx="18" cy="19" r="3" stroke="white" strokeWidth="2" />
                  <path
                    d="M8.59 13.51L15.42 17.49"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M15.41 6.51L8.59 10.49"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNavbar activeTab="history" />
    </div>
  );
}
