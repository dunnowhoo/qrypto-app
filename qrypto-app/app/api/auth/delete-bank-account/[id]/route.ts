import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { generateIdrxHeaders } from "@/lib/idrx";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bankAccountId } = await params;
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress");

    if (!walletAddress || !bankAccountId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Get user and bank account
    const user = await db.user.findUnique({
      where: { walletAddress }
    });

    if (!user || !user.encryptedApiKey || !user.encryptedSecretKey) {
      return NextResponse.json({ error: "User not found or KYC not completed" }, { status: 404 });
    }

    const bankAccount = await db.bankAccount.findFirst({
      where: {
        id: bankAccountId,
        userId: user.id
      }
    });

    if (!bankAccount) {
      return NextResponse.json({ error: "Bank account not found" }, { status: 404 });
    }

    const apiKey = decrypt(user.encryptedApiKey);
    const secretKey = decrypt(user.encryptedSecretKey);

    // Call IDRX delete bank account API
    const requestBody = {
      bankCode: bankAccount.bankCode,
      bankAccountNumber: bankAccount.bankAccountNumber
    };
    const headers = generateIdrxHeaders(apiKey, secretKey, requestBody);

    const response = await fetch(`${process.env.IDRX_BASE_URL}/api/onboarding/delete-bank-account`, {
      method: "DELETE",
      headers: {
        ...headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (response.ok) {
      // Delete from database
      await db.bankAccount.delete({
        where: { id: bankAccountId }
      });

      return NextResponse.json({ success: true });
    }

    const data = await response.json();
    return NextResponse.json({ error: "Failed to delete bank account", details: data }, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}