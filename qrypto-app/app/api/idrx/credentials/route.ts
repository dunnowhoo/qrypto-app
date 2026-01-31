import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// Simple encrypt function (in production use proper encryption like AES-256)
function encryptKey(key: string): string {
  // For production, implement proper AES encryption with a secret key
  // For now, just return the key (NOT SECURE - only for development)
  return key;
}

// GET - Check if user has IDRX credentials
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const walletAddress = searchParams.get("address");

  if (!walletAddress) {
    return NextResponse.json(
      { success: false, error: "Wallet address required" },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
      select: {
        encryptedApiKey: true,
        encryptedSecretKey: true,
      },
    });

    return NextResponse.json({
      success: true,
      hasCredentials: !!(user?.encryptedApiKey && user?.encryptedSecretKey),
    });
  } catch (error) {
    console.error("Error checking credentials:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check credentials" },
      { status: 500 }
    );
  }
}

// POST - Save IDRX API credentials
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, apiKey, apiSecret } = body;

    if (!walletAddress || !apiKey || !apiSecret) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate API key format (basic validation)
    if (apiKey.length < 10 || apiSecret.length < 10) {
      return NextResponse.json(
        { success: false, error: "Invalid API key or secret format" },
        { status: 400 }
      );
    }

    // Encrypt the credentials
    const encryptedApiKey = encryptKey(apiKey);
    const encryptedSecretKey = encryptKey(apiSecret);

    // Upsert user with credentials
    const user = await prisma.user.upsert({
      where: { walletAddress: walletAddress.toLowerCase() },
      update: {
        encryptedApiKey,
        encryptedSecretKey,
        updatedAt: new Date(),
      },
      create: {
        walletAddress: walletAddress.toLowerCase(),
        encryptedApiKey,
        encryptedSecretKey,
      },
    });

    return NextResponse.json({
      success: true,
      message: "IDRX credentials saved successfully",
      userId: user.id,
    });
  } catch (error) {
    console.error("Error saving credentials:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save credentials" },
      { status: 500 }
    );
  }
}

// DELETE - Remove IDRX API credentials
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const walletAddress = searchParams.get("address");

  if (!walletAddress) {
    return NextResponse.json(
      { success: false, error: "Wallet address required" },
      { status: 400 }
    );
  }

  try {
    await prisma.user.update({
      where: { walletAddress: walletAddress.toLowerCase() },
      data: {
        encryptedApiKey: null,
        encryptedSecretKey: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "IDRX credentials removed",
    });
  } catch (error) {
    console.error("Error removing credentials:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove credentials" },
      { status: 500 }
    );
  }
}
