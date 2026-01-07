"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import {
  ShieldCheck,
  Smartphone,
  Bell,
  Moon,
  Languages,
  HelpCircle,
  FileText,
  ShieldAlert,
  RotateCcw,
  Palette,
  ChevronRight,
  ChevronLeft,
  LogOut,
  QrCode,
  User,
} from "lucide-react";
import BottomNavbar from "../components/BottomNavbar";

const SettingItem = ({
  icon: Icon,
  iconBg,
  title,
  subtitle,
  type = "link",
  value,
  href,
  onClick,
}: {
  icon: any;
  iconBg: string;
  title: string;
  subtitle: string;
  type?: "link" | "toggle";
  value?: string;
  href?: string;
  onClick?: () => void;
}) => {
  const content = (
    <div className="flex items-center justify-between w-full">
      {/* LEFT Side */}
      <div className="flex items-center gap-4 ">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}
        >
          <Icon size={20} className="text-gray-700" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-[15px] font-semibold text-gray-900 leading-tight">
            {title}
          </h3>
          <p className="text-sm text-gray-500 leading-tight mt-0.5">
            {subtitle}
          </p>
        </div>
      </div>
      {/* RIGHT side */}
      <div className="flex items-center gap-2">
        {value && <span className="text-sm text-gray-400">{value}</span>}
        {type === "link" ? (
          <ChevronRight size={20} className="text-gray-300" />
        ) : (
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        )}
      </div>
    </div>
  );

  if (type === "link" && href) {
    return (
      <a
        href={href}
        className="flex items-center justify-between p-4 bg-white active:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0 no-underline"
      >
        {content}
      </a>
    );
  }

  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between p-4 bg-white active:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0"
    >
      {content}
    </div>
  );
};

export default function SettingsPage() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleResetOnboarding = () => {
    localStorage.removeItem("hasSeenOnboarding");
    router.push("/");
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-24 max-w-[480px] mx-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white px-4 py-4 flex items-center gap-4 border-b border-gray-100 z-10">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800">Settings</h1>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-8">
        {/* ACCOUNT SECTION */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 tracking-widest mb-3 uppercase px-1">
            Account
          </h2>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <SettingItem
              icon={User}
              iconBg="bg-blue-100"
              title="My Profile"
              subtitle="Manage your profile settings"
              type="link"
              href="/profile"
            />
            <SettingItem
              icon={ShieldCheck}
              iconBg="bg-blue-50"
              title="Security & Privacy"
              subtitle="Manage your security settings"
            />
          </div>
        </section>

        {/* PREFERENCES SECTION */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 tracking-widest mb-3 uppercase px-1">
            Preferences
          </h2>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <SettingItem
              icon={Smartphone}
              iconBg="bg-indigo-50"
              title="Biometric Login"
              subtitle="Use Face ID to login"
              type="toggle"
            />
            <SettingItem
              icon={Bell}
              iconBg="bg-orange-50"
              title="Push Notifications"
              subtitle="Receive alerts and updates"
              type="toggle"
            />
            <SettingItem
              icon={Moon}
              iconBg="bg-gray-900 text-white"
              title="Dark Mode"
              subtitle="Enable dark theme"
              type="toggle"
            />
            <SettingItem
              icon={Languages}
              iconBg="bg-cyan-50"
              title="Language"
              subtitle="English (US)"
              value="English (US)"
            />
          </div>
        </section>

        {/* SUPPORT SECTION */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 tracking-widest mb-3 uppercase px-1">
            Support
          </h2>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <SettingItem
              icon={HelpCircle}
              iconBg="bg-blue-50"
              title="Help Center"
              subtitle="Get help and support"
            />
            <SettingItem
              icon={FileText}
              iconBg="bg-gray-50"
              title="Terms & Conditions"
              subtitle="Legal information"
            />
            <SettingItem
              icon={ShieldAlert}
              iconBg="bg-gray-50"
              title="Privacy Policy"
              subtitle="How we protect your data"
            />
            <SettingItem
              icon={RotateCcw}
              iconBg="bg-purple-50"
              title="Reset Onboarding"
              subtitle="View intro screens again"
              onClick={handleResetOnboarding}
            />
            <SettingItem
              icon={Palette}
              iconBg="bg-pink-50"
              title="Design System"
              subtitle="View design guidelines"
            />
          </div>
        </section>

        {/* APP INFO & LOGOUT */}
        <div className="pt-2 space-y-4">
          {/* App Version Card */}
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center justify-center shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-linear-to-br from-[#007AFF] to-[#00C6FF] rounded-3xl flex items-center justify-center mb-4 shadow-lg shadow-blue-100">
              <QrCode size={40} className="text-white" strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">QRypto</h3>
            <p className="text-gray-500 mt-1 font-medium">Version 1.0.0</p>
            <p className="text-gray-400 text-sm">Build 2025.12.28</p>
          </div>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="w-full bg-white border border-red-100 py-4 rounded-3xl flex items-center justify-center gap-3 text-red-500 font-semibold active:scale-[0.98] transition-transform shadow-sm"
          >
            <LogOut size={20} />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavbar activeTab="settings" />
    </div>
  );
}
