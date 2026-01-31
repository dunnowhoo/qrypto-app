import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const IDRX_BASE_URL = process.env.IDRX_BASE_URL || "https://idrx.co";
const IDRX_API_KEY = process.env.IDRX_API_KEY || "";
const IDRX_API_SECRET = process.env.IDRX_API_SECRET || "";

// Generate HMAC signature for IDRX API
function generateSignature(timestamp: string, body: string): string {
  const message = timestamp + body;
  return crypto
    .createHmac("sha256", IDRX_API_SECRET)
    .update(message)
    .digest("hex");
}

// Get IDRX balance for a wallet address
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("address");
    const chainId = searchParams.get("chainId") || "137"; // Default Polygon

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    const timestamp = Date.now().toString();
    const signature = generateSignature(timestamp, "");

    // Call IDRX API to get balance
    const response = await fetch(
      `${IDRX_BASE_URL}/api/wallet/balance?address=${walletAddress}&chainId=${chainId}`,
      {
        method: "GET",
        headers: {
          "idrx-api-key": IDRX_API_KEY,
          "idrx-api-sig": signature,
          "idrx-api-ts": timestamp,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      // If API fails, return 0 balance
      return NextResponse.json({
        success: true,
        balance: "0",
        chainId,
      });
    }

    return NextResponse.json({
      success: true,
      balance: data.data?.balance || "0",
      chainId,
    });
  } catch (error) {
    console.error("IDRX Balance API error:", error);
    // Return 0 balance on error
    return NextResponse.json({
      success: true,
      balance: "0",
      chainId: "137",
    });
  }
}
