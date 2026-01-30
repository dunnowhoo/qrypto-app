import { prisma } from "@/app/lib/prisma";
import { decryptData } from "../../lib/encryption";

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
        message: "KYC status invalid.",
      };
    }
    // Decrypt API keys
    let apiKey, apiSecret;
    if (user.encryptedApiKey) {
      apiKey = decryptData(user.encryptedApiKey);
    }
    if (user.encryptedSecretKey) {
      apiSecret = decryptData(user.encryptedSecretKey);
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
    return {
      isVerified: false,
      user: null,
      message: "Error verifying KYC status.",
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
