import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { generateIdrxHeaders } from "@/lib/idrx";

export async function POST(request: Request) {
  try {
    const { walletAddress, bankCode, bankAccountNumber } = await request.json();

    if (!walletAddress || !bankCode || !bankAccountNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get user and decrypt credentials
    const user = await db.user.findUnique({
      where: { walletAddress }
    });

    if (!user || !user.encryptedApiKey || !user.encryptedSecretKey) {
      return NextResponse.json({ error: "User not found or KYC not completed" }, { status: 404 });
    }

    const apiKey = decrypt(user.encryptedApiKey);
    const secretKey = decrypt(user.encryptedSecretKey);

    // Call IDRX add bank account API
    const requestBody = { bankCode, bankAccountNumber };
    const headers = generateIdrxHeaders(apiKey, secretKey, requestBody);

    const response = await fetch(`${process.env.IDRX_BASE_URL}/api/onboarding/add-bank-account`, {
      method: "POST",
      headers: { 
        ...headers, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (response.ok) {
      // Store bank account in database
      const bankAccount = await db.bankAccount.create({
        data: {
          userId: user.id,
          bankCode,
          bankAccountNumber
        }
      });

      return NextResponse.json({ 
        success: true, 
        bankAccount,
        idrxResponse: data 
      });
    }

    return NextResponse.json({ error: "Failed to add bank account", details: data }, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}