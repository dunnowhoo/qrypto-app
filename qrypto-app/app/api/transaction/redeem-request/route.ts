import { NextRequest, NextResponse } from "next/server";
import { submitRedeemRequest } from "@/lib/idrx";
import { requireKYC } from "@/lib/kycVerification";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      txHash,
      networkChainId,
      amountTransfer,
      bankAccount,
      bankCode,
      bankName,
      bankAccountName,
      walletAddress,
      notes,
    } = body;

    // Validate required fields
    if (!txHash || !networkChainId || !amountTransfer || !bankAccount || 
        !bankCode || !bankName || !bankAccountName || !walletAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Submit redeem request using user's API keys
    const response = await submitRedeemRequest(
      kycCheck.user.apiKey!,
      kycCheck.user.apiSecret!,
      {
        txHash,
        networkChainId,
        amountTransfer,
        bankAccount,
        bankCode,
        bankName,
        bankAccountName,
        walletAddress,
        notes,
      }
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Redeem request error:", error);
    
    const err = error as any;
    
    // Handle specific error types
    if (err.message?.includes('KYC') || err.message?.includes('not found')) {
      return NextResponse.json(
        { 
          error: 'KYC verification required', 
          code: 'KYC_REQUIRED',
          details: 'Please complete KYC verification to make transfers'
        },
        { status: 403 }
      );
    }
    
    if (err.response?.status === 401) {
      return NextResponse.json(
        { 
          error: 'Invalid API credentials', 
          code: 'AUTH_FAILED',
          details: 'Your IDRX API keys are invalid or expired'
        },
        { status: 401 }
      );
    }
    
    if (err.response?.status === 400) {
      return NextResponse.json(
        { 
          error: 'Invalid request', 
          code: 'INVALID_REQUEST',
          details: err.response?.data?.message || 'Invalid transfer parameters'
        },
        { status: 400 }
      );
    }
    
    if (err.message?.includes('balance') || err.message?.includes('insufficient')) {
      return NextResponse.json(
        { 
          error: 'Insufficient balance', 
          code: 'INSUFFICIENT_BALANCE',
          details: 'Not enough IDRX balance to complete this transfer'
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Transfer request failed', 
        code: 'REQUEST_FAILED',
        details: err.message || 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
