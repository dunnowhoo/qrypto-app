import { NextRequest, NextResponse } from "next/server";
import { deleteBankAccount } from "@/lib/idrx";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bankId: string }> }
) {
  try {
    const { bankId: bankIdStr } = await params;
    const bankId = parseInt(bankIdStr);

    if (isNaN(bankId)) {
      return NextResponse.json(
        { error: "Invalid bank ID" },
        { status: 400 }
      );
    }

    const response = await deleteBankAccount(bankId);

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (error) {
    console.error("Delete bank account error:", error);
    return NextResponse.json(
      { error: "Failed to delete bank account" },
      { status: 500 }
    );
  }
}
