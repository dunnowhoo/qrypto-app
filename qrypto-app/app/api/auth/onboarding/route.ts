import { NextRequest, NextResponse } from "next/server";
import { onboardUser } from "@/lib/idrx";
import prisma from "@/lib/prisma";
import { encryptData } from "@/lib/encryption";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const email = formData.get("email") as string;
    const fullname = formData.get("fullname") as string;
    const address = formData.get("address") as string;
    const idNumber = formData.get("idNumber") as string;
    const idFile = formData.get("idFile") as File;
    const walletAddress = formData.get("walletAddress") as string;

    if (!email || !fullname || !address || !idNumber || !idFile || !walletAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Call IDRX API to onboard user
    const idrxResponse = await onboardUser({
      email,
      fullname,
      address,
      idNumber,
      idFile,
    });

    // Encrypt the API keys before storing
    const encryptedApiKey = encryptData(idrxResponse.data.apiKey);
    const encryptedApiSecret = encryptData(idrxResponse.data.apiSecret);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
    });

    let user;
    if (existingUser) {
      // Update existing user with KYC data
      user = await prisma.user.update({
        where: { walletAddress: walletAddress.toLowerCase() },
        data: {
          address,
          fullName: fullname,
          email,
          idNumber,
          kycStatus: "APPROVED",
          encryptedApiKey,
          encryptedSecretKey: encryptedApiSecret,
        },
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          walletAddress: walletAddress.toLowerCase(),
          address,
          fullName: fullname,
          email,
          idNumber,
          kycStatus: "APPROVED",
          encryptedApiKey,
          encryptedSecretKey: encryptedApiSecret,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        idrxUserId: idrxResponse.data.id,
        fullname: idrxResponse.data.fullname,
        createdAt: idrxResponse.data.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Failed to onboard user" },
      { status: 500 }
    );
  }
}
