"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Edit, ShieldCheck, Download, ChevronRight, Save, X, User, Mail, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useAccount } from "wagmi";

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateProfile, isAuthenticated, isLoading } = useAuth();
  const { address } = useAccount();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && mounted) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, mounted, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
    setIsEditing(false);
  };

  const copyAddress = () => {
    if (user?.address) {
      navigator.clipboard.writeText(user.address);
    }
  };

  const getInitials = () => {
    if (user?.fullName) {
      const names = user.fullName.split(" ");
      return names.map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return "??";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
              <p className="text-white text-base font-medium">{formatDate(user.createdAt)}</p>
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
                  <p className="text-white text-4xl font-normal">{getInitials()}</p>
                </div>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-[#155dfc] shadow-lg flex items-center justify-center"
                >
                  <Edit className="w-5 h-5 text-white" />
                </button>
                {user.fullName && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#00c950] border-2 border-white rounded-full px-3.5 py-1 shadow-lg flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-white" />
                    <span className="text-white text-xs font-medium">Verified</span>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info - View Mode */}
            {!isEditing ? (
              <>
                <div className="text-center mt-2 mb-6">
                  <h1 className="text-2xl font-normal text-[#101828] mb-1">
                    {user.fullName || "Set your name"}
                  </h1>
                  {user.email && (
                    <p className="text-[#6a7282] text-base flex items-center justify-center gap-2">
                      <span>✉️</span>
                      {user.email}
                    </p>
                  )}
                </div>
              </>
            ) : (
              /* Profile Info - Edit Mode */
              <div className="mt-2 mb-6 space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-[#101828]">Edit Profile</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="p-2 rounded-full bg-[#155dfc] hover:bg-[#0d4ed3] disabled:opacity-50"
                    >
                      <Save className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Full Name"
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#155dfc] text-[#101828]"
                    />
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email"
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#155dfc] text-[#101828]"
                    />
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Phone Number"
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#155dfc] text-[#101828]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-[#eff6ff] to-[#dbeafe]/50 border border-[#dbeafe] rounded-2xl p-4 text-center">
                <div className="text-2xl mb-1">📊</div>
                <p className="text-[#155dfc] text-2xl font-normal mb-1">0</p>
                <p className="text-[#4a5565] text-xs">Transactions</p>
              </div>
              <div className="bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7]/50 border border-[#dcfce7] rounded-2xl p-4 text-center">
                <div className="text-2xl mb-1">✓</div>
                <p className="text-[#00a63e] text-2xl font-normal mb-1">100%</p>
                <p className="text-[#4a5565] text-xs">Success</p>
              </div>
              <div className="bg-gradient-to-br from-[#ecfeff] to-[#cefafe]/50 border border-[#cefafe] rounded-2xl p-4 text-center">
                <div className="text-2xl mb-1">💰</div>
                <p className="text-[#0092b8] text-2xl font-normal mb-1">0</p>
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
                <button 
                  onClick={copyAddress}
                  className="bg-white border border-[#e5e7eb] rounded-lg px-3 py-1.5 flex items-center gap-1 text-[#4a5565] text-xs font-medium hover:bg-gray-50"
                >
                  <span>📋</span>
                  Copy
                </button>
              </div>
              <p className="text-[#101828] text-sm font-mono break-all">
                {user.address}
              </p>
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
                <p className="text-[#101828] text-sm font-medium">{formatDate(user.createdAt)}</p>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#f3f4f6]">
                <div className="flex items-center gap-2 text-[#4a5565] text-sm">
                  <span>👤</span>
                  Full Name
                </div>
                <p className="text-[#101828] text-sm font-medium">{user.fullName || "Not set"}</p>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#f3f4f6]">
                <div className="flex items-center gap-2 text-[#4a5565] text-sm">
                  <span>✉️</span>
                  Email
                </div>
                <p className="text-[#101828] text-sm font-medium">{user.email || "Not set"}</p>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2 text-[#4a5565] text-sm">
                  <span>📱</span>
                  Phone
                </div>
                <p className="text-[#101828] text-sm font-medium">{user.phone || "Not set"}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 bg-white border border-[#f3f4f6] rounded-2xl shadow-sm p-5 mb-6">
            <h3 className="text-[#101828] text-base font-medium mb-4">Quick Actions</h3>

            <div className="space-y-2">
              <button 
                onClick={() => setIsEditing(true)}
                className="w-full bg-gradient-to-br from-[#eff6ff] to-[#dbeafe]/50 border border-[#dbeafe] rounded-2xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#155dfc] shadow-sm flex items-center justify-center">
                    <Edit className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-[#101828] text-base font-medium">Edit Profile</p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#4a5565]" />
              </button>

              <button 
                onClick={() => router.push("/settings")}
                className="w-full bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7]/50 border border-[#dcfce7] rounded-2xl p-4 flex items-center justify-between"
              >
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
