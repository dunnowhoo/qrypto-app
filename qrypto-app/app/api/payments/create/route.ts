import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { parseQRIS, isQRISCode } from "../../../lib/qrisParser";
import { requireKYC } from "../../../lib/kycVerification";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, qrisCode, amount } = body;

    // Validate required fields
    if (!walletAddress || !qrisCode) {
      return NextResponse.json(
        { error: "Missing required fields: walletAddress, qrisCode" },
        { status: 400 }
      );
    }

    // Check KYC status first
    const kycCheck = await requireKYC(walletAddress);
    if (!kycCheck.success) {
      return NextResponse.json(
        {
          error: kycCheck.error,
          requiresKYC: true,
        },
        { status: 403 }
      );
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid wallet address format" },
        { status: 400 }
      );
    }

    // Validate QRIS code
    if (!isQRISCode(qrisCode)) {
      return NextResponse.json(
        { error: "Invalid QRIS code format" },
        { status: 400 }
      );
    }

    // Parse QRIS data
    const qrisData = parseQRIS(qrisCode);
    if (!qrisData) {
      return NextResponse.json(
        { error: "Failed to parse QRIS code" },
        { status: 400 }
      );
    }

    // Determine final amount (from QRIS or provided by user for dynamic QRIS)
    const finalAmount = qrisData.transactionAmount || amount;
    if (!finalAmount || finalAmount <= 0) {
      return NextResponse.json(
        { error: "Amount is required for dynamic QRIS" },
        { status: 400 }
      );
    }

    // Calculate service fee (0.1%)
    const serviceFee = Math.ceil(finalAmount * 0.001);
    const totalAmount = finalAmount + serviceFee;

    // Get user by wallet address
    const user = await prisma.user.findFirst({
      where: { walletAddress: walletAddress.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please register first." },
        { status: 404 }
      );
    }

    // Get or create treasury wallet (for receiving IDRX)
    let treasuryWallet = await prisma.treasuryWallet.findFirst({
      where: { isActive: true },
    });

    if (!treasuryWallet) {
      // Create default treasury wallet
      treasuryWallet = await prisma.treasuryWallet.create({
        data: {
          address: process.env.TREASURY_WALLET_ADDRESS || "0x742d35Cc6634C0532925a3b844Bc9e7595f0Fa1A",
          network: "base",
          isActive: true,
        },
      });
    }

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "QRIS_PAYMENT",
        status: "PENDING",
        amount: totalAmount,
        cryptoAmount: totalAmount,
        cryptoCurrency: "IDRX",
        fiatAmount: finalAmount,
        fiatCurrency: "IDR",
        fromAddress: walletAddress,
        toAddress: treasuryWallet.address,
        description: `QRIS Payment to ${qrisData.merchantName || "Merchant"}`,
      },
    });

    // Create QRIS payment record
    const qrisPayment = await prisma.qrisPayment.create({
      data: {
        transactionId: transaction.id,
        qrisRaw: qrisCode,
        merchantName: qrisData.merchantName || "Unknown Merchant",
        merchantCity: qrisData.merchantCity || null,
        merchantId: qrisData.merchantAccountInfo?.merchantId || null,
        terminalId: qrisData.additionalData?.terminalLabel || null,
      },
    });

    // Return payment details
    return NextResponse.json({
      success: true,
      payment: {
        id: transaction.id,
        qrisPaymentId: qrisPayment.id,
        amount: finalAmount,
        serviceFee,
        totalAmount,
        treasuryAddress: treasuryWallet.address,
        merchantName: qrisData.merchantName,
        merchantCity: qrisData.merchantCity,
        status: "PENDING",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      },
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
