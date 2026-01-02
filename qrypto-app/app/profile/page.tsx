"use client";
import React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Copy,
  ShieldCheck,
  ChevronRight,
  User,
  Smartphone,
  Globe,
  Edit3,
  Lock,
  FileText,
  Camera,
  TrendingUp,
  Award,
  Activity,
} from "lucide-react";
import BottomNavbar from "../components/BottomNavbar";

export default function ProfilePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen max-w-md mx-auto bg-[#F8F9FB] flex flex-col relative shadow-xl border-x border-gray-50">
      <div className="sticky top-0 z-30 bg-blue-600 px-6 py-4 flex justify-between items-center text-white">
        <button
          onClick={() => router.back()}
          className="p-2 bg-white/10 rounded-full backdrop-blur-sm hover:bg-white/20 transition"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="text-right">
          <p className="text-blue-100 text-[10px] uppercase tracking-wider">
            Member Since
          </p>
          <p className="font-semibold text-sm">Jan 2024</p>
        </div>
      </div>

      {/* 3. SCROLLABLE CONTENT */}
      <div className="flex-1">
        <div className="bg-linear-to-b from-blue-600 to-blue-500 h-48 rounded-b-[40px] sticky top-0 z-0"></div>
        {/* Overlapping Content Container */}
        <div className="px-5 -mt-32 relative z-10 pb-28 space-y-6">
          {/* --- Main Profile Card --- */}
          <div className="bg-white rounded-4xl p-6 pt-16 shadow-sm relative flex flex-col items-center text-center border border-gray-100">
            {/* PFP */}
            <div className="absolute -top-12">
              <div className="relative">
                <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-md">
                  JD
                </div>
                <button className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full border-2 border-white">
                  <Camera size={14} />
                </button>
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900">John Doe</h2>
            <p className="text-gray-500 text-sm">johndoe@email.com</p>

            {/* Stats Row */}
            <div className="flex items-center justify-between w-full mt-6 gap-3">
              <div className="flex-1 bg-blue-50 rounded-2xl p-3 text-center">
                <TrendingUp size={20} className="text-blue-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-blue-900">127</p>
                <p className="text-xs text-blue-400">Transactions</p>
              </div>
              <div className="flex-1 bg-green-50 rounded-2xl p-3 text-center">
                <Award size={20} className="text-green-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-green-900">98.5%</p>
                <p className="text-xs text-green-500">Success</p>
              </div>
              <div className="flex-1 bg-cyan-50 rounded-2xl p-3 text-center">
                <Activity size={20} className="text-cyan-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-cyan-900">3.2M</p>
                <p className="text-xs text-cyan-500">Volume</p>
              </div>
            </div>

            {/* Wallet Address */}
            <div className="w-full mt-6 bg-gray-50 rounded-xl p-3 flex items-center justify-between border border-gray-100">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-gray-400">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M6 12h.01M10 12h.01M14 12h.01M18 12h.01" />
                  </svg>
                </span>
                <p className="text-sm text-gray-600 truncate">
                  0x742d35Cc6634C0532925a3b844...
                </p>
              </div>
              <button className="flex items-center gap-1 text-sm font-medium text-gray-600 bg-white px-2 py-1 rounded-lg border border-gray-200">
                <Copy size={14} /> Copy
              </button>
            </div>
          </div>

          {/* --- Premium Member Card --- */}
          <div className="bg-linear-to-r from-amber-50 to-orange-50 rounded-3xl p-5 border border-amber-100/50 shadow-sm relative overflow-hidden font-medium">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-200/30 rounded-full blur-2xl"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center text-white shadow-md shadow-orange-200">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-orange-900 font-bold">Premium Member</h3>
                  <p className="text-orange-700/70 text-sm">
                    Level 3 - Fully Verified
                  </p>
                </div>
              </div>
              <ChevronRight className="text-orange-300" />
            </div>
            <div className="space-y-2 relative z-10">
              <div className="flex justify-between text-sm">
                <span className="text-orange-800">Verification Complete</span>
                <span className="text-orange-900 font-bold">100%</span>
              </div>
              <div className="h-2 bg-orange-200/50 rounded-full overflow-hidden">
                <div className="h-full w-full bg-orange-500 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* --- Account Information Card --- */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 font-medium">
            <h3 className="text-gray-900 font-bold mb-4 flex items-center gap-2">
              <User size={18} className="text-blue-500" /> Account Information
            </h3>
            <div className="space-y-4">
              <InfoRow
                icon={<CalendarIcon />}
                label="Joined"
                value="January 2024"
              />
              <InfoRow
                icon={<TagIcon />}
                label="Account Type"
                value={
                  <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold">
                    Premium
                  </span>
                }
              />
              <InfoRow
                icon={<Smartphone size={16} />}
                label="Phone"
                value="+62 812-3456-7890"
              />
              <InfoRow
                icon={<Globe size={16} />}
                label="Country"
                value={
                  <span className="flex items-center gap-1">Indonesia 🇮🇩</span>
                }
              />
            </div>
          </div>

          {/* --- Quick Actions Card --- */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 font-medium">
            <h3 className="text-gray-900 font-bold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <ActionRow
                icon={Edit3}
                iconBg="bg-blue-100 text-blue-600"
                label="Edit Profile"
              />
              <ActionRow
                icon={Lock}
                iconBg="bg-green-100 text-green-600"
                label="Security Settings"
              />
              <ActionRow
                icon={FileText}
                iconBg="bg-cyan-100 text-cyan-600"
                label="Download Statement"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. FIXED BOTTOM NAV 
          Changed from absolute to fixed so it stays at the bottom of the viewport 
          while the page scrolls. Centered using left-1/2 transform. */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40">
        <BottomNavbar activeTab="settings" />
      </div>
    </div>
  );
}
// Helper Components for list rows
const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: any;
}) => (
  <div className="flex items-center justify-between text-sm">
    <div className="flex items-center gap-3 text-gray-500">
      <span className="text-gray-400">{icon}</span>
      <span>{label}</span>
    </div>
    <span className="text-gray-900 font-semibold">{value}</span>
  </div>
);

const ActionRow = ({
  icon: Icon,
  iconBg,
  label,
}: {
  icon: any;
  iconBg: string;
  label: string;
}) => (
  <button className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition group">
    <div className="flex items-center gap-3">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center ${iconBg}`}
      >
        <Icon size={16} />
      </div>
      <span className="text-gray-700 font-semibold">{label}</span>
    </div>
    <ChevronRight
      size={18}
      className="text-gray-300 group-hover:text-gray-500"
    />
  </button>
);

// Simple SVG icons not in Lucide basic set
const CalendarIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);
const TagIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
    <line x1="7" y1="7" x2="7.01" y2="7"></line>
  </svg>
);
