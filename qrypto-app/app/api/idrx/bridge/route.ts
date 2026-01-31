import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { KycStatus } from "@prisma/client";
import crypto from "crypto";

const IDRX_BASE_URL = process.env.IDRX_BASE_URL || "https://idrx.co";

// Generate HMAC signature for IDRX API
// Based on IDRX docs: createSignature(method, path, body, timestamp, secret)
function generateSignature(
  method: string,
  path: string,
  body: string,
  timestamp: string,
  secret: string
): string {
  // Convert body to base64 then back to utf8 (as per IDRX example)
  const bufferReq = Buffer.from(body, "base64").toString("utf8");
  const message = `${method}${path}${bufferReq}${timestamp}`;
  return crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      walletAddress, // User's wallet to get API credentials
      txHashBurn,
      bridgeToChainId,
      bridgeFromChainId,
      amount,
      bridgeNonce,
      destinationWalletAddress,
    } = body;

    // Validate required fields
    if (!walletAddress || !txHashBurn || !bridgeToChainId || !bridgeFromChainId || !amount || !bridgeNonce || !destinationWalletAddress) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Get user's IDRX API credentials from database
    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
      select: {
        encryptedApiKey: true,
        encryptedSecretKey: true,
        kycStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please complete KYC first.", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    if (user.kycStatus !== KycStatus.APPROVED) {
      return NextResponse.json(
        { error: "KYC verification required to use IDRX bridge.", code: "KYC_NOT_VERIFIED" },
        { status: 403 }
      );
    }

    if (!user.encryptedApiKey || !user.encryptedSecretKey) {
      return NextResponse.json(
        { error: "IDRX API credentials not set. Please configure in settings.", code: "NO_API_CREDENTIALS" },
        { status: 403 }
      );
    }

    // Decrypt credentials (TODO: implement proper AES decryption in production)
    const apiKey = user.encryptedApiKey;
    const apiSecret = user.encryptedSecretKey;

    // Validate minimum amount (20,000 IDR)
    const amountNum = parseFloat(amount);
    if (amountNum < 20000) {
      return NextResponse.json(
        { error: "Minimum transaction is 20,000 IDR" },
        { status: 400 }
      );
    }

    const timestamp = Date.now().toString();
    const requestPath = "/api/transaction/bridge-request";
    const payload = JSON.stringify({
      txHashBurn,
      bridgeToChainId: Number(bridgeToChainId),
      bridgeFromChainId: Number(bridgeFromChainId),
      amount: amount.toString(),
      bridgeNonce: bridgeNonce.toString(),
      destinationWalletAddress,
    });

    const signature = generateSignature("POST", requestPath, payload, timestamp, apiSecret);

    // Call IDRX Bridge API
    const response = await fetch(`${IDRX_BASE_URL}${requestPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "idrx-api-key": apiKey,
        "idrx-api-sig": signature,
        "idrx-api-ts": timestamp,
      },
      body: payload,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Bridge request failed", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Bridge request submitted successfully",
      data: data.data,
    });
  } catch (error) {
    console.error("Bridge API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
