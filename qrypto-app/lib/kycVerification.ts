import { prisma } from "@/app/lib/prisma";
import { decryptData } from "./encryption";

export interface UserWithKeys {
  id: string;
  walletAddress: string;
  fullName: string | null;
  email: string | null;
  kycStatus: string;
  apiKey?: string;
  apiSecret?: string;
}

/**
 * Verify if user has completed KYC onboarding
 */
export async function verifyKYCStatus(walletAddress: string): Promise<{
  isVerified: boolean;
  user: UserWithKeys | null;
  message?: string;
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
    });

    if (!user) {
      return {
        isVerified: false,
        user: null,
        message: "User not found. Please register first.",
      };
    }

    if (!user.kycStatus || user.kycStatus === "PENDING") {
      return {
        isVerified: false,
        user: null,
        message: "KYC verification required. Please complete onboarding.",
      };
    }

    if (user.kycStatus === "REJECTED") {
      return {
        isVerified: false,
        user: null,
        message: "KYC verification was rejected. Please contact support.",
      };
    }

    if (user.kycStatus !== "APPROVED") {
      return {
        isVerified: false,
        user: null,
        message: "Invalid KYC status. Please contact support.",
      };
    }

    // Check if user has API keys
    if (!user.encryptedApiKey || !user.encryptedSecretKey) {
      return {
        isVerified: false,
        user: null,
        message: "API keys not found. Please complete onboarding again.",
      };
    }

    // Decrypt API keys
    let apiKey: string;
    let apiSecret: string;

    try {
      apiKey = decryptData(user.encryptedApiKey);
      apiSecret = decryptData(user.encryptedSecretKey);
    } catch (error) {
      console.error("Error decrypting API keys:", error);
      return {
        isVerified: false,
        user: null,
        message: "Error retrieving API credentials. Please contact support.",
      };
    }

    return {
      isVerified: true,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        fullName: user.fullName,
        email: user.email,
        kycStatus: user.kycStatus,
        apiKey,
        apiSecret,
      },
    };
  } catch (error) {
    console.error("KYC verification error:", error);
    return {
      isVerified: false,
      user: null,
      message: "Error verifying KYC status. Please try again.",
    };
  }
}

/**
 * Middleware to check KYC status before allowing transactions
 */
export async function requireKYC(walletAddress: string | null | undefined): Promise<{
  success: boolean;
  user?: UserWithKeys;
  error?: string;
}> {
  if (!walletAddress) {
    return {
      success: false,
      error: "Wallet address is required",
    };
  }

  const kycResult = await verifyKYCStatus(walletAddress);

  if (!kycResult.isVerified) {
    return {
      success: false,
      error: kycResult.message || "KYC verification failed",
    };
  }

  return {
    success: true,
    user: kycResult.user!,
  };
}
