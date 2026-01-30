import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { BANK_LIST } from "@/lib/const";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress");

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { walletAddress },
      include: {
        bankAccounts: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Enrich bank accounts with bank names
    const enrichedBankAccounts = user.bankAccounts.map(account => {
      const bankInfo = BANK_LIST.find(bank => bank.bankCode === account.bankCode);
      return {
        ...account,
        bankName: bankInfo?.bankName || "Unknown Bank"
      };
    });

    return NextResponse.json({ bankAccounts: enrichedBankAccounts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}