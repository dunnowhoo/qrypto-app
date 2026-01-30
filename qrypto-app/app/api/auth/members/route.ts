import { NextRequest, NextResponse } from "next/server";
import { getMembers } from "@/lib/idrx";

export async function GET(request: NextRequest) {
  try {
    const response = await getMembers();

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (error) {
    console.error("Get members error:", error);
    return NextResponse.json(
      { error: "Failed to get members" },
      { status: 500 }
    );
  }
}
