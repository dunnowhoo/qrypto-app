"use client";
import { useRouter, usePathname } from "next/navigation";
import { Home, Wallet, Clock, Settings } from "lucide-react";

interface BottomNavbarProps {
  activeTab?: "home" | "wallet" | "history" | "settings";
}

export default function BottomNavbar({ activeTab }: BottomNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Don't show navbar on onboarding, login, register, profile, notifications
  const hideNavbarRoutes = ["/login", "/register", "/profile", "/notifications"];
  if (hideNavbarRoutes.some(route => pathname.includes(route))) {
    return null;
  }

  // Auto-detect active tab based on pathname if not provided
  const currentTab = activeTab || (() => {
    if (pathname === "/" || pathname === "/home") return "home";
    if (pathname.includes("wallet")) return "wallet";
    if (pathname.includes("history")) return "history";
    if (pathname.includes("settings")) return "settings";
    return "home";
  })();

  const navItems = [
    { id: "home", label: "Home", icon: Home, path: "/" },
    { id: "wallet", label: "Wallet", icon: Wallet, path: "/walletpage" },
    { id: "history", label: "History", icon: Clock, path: "/history" },
    { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#f3f4f6] pt-4 pb-6 px-6 z-50 max-w-[480px] mx-auto shadow-lg">
      <div className="flex items-center justify-between px-8">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center gap-1 min-w-[44px] cursor-pointer touch-manipulation"
            >
              <Icon
                className={`w-6 h-6 ${
                  isActive ? "text-[#155dfc]" : "text-[#99a1af]"
                }`}
                strokeWidth={2}
              />
              <span
                className={`text-xs ${
                  isActive ? "text-[#155dfc]" : "text-[#99a1af]"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
