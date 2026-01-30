import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { generateIdrxHeaders } from "@/lib/idrx";

export async function POST(request: Request) {
  try {
    const { walletAddress, bankAccountId, amount } = await request.json();

    if (!walletAddress || !bankAccountId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validate amount is a positive number
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 },
      );
    }

    // Get user and decrypt credentials
    const user = await db.user.findUnique({
      where: { walletAddress },
    });

    if (!user || !user.encryptedApiKey || !user.encryptedSecretKey) {
      return NextResponse.json(
        { error: "User not found or KYC not completed" },
        { status: 404 },
      );
    }

    // Get bank account
    const bankAccount = await db.bankAccount.findFirst({
      where: {
        id: bankAccountId,
        userId: user.id,
      },
    });

    if (!bankAccount) {
      return NextResponse.json(
        { error: "Bank account not found" },
        { status: 404 },
      );
    }

    const apiKey = decrypt(user.encryptedApiKey);
    const secretKey = decrypt(user.encryptedSecretKey);

    // Create transaction record
    const transaction = await db.transaction.create({
      data: {
        userId: user.id,
        bankAccountId: bankAccount.id,
        amount: amountNum,
        type: "MANUAL",
        status: "PENDING",
      },
    });

    // Call IDRX redeem request API
    const requestBody = {
      bankCode: bankAccount.bankCode,
      bankAccountNumber: bankAccount.bankAccountNumber,
      amount: amount.toString(),
    };

    const headers = generateIdrxHeaders(apiKey, secretKey, requestBody);

    const response = await fetch(
      `${process.env.IDRX_BASE_URL}/api/transaction/redeem-request`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
    );

    const data = await response.json();

    if (response.ok) {
      // Update transaction status
      await db.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        transaction,
        idrxResponse: data,
      });
    }

    // Update transaction as failed
    await db.transaction.update({
      where: { id: transaction.id },
      data: { status: "FAILED" },
    });

    return NextResponse.json(
      {
        error: "Redeem request failed",
        details: data,
        transaction,
      },
      { status: response.status },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
