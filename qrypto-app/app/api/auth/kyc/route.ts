import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { generateIdrxHeaders } from "@/lib/idrx";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const walletAddress = formData.get("walletAddress") as string;
    const apiKey = formData.get("apiKey") as string;
    const secretKey = formData.get("secretKey") as string;

    if (!walletAddress || !apiKey || !secretKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Encrypt credentials
    const encryptedApiKey = encrypt(apiKey);
    const encryptedSecretKey = encrypt(secretKey);

    // Create or update user
    const user = await db.user.upsert({
      where: { walletAddress },
      update: {
        encryptedApiKey,
        encryptedSecretKey,
        kycStatus: "PENDING"
      },
      create: {
        walletAddress,
        encryptedApiKey,
        encryptedSecretKey,
        kycStatus: "PENDING"
      }
    });

    // Call IDRX onboarding API
    const headers = generateIdrxHeaders(apiKey, secretKey);
    
    const response = await fetch(`${process.env.IDRX_BASE_URL}/api/onboarding`, {
      method: "POST",
      headers: { ...headers },
      body: formData
    });

    const data = await response.json();
    
    if (response.ok) {
      await db.user.update({
        where: { id: user.id },
        data: { kycStatus: "APPROVED" }
      });
    }

    return NextResponse.json({ 
      success: true, 
      userId: user.id,
      kycStatus: user.kycStatus,
      idrxResponse: data 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}