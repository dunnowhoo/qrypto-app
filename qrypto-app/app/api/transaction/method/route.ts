import { NextRequest, NextResponse } from "next/server";
import { getBankMethods } from "@/lib/idrx";
import { requireKYC } from "@/lib/kycVerification";

export async function GET(request: NextRequest) {
  try {
    // Get wallet address from query params
    const walletAddress = request.nextUrl.searchParams.get("walletAddress");

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Verify KYC and get user's API keys
    const kycCheck = await requireKYC(walletAddress);
    if (!kycCheck.success || !kycCheck.user) {
      return NextResponse.json(
        { 
          error: kycCheck.error || "KYC verification failed",
          requiresKYC: true,
        },
        { status: 403 }
      );
    }

    // Get bank methods using user's API keys
    const response = await getBankMethods(
      kycCheck.user.apiKey!,
      kycCheck.user.apiSecret!
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Get bank methods error:", error);
    
    const err = error as any;
    
    if (err.message?.includes('KYC') || err.message?.includes('not found')) {
      return NextResponse.json(
        { 
          error: 'KYC verification required', 
          code: 'KYC_REQUIRED',
          details: 'Please complete KYC verification first'
        },
        { status: 403 }
      );
    }
    
    if (err.response?.status === 401) {
      return NextResponse.json(
        { 
          error: 'Authentication failed', 
          code: 'AUTH_FAILED',
          details: 'Invalid API credentials'
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch bank methods', 
        code: 'FETCH_FAILED',
        details: err.message || 'Unable to retrieve bank list'
      },
      { status: 500 }
    );
  }
}
