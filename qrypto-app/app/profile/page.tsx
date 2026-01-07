"use client";

import { ChevronLeft, Edit, ShieldCheck, Download, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white relative overflow-hidden max-w-[480px] mx-auto">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-20 top-0 w-64 h-64 bg-[rgba(219,234,254,0.3)] rounded-full blur-3xl" />
        <div className="absolute left-52 top-[456px] w-80 h-80 bg-[rgba(206,250,254,0.3)] rounded-full blur-3xl" />
      </div>

      <div className="relative pb-20">
        {/* Header with Gradient */}
        <div className="relative h-48 bg-gradient-to-br from-[#155dfc] to-[#0092b8]">
        <div className="absolute top-6 left-6">
          <button
            onClick={() => router.push("/")}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="absolute top-6 right-6">
          <div className="flex flex-col items-end gap-0">
            <p className="text-white/80 text-sm">Member Since</p>
            <p className="text-white text-base font-medium">Jan 2024</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 -mt-20">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 pt-16 relative">
          {/* Profile Avatar */}
          <div className="absolute -top-14 left-1/2 -translate-x-1/2">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-[#2b7fff] to-[#0092b8] flex items-center justify-center">
                <p className="text-white text-4xl font-normal">JD</p>
              </div>
              <button className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-[#155dfc] shadow-lg flex items-center justify-center">
                <Edit className="w-5 h-5 text-white" />
              </button>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#00c950] border-2 border-white rounded-full px-3.5 py-1 shadow-lg flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
                <span className="text-white text-xs font-medium">Verified</span>
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="text-center mt-2 mb-6">
            <h1 className="text-2xl font-normal text-[#101828] mb-1">John Doe</h1>
            <p className="text-[#6a7282] text-base flex items-center justify-center gap-2">
              <span>✉️</span>
              johndoe@email.com
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-[#eff6ff] to-[#dbeafe]/50 border border-[#dbeafe] rounded-2xl p-4 text-center">
              <div className="text-2xl mb-1">📊</div>
              <p className="text-[#155dfc] text-2xl font-normal mb-1">127</p>
              <p className="text-[#4a5565] text-xs">Transactions</p>
            </div>
            <div className="bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7]/50 border border-[#dcfce7] rounded-2xl p-4 text-center">
              <div className="text-2xl mb-1">✓</div>
              <p className="text-[#00a63e] text-2xl font-normal mb-1">98.5%</p>
              <p className="text-[#4a5565] text-xs">Success</p>
            </div>
            <div className="bg-gradient-to-br from-[#ecfeff] to-[#cefafe]/50 border border-[#cefafe] rounded-2xl p-4 text-center">
              <div className="text-2xl mb-1">💰</div>
              <p className="text-[#0092b8] text-2xl font-normal mb-1">3.2M</p>
              <p className="text-[#4a5565] text-xs">Volume</p>
            </div>
          </div>

          {/* Wallet Address */}
          <div className="bg-gradient-to-br from-[#f9fafb] to-[#f3f4f6]/50 border border-[#e5e7eb] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1 text-[#4a5565] text-xs font-medium">
                <span>🔗</span>
                Wallet Address
              </div>
              <button className="bg-white border border-[#e5e7eb] rounded-lg px-3 py-1.5 flex items-center gap-1 text-[#4a5565] text-xs font-medium">
                <span>📋</span>
                Copy
              </button>
            </div>
            <p className="text-[#101828] text-sm font-mono break-all">
              0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
            </p>
          </div>
        </div>

        {/* Premium Member Card */}
        <div className="mt-4 bg-gradient-to-br from-[#fefce8] to-[#fff7ed] border border-[#ffedd4] rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#fdc700] to-[#ff6900] shadow-lg flex items-center justify-center">
                <span className="text-2xl">👑</span>
              </div>
              <div>
                <h3 className="text-[#101828] text-base font-medium">Premium Member</h3>
                <p className="text-[#4a5565] text-sm">Level 3 - Fully Verified</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#4a5565]" />
          </div>

          <div className="mb-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#4a5565] text-xs font-medium">Verification Complete</p>
              <p className="text-[#4a5565] text-xs font-medium">100%</p>
            </div>
            <div className="bg-white/50 border border-[#ffd6a7]/50 rounded-full p-0.5">
              <div className="h-2 bg-gradient-to-r from-[#fdc700] to-[#ff6900] rounded-full w-full" />
            </div>
          </div>

          <div className="bg-white/50 border border-[#ffd6a7]/50 rounded-2xl px-3 py-2 flex items-center gap-2">
            <span className="text-sm">✓</span>
            <p className="text-[#4a5565] text-xs">All verification steps completed</p>
          </div>
        </div>

        {/* Account Information */}
        <div className="mt-4 bg-white border border-[#f3f4f6] rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">ℹ️</span>
            <h3 className="text-[#101828] text-base font-medium">Account Information</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-[#f3f4f6]">
              <div className="flex items-center gap-2 text-[#4a5565] text-sm">
                <span>📅</span>
                Joined
              </div>
              <p className="text-[#101828] text-sm font-medium">January 2024</p>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-[#f3f4f6]">
              <div className="flex items-center gap-2 text-[#4a5565] text-sm">
                <span>👤</span>
                Account Type
              </div>
              <div className="bg-gradient-to-r from-[#fdc700] to-[#ff6900] rounded-full px-3 py-1">
                <p className="text-white text-xs font-medium">Premium</p>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-[#f3f4f6]">
              <div className="flex items-center gap-2 text-[#4a5565] text-sm">
                <span>📱</span>
                Phone
              </div>
              <p className="text-[#101828] text-sm font-medium">+62 812-3456-7890</p>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2 text-[#4a5565] text-sm">
                <span>🌍</span>
                Country
              </div>
              <p className="text-[#101828] text-sm font-medium">Indonesia 🇮🇩</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 bg-white border border-[#f3f4f6] rounded-2xl shadow-sm p-5 mb-6">
          <h3 className="text-[#101828] text-base font-medium mb-4">Quick Actions</h3>

          <div className="space-y-2">
            <button className="w-full bg-gradient-to-br from-[#eff6ff] to-[#dbeafe]/50 border border-[#dbeafe] rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#155dfc] shadow-sm flex items-center justify-center">
                  <Edit className="w-5 h-5 text-white" />
                </div>
                <p className="text-[#101828] text-base font-medium">Edit Profile</p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#4a5565]" />
            </button>

            <button className="w-full bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7]/50 border border-[#dcfce7] rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#00a63e] shadow-sm flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <p className="text-[#101828] text-base font-medium">Security Settings</p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#4a5565]" />
            </button>

            <button className="w-full bg-gradient-to-br from-[#ecfeff] to-[#cefafe]/50 border border-[#cefafe] rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#0092b8] shadow-sm flex items-center justify-center">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <p className="text-[#101828] text-base font-medium">Download Statement</p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#4a5565]" />
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
