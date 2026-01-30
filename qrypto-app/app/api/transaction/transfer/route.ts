import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { generateIdrxHeaders } from "@/lib/idrx";

export async function POST(request: Request) {
  try {
    const { walletAddress, bankAccount, bankCode, amount } =
      await request.json();

    if (!walletAddress || !bankAccount || !bankCode || !amount) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: walletAddress, bankAccount, bankCode, amount",
        },
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

    // Check if bank account already exists for this user
    let existingBankAccount = await db.bankAccount.findFirst({
      where: {
        userId: user.id,
        bankAccountNumber: bankAccount,
        bankCode: bankCode,
      },
    });

    if (!existingBankAccount) {
      // Bank account doesn't exist, add it
      const apiKey = decrypt(user.encryptedApiKey);
      const secretKey = decrypt(user.encryptedSecretKey);

      // Call IDRX add bank account API
      const requestBody = { bankCode, bankAccountNumber: bankAccount };
      const headers = generateIdrxHeaders(apiKey, secretKey, requestBody);

      const addBankResponse = await fetch(
        `${process.env.IDRX_BASE_URL}/api/onboarding/add-bank-account`,
        {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        },
      );

      const addBankData = await addBankResponse.json();

      if (!addBankResponse.ok) {
        return NextResponse.json(
          { error: "Failed to add bank account", details: addBankData },
          { status: addBankResponse.status },
        );
      }

      // Store bank account in database
      existingBankAccount = await db.bankAccount.create({
        data: {
          userId: user.id,
          bankCode,
          bankAccountNumber: bankAccount,
        },
      });
    }

    // Now execute the redeem request using the bank account ID
    const redeemRequestBody = {
      walletAddress,
      bankAccountId: existingBankAccount.id,
      amount: amount.toString(),
    };

    const apiKey = decrypt(user.encryptedApiKey);
    const secretKey = decrypt(user.encryptedSecretKey);
    const redeemHeaders = generateIdrxHeaders(
      apiKey,
      secretKey,
      redeemRequestBody,
    );

    const redeemResponse = await fetch(
      `${process.env.IDRX_BASE_URL}/api/transaction/redeem-request`,
      {
        method: "POST",
        headers: {
          ...redeemHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(redeemRequestBody),
      },
    );

    const redeemData = await redeemResponse.json();

    if (redeemResponse.ok) {
      // Create transaction record
      const transaction = await db.transaction.create({
        data: {
          userId: user.id,
          bankAccountId: existingBankAccount.id,
          amount: amountNum,
          type: "MANUAL",
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Transfer completed successfully",
        bankAccount: existingBankAccount,
        transaction,
        idrxResponse: redeemData,
      });
    }

    // Create transaction record as failed
    const transaction = await db.transaction.create({
      data: {
        userId: user.id,
        bankAccountId: existingBankAccount.id,
        amount: amountNum,
        type: "MANUAL",
        status: "FAILED",
      },
    });

    return NextResponse.json(
      {
        error: "Transfer failed",
        details: redeemData,
        transaction,
      },
      { status: redeemResponse.status },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
