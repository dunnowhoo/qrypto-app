import { NextResponse } from "next/server";
import { BANK_LIST } from "@/lib/const";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Filter banks based on whether to include digital wallets
    let banks = BANK_LIST;

    return NextResponse.json({
      banks,
      totalBanks: banks.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
