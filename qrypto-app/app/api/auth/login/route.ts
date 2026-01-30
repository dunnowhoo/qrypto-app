import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress: address.toLowerCase() },
    });

    let isNewUser = false;

    if (!user) {
      // Create new user if doesn't exist
      user = await prisma.user.create({
        data: {
          walletAddress: address.toLowerCase(),
        },
      });
      isNewUser = true;
    } else {
      // Check if user has completed profile (has fullName)
      isNewUser = !user.fullName;
    }

    // Check if user needs onboarding (KYC)
    const needsOnboarding = !user.kycStatus || user.kycStatus === 'PENDING';

    return NextResponse.json({
      success: true,
      isNewUser,
      needsOnboarding,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        address: user.address,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        kycStatus: user.kycStatus,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
