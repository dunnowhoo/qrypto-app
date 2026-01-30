import { NextRequest, NextResponse } from "next/server";
import { getBankAccounts } from "@/lib/idrx";

export async function GET(request: NextRequest) {
  try {
    const response = await getBankAccounts();

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (error) {
    console.error("Get bank accounts error:", error);
    return NextResponse.json(
      { error: "Failed to get bank accounts" },
      { status: 500 }
    );
  }
}
