"use client";

import { ChevronLeft, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Notification {
  id: number;
  emoji: string;
  title: string;
  message: string;
  time: string;
  isUnread: boolean;
  bgColor: string;
  borderColor?: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  
  const notifications: Notification[] = [
    {
      id: 1,
      emoji: "✓",
      title: "Payment Successful",
      message: "Your payment to Sate Khas Senayan for Rp 55,000 was successful",
      time: "2 minutes ago",
      isUnread: true,
      bgColor: "#dbeafe",
      borderColor: "#bedbff",
    },
    {
      id: 2,
      emoji: "🔒",
      title: "New Device Login",
      message: "Your account was accessed from a new device. If this wasn't you, please secure your account.",
      time: "1 hour ago",
      isUnread: true,
      bgColor: "#ffe2e2",
      borderColor: "#ffc9c9",
    },
    {
      id: 3,
      emoji: "🎁",
      title: "Special Cashback Offer",
      message: "Get 10% cashback on your next 5 transactions this week!",
      time: "3 hours ago",
      isUnread: false,
      bgColor: "#cefafe",
    },
    {
      id: 4,
      emoji: "↓",
      title: "Money Received",
      message: "You received 100,000 IDRX from Sarah Johnson",
      time: "5 hours ago",
      isUnread: false,
      bgColor: "#dbeafe",
    },
    {
      id: 5,
      emoji: "⚙️",
      title: "System Maintenance",
      message: "Scheduled maintenance on Dec 30, 2025 from 02:00 - 04:00 WIB",
      time: "1 day ago",
      isUnread: false,
      bgColor: "#f3f4f6",
    },
    {
      id: 6,
      emoji: "✕",
      title: "Payment Failed",
      message: "Payment to Tokopedia for Rp 175,000 failed. Please try again.",
      time: "2 days ago",
      isUnread: false,
      bgColor: "#dbeafe",
    },
    {
      id: 7,
      emoji: "🎉",
      title: "KYC Verification Complete",
      message: "Congratulations! Your KYC verification has been approved.",
      time: "3 days ago",
      isUnread: false,
      bgColor: "#ffe2e2",
    },
  ];

  const filteredNotifications = filter === "all" 
    ? notifications 
    : notifications.filter(n => n.isUnread);

  const unreadCount = notifications.filter(n => n.isUnread).length;

  const handleMarkAllRead = () => {
    // In a real app, this would update the backend
    console.log("Mark all as read");
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden max-w-[480px] mx-auto">
      <div className="relative">
        {/* Header */}
        <div className="bg-white border-b border-[#e5e7eb] px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="w-10 h-10 rounded-full bg-[#f3f4f6] flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-[#4a5565]" />
            </button>
            <div>
              <h1 className="text-[#0a0a0a] text-xl font-normal">Notifications</h1>
              <p className="text-[#6a7282] text-sm">{unreadCount} unread</p>
            </div>
          </div>

          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 text-[#155dfc] text-sm"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm ${
              filter === "all"
                ? "bg-[#155dfc] text-white"
                : "bg-[#f3f4f6] text-[#4a5565]"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-2 rounded-lg text-sm ${
              filter === "unread"
                ? "bg-[#155dfc] text-white"
                : "bg-[#f3f4f6] text-[#4a5565]"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-6 py-4 space-y-3">
        {filteredNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`bg-white rounded-2xl shadow-sm p-4 ${
              notification.borderColor 
                ? `border-l-4 border-l-[${notification.borderColor}]` 
                : ''
            }`}
          >
            <div className="flex gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: notification.bgColor }}
              >
                <span className="text-xl">{notification.emoji}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-[#0a0a0a] text-base font-semibold">
                    {notification.title}
                  </h3>
                  {notification.isUnread && (
                    <div className="w-2 h-2 rounded-full bg-[#155dfc] flex-shrink-0 mt-2" />
                  )}
                </div>

                <p className="text-[#4a5565] text-sm mb-2 line-clamp-2">
                  {notification.message}
                </p>

                <div className="flex items-center justify-between">
                  <p className="text-[#99a1af] text-xs">{notification.time}</p>
                  <button className="text-[#99a1af] hover:text-[#4a5565]">
                    <span className="text-xs">⋯</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
