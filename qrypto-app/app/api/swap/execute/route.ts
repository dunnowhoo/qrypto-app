import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/app/lib/prisma";

// IDRX API Configuration
const IDRX_API_URL = process.env.IDRX_API_URL || "https://idrx.co";

function generateSignature(apiSecret: string, timestamp: string, method: string, path: string, body: string): string {
  const message = `${timestamp}${method}${path}${body}`;
  return crypto
    .createHmac("sha256", apiSecret)
    .update(message)
    .digest("hex");
}

// Simple decrypt function (in production use proper encryption)
function decryptKey(encryptedKey: string): string {
  // For now, just return the key as-is
  // In production, implement proper AES decryption
  return encryptedKey;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      sellToken, 
      sellAmount, 
      buyAmount,
      userAddress, 
      chainId,
      txHash // Optional: if user already sent the transaction
    } = body;

    if (!sellToken || !sellAmount || !userAddress) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate minimum amount (20,000 IDR)
    if (buyAmount < 20000) {
      return NextResponse.json(
        { success: false, error: "Minimum transaction is 20,000 IDRX" },
        { status: 400 }
      );
    }

    // Get user's IDRX API credentials from database
    const user = await prisma.user.findUnique({
      where: { walletAddress: userAddress.toLowerCase() },
      select: {
        encryptedApiKey: true,
        encryptedSecretKey: true,
      },
    });

    if (!user?.encryptedApiKey || !user?.encryptedSecretKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: "IDRX API credentials not found. Please add your API key in settings.",
          code: "NO_API_CREDENTIALS"
        },
        { status: 400 }
      );
    }

    const apiKey = decryptKey(user.encryptedApiKey);
    const apiSecret = decryptKey(user.encryptedSecretKey);

    // Generate unique nonce
    const bridgeNonce = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // If we have a txHash, call the IDRX bridge API
    if (txHash) {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const path = "/api/transaction/mint-bridge-request";
      const requestBody = JSON.stringify({
        txHashBurn: txHash,
        bridgeToChainId: 137, // Mint on Polygon
        bridgeFromChainId: parseInt(chainId) || 1,
        amount: buyAmount.toString(),
        bridgeNonce,
        destinationWalletAddress: userAddress,
      });

      const signature = generateSignature(apiSecret, timestamp, "POST", path, requestBody);

      const response = await fetch(`${IDRX_API_URL}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
          "X-TIMESTAMP": timestamp,
          "X-SIGNATURE": signature,
        },
        body: requestBody,
      });

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { success: false, error: data.message || "Bridge request failed" },
          { status: response.status }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Swap submitted successfully",
        data: {
          bridgeNonce,
          txHash,
          estimatedArrival: "1-24 hours",
          ...data,
        },
      });
    }

    // If no txHash, return the swap instructions
    // User needs to send the transaction first
    return NextResponse.json({
      success: true,
      message: "Ready to swap",
      instructions: {
        step1: "Send your tokens to the swap contract",
        step2: "Submit the transaction hash",
        step3: "IDRX will be minted to your wallet",
      },
      swapDetails: {
        sellToken,
        sellAmount,
        buyToken: "IDRX",
        buyAmount,
        buyAmountFormatted: buyAmount.toLocaleString("id-ID"),
        destinationChain: "Polygon",
        destinationAddress: userAddress,
        bridgeNonce,
        estimatedTime: "1-24 hours",
      },
    });
  } catch (error) {
    console.error("Swap execute error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to execute swap" },
      { status: 500 }
    );
  }
}
