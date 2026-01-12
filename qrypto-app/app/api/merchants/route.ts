import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

/**
 * API to manage merchant mappings
 * 
 * GET - List all registered merchants
 * POST - Add a new merchant mapping
 */

export async function GET() {
  try {
    const merchants = await prisma.merchantMap.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nmid: true,
        merchantName: true,
        bankCode: true,
        accountNumber: true,
        accountName: true,
        description: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      merchants,
      count: merchants.length,
    });
  } catch (error) {
    console.error("Error fetching merchants:", error);
    return NextResponse.json(
      { error: "Failed to fetch merchants" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nmid, merchantName, bankCode, accountNumber, accountName, description } = body;

    // Validate required fields
    if (!bankCode || !accountNumber || !accountName) {
      return NextResponse.json(
        { error: "Missing required fields: bankCode, accountNumber, accountName" },
        { status: 400 }
      );
    }

    // At least one identifier required
    if (!nmid && !merchantName) {
      return NextResponse.json(
        { error: "Either nmid or merchantName is required for matching" },
        { status: 400 }
      );
    }

    // Check for duplicate NMID
    if (nmid) {
      const existing = await prisma.merchantMap.findFirst({
        where: { nmid },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Merchant with this NMID already exists", existingId: existing.id },
          { status: 409 }
        );
      }
    }

    // Create merchant mapping
    const merchant = await prisma.merchantMap.create({
      data: {
        nmid: nmid || null,
        merchantName: merchantName || null,
        bankCode,
        accountNumber,
        accountName,
        description: description || null,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      merchant: {
        id: merchant.id,
        nmid: merchant.nmid,
        merchantName: merchant.merchantName,
        bankCode: merchant.bankCode,
        accountNumber: merchant.accountNumber,
        accountName: merchant.accountName,
      },
    });
  } catch (error) {
    console.error("Error creating merchant:", error);
    return NextResponse.json(
      { error: "Failed to create merchant" },
      { status: 500 }
    );
  }
}
