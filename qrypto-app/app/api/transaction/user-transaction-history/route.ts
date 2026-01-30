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
      where: { walletAddress }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const transactions = await db.transaction.findMany({
      where: { userId: user.id },
      include: {
        bankAccount: true
      },
      orderBy: { createdAt: "desc" }
    });

    // Enrich transactions with bank names
    const enrichedTransactions = transactions.map(transaction => {
      let bankName = "Unknown Bank";
      if (transaction.bankAccount) {
        const bankInfo = BANK_LIST.find(bank => bank.bankCode === transaction.bankAccount!.bankCode);
        bankName = bankInfo?.bankName || "Unknown Bank";
      }

      return {
        ...transaction,
        bankName
      };
    });

    return NextResponse.json({ transactions: enrichedTransactions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}