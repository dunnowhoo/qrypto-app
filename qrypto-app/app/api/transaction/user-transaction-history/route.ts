import { NextRequest, NextResponse } from "next/server";
import { getUserTransactionHistory } from "@/lib/idrx";
import { requireKYC } from "@/lib/kycVerification";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Get wallet address for authentication
    const walletAddress = searchParams.get("walletAddress");
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

    // Get required parameters
    const transactionType = searchParams.get("transactionType");
    const page = searchParams.get("page");
    const take = searchParams.get("take");

    if (!transactionType || !page || !take) {
      return NextResponse.json(
        { error: "transactionType, page, and take are required" },
        { status: 400 }
      );
    }

    // Build params object
    const params: any = {
      transactionType,
      page: parseInt(page),
      take: parseInt(take),
    };

    // Add optional parameters
    const optionalParams = [
      'userMintStatus', 'paymentStatus', 'burnStatus', 'bridgeStatus',
      'merchantOrderId', 'originChainId', 'destinationChainId',
      'amountMax', 'amountMin', 'txHash', 'orderByDate', 'orderByAmount',
      'transferTxHash', 'burnTxHash'
    ];

    optionalParams.forEach(param => {
      const value = searchParams.get(param);
      if (value) {
        params[param] = ['originChainId', 'destinationChainId'].includes(param) 
          ? parseInt(value) 
          : value;
      }
    });

    // Get transaction history using user's API keys
    const response = await getUserTransactionHistory(
      kycCheck.user.apiKey!,
      kycCheck.user.apiSecret!,
      params
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Get transaction history error:", error);
    
    const err = error as any;
    
    if (err.message?.includes('KYC') || err.message?.includes('not found')) {
      return NextResponse.json(
        { 
          error: 'KYC verification required', 
          code: 'KYC_REQUIRED',
          details: 'Please complete KYC verification to view history'
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
        error: 'Failed to fetch transaction history', 
        code: 'FETCH_FAILED',
        details: err.message || 'Unable to retrieve transaction history'
      },
      { status: 500 }
    );
  }
}