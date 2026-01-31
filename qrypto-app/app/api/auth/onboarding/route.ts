import { NextRequest, NextResponse } from "next/server";
import { onboardUser } from "@/lib/idrx";
import { prisma } from "@/app/lib/prisma";
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

    // Optional: User can provide existing API keys instead of creating new account
    const existingApiKey = formData.get("apiKey") as string;
    const existingApiSecret = formData.get("apiSecret") as string;

    if (!email || !fullname || !address || !idNumber || !walletAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ NEW: Check if this NIK is already registered and APPROVED
    // If yes, link this new wallet to the existing user (same person, different wallet)
    const existingUserWithNIK = await prisma.user.findFirst({
      where: {
        idNumber: idNumber,
        kycStatus: "APPROVED"
      }
    });

    if (existingUserWithNIK) {
      // Same person (NIK) trying to add a new wallet
      console.log(`NIK ${idNumber} already approved. Linking new wallet to existing user.`);

      // Check if this wallet is already linked to a different person
      const currentWalletUser = await prisma.user.findUnique({
        where: { walletAddress: walletAddress.toLowerCase() }
      });

      if (currentWalletUser && currentWalletUser.idNumber && currentWalletUser.idNumber !== idNumber) {
        return NextResponse.json(
          {
            error: "This wallet is already registered with a different identity (NIK)",
            code: "WALLET_ALREADY_USED",
            details: "This wallet address is already linked to another person's KYC. Please use a different wallet."
          },
          { status: 409 }
        );
      }

      // Link this wallet to the existing approved user
      const user = await prisma.user.upsert({
        where: { walletAddress: walletAddress.toLowerCase() },
        update: {
          // Copy KYC data from approved user
          address: existingUserWithNIK.address,
          fullName: existingUserWithNIK.fullName,
          email: existingUserWithNIK.email,
          phone: existingUserWithNIK.phone,
          idNumber: existingUserWithNIK.idNumber,
          kycStatus: "APPROVED",
          encryptedApiKey: existingUserWithNIK.encryptedApiKey,
          encryptedSecretKey: existingUserWithNIK.encryptedSecretKey,
        },
        create: {
          walletAddress: walletAddress.toLowerCase(),
          address: existingUserWithNIK.address,
          fullName: existingUserWithNIK.fullName,
          email: existingUserWithNIK.email,
          phone: existingUserWithNIK.phone,
          idNumber: existingUserWithNIK.idNumber,
          kycStatus: "APPROVED",
          encryptedApiKey: existingUserWithNIK.encryptedApiKey,
          encryptedSecretKey: existingUserWithNIK.encryptedSecretKey,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Wallet linked to existing KYC profile. No need to re-do KYC!",
        data: {
          userId: user.id,
          fullname: user.fullName,
          kycStatus: "APPROVED",
          linkedFromNIK: true,
          createdAt: user.createdAt,
        },
      }, { status: 200 });
    }

    // Check if email is already used by another wallet address
    const existingUserWithEmail = await prisma.user.findFirst({
      where: {
        email: email,
        walletAddress: { not: walletAddress.toLowerCase() }
      }
    });

    if (existingUserWithEmail) {
      return NextResponse.json(
        {
          error: "This email is already registered with another wallet address",
          code: "EMAIL_ALREADY_USED",
          details: "Each email can only be used with one wallet address. Please use a different email or connect the wallet that was originally registered with this email."
        },
        { status: 409 }
      );
    }


    // Check if current user already attempted KYC with this email
    const currentUser = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() }
    });

    let apiKey: string;
    let apiSecret: string;

    // ✅ If user already has API keys in database (PENDING status), use them
    if (currentUser && currentUser.email === email && currentUser.kycStatus === 'PENDING') {
      if (currentUser.encryptedApiKey && currentUser.encryptedSecretKey) {
        console.log("User already has API keys in database. Using existing keys to complete KYC.");
        
        // Decrypt existing API keys from database
        const { decryptData } = await import("@/lib/encryption");
        apiKey = decryptData(currentUser.encryptedApiKey);
        apiSecret = decryptData(currentUser.encryptedSecretKey);
        
        // Update user with APPROVED status
        const user = await prisma.user.update({
          where: { walletAddress: walletAddress.toLowerCase() },
          data: {
            address,
            fullName: fullname,
            email,
            idNumber,
            kycStatus: "APPROVED",
          },
        });

        return NextResponse.json({
          success: true,
          message: "KYC completed using existing IDRX account",
          data: {
            userId: user.id,
            fullname: user.fullName,
            kycStatus: "APPROVED",
            usedExistingKeys: true,
            createdAt: user.createdAt,
          },
        }, { status: 200 });
      } else {
        // User has PENDING status but no API keys - show error
        return NextResponse.json(
          { 
            error: "You have already submitted KYC with this email. Please use your IDRX API keys instead.",
            code: "EMAIL_ALREADY_EXISTS",
            details: "This email was registered with IDRX in a previous attempt. Please check the 'I already have an IDRX account' option and enter your API credentials, or contact support to retrieve them."
          },
          { status: 409 }
        );
      }
    }
    // If user provides existing API keys, use them instead of calling IDRX onboarding
    if (existingApiKey && existingApiSecret) {
      console.log("Using existing API keys provided by user");
      apiKey = existingApiKey;
      apiSecret = existingApiSecret;
    } else {
      // Call IDRX API to onboard user (create new account)
      if (!idFile) {
        return NextResponse.json(
          { error: "ID file is required for new account registration" },
          { status: 400 }
        );
      }

      try {
        const idrxResponse = await onboardUser({
          email,
          fullname,
          address,
          idNumber,
          idFile,
        });

        apiKey = idrxResponse.data.apiKey;
        apiSecret = idrxResponse.data.apiSecret;
      } catch (idrxError: any) {
        // Check if error is about duplicate email
        if (idrxError.message?.includes('email is already used')) {
          return NextResponse.json(
            {
              error: "Email already registered with IDRX. Please use your existing API keys instead.",
              code: "EMAIL_ALREADY_EXISTS",
              details: "If you already have an IDRX account, please enter your API Key and Secret instead of creating a new account."
            },
            { status: 409 } // 409 Conflict
          );
        }
        throw idrxError;
      }
    }

    // Encrypt the API keys before storing
    const encryptedApiKey = encryptData(apiKey);
    const encryptedApiSecret = encryptData(apiSecret);

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
        fullname: user.fullName,
        createdAt: user.createdAt,
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
