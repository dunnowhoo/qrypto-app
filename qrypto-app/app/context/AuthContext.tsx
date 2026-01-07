"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";

interface User {
  address: string;
  fullName?: string;
  email?: string;
  phone?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (address: string, signature?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  signAndLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem("qrypto_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Sync wallet connection with auth state
    // Prevent auto-login to avoid infinite loops - let user manually trigger login
    if (!isConnected && user) {
      // Auto-logout if wallet is disconnected
      logout();
    }
  }, [isConnected, address, user]);

  const signAndLogin = async () => {
    if (!address) throw new Error("No wallet connected");

    try {
      setIsLoading(true);
      
      // Create message to sign for verification
      const message = `Sign this message to authenticate with QRypto.\n\nAddress: ${address}\nTimestamp: ${Date.now()}`;
      
      // Request signature from wallet
      const signature = await signMessageAsync({ message });
      
      // Login with verified signature
      await login(address, signature);
    } catch (error) {
      console.error("Sign and login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (walletAddress: string, signature?: string) => {
    try {
      setIsLoading(true);
      
      // Check if user exists in database
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: walletAddress, signature }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          const errorMsg = data.details || data.error || "Login failed";
          console.error("Login API error:", errorMsg);
          throw new Error(errorMsg);
        } else {
          const errorMsg = `HTTP ${response.status}: ${response.statusText}`;
          console.error("Login HTTP error:", errorMsg);
          throw new Error(errorMsg);
        }
      }

      const data = await response.json();

      const userData: User = {
        address: walletAddress,
        ...data.user,
      };
      setUser(userData);
      localStorage.setItem("qrypto_user", JSON.stringify(userData));
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("qrypto_user");
    if (isConnected) {
      disconnect();
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;

    try {
      const response = await fetch("/api/auth/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: user.address, ...data }),
      });

      const result = await response.json();

      if (response.ok) {
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        localStorage.setItem("qrypto_user", JSON.stringify(updatedUser));
      } else {
        throw new Error(result.error || "Update failed");
      }
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateProfile,
        signAndLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
