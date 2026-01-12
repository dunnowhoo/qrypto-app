import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { parseQRIS, getMerchantIdentifier } from "../../../lib/qrisParser";
import { processDisbursement, XenditBankCode } from "../../../lib/xendit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, txHash } = body;

    // Validate required fields
    if (!paymentId || !txHash) {
      return NextResponse.json(
        { error: "Missing required fields: paymentId, txHash" },
        { status: 400 }
      );
    }

    // Validate transaction hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return NextResponse.json(
        { error: "Invalid transaction hash format" },
        { status: 400 }
      );
    }

    // Find the transaction with QRIS payment data
    const transaction = await prisma.transaction.findUnique({
      where: { id: paymentId },
      include: { qrisPayment: true },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Check if already processed
    if (transaction.status !== "PENDING") {
      return NextResponse.json(
        { error: `Payment already ${transaction.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Update transaction to processing
    await prisma.transaction.update({
      where: { id: paymentId },
      data: {
        status: "PROCESSING",
        txHash,
      },
    });

    // TODO: In production, verify the blockchain transaction here
    // using viem/ethers to confirm the IDRX was actually sent

    // Parse QRIS to get merchant identifier
    let merchantMap = null;
    if (transaction.qrisPayment?.qrisRaw) {
      const qrisData = parseQRIS(transaction.qrisPayment.qrisRaw);
      const { nmid, merchantName } = getMerchantIdentifier(qrisData);

      // Lookup merchant in our mapping table
      // First try by NMID (exact match), then by merchant name
      if (nmid) {
        merchantMap = await prisma.merchantMap.findFirst({
          where: { nmid, isActive: true },
        });
      }
      
      if (!merchantMap && merchantName) {
        // Fuzzy match by name (case-insensitive)
        merchantMap = await prisma.merchantMap.findFirst({
          where: { 
            merchantName: { contains: merchantName, mode: "insensitive" },
            isActive: true,
          },
        });
      }
    }

    let disbursementResult = null;
    let gatewayTransactionId = "";

    if (merchantMap) {
      // Found merchant mapping -> Execute Xendit disbursement
      console.log(`Found merchant mapping: ${merchantMap.merchantName} -> ${merchantMap.bankCode} ${merchantMap.accountNumber}`);

      const disbursementRequest = {
        externalId: transaction.id,
        amount: transaction.fiatAmount?.toNumber() || 0,
        bankCode: merchantMap.bankCode as XenditBankCode,
        accountNumber: merchantMap.accountNumber,
        accountHolderName: merchantMap.accountName,
        description: `QRIS Payment to ${merchantMap.merchantName || transaction.qrisPayment?.merchantName}`,
      };

      disbursementResult = await processDisbursement(disbursementRequest);

      if (!disbursementResult.success) {
        // Disbursement failed
        await prisma.transaction.update({
          where: { id: paymentId },
          data: { status: "FAILED" },
        });

        if (transaction.qrisPayment) {
          await prisma.qrisPayment.update({
            where: { id: transaction.qrisPayment.id },
            data: { 
              gatewayStatus: "FAILED",
              paymentGateway: "xendit",
            },
          });
        }

        return NextResponse.json(
          { error: `Disbursement failed: ${disbursementResult.error}` },
          { status: 500 }
        );
      }

      gatewayTransactionId = disbursementResult.data.id;
    } else {
      // No merchant mapping found
      // For hackathon demo: we'll still mark it as success but log a warning
      console.warn(`No merchant mapping found for QRIS. Merchant: ${transaction.qrisPayment?.merchantName}`);
      
      // Option 1: Fail the transaction (stricter)
      // return NextResponse.json(
      //   { error: "Merchant not registered in QRypto network" },
      //   { status: 400 }
      // );

      // Option 2: Mock success for demo (we'll use this for hackathon)
      gatewayTransactionId = `DEMO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log(`[DEMO MODE] Mock disbursement created: ${gatewayTransactionId}`);
    }

    // Update transaction to success
    const updatedTransaction = await prisma.transaction.update({
      where: { id: paymentId },
      data: {
        status: "SUCCESS",
        completedAt: new Date(),
      },
    });

    // Update QRIS payment record
    if (transaction.qrisPayment) {
      await prisma.qrisPayment.update({
        where: { id: transaction.qrisPayment.id },
        data: {
          gatewayStatus: "SUCCESS",
          gatewayRefId: gatewayTransactionId,
          paymentGateway: merchantMap ? "xendit" : "demo",
          paidAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: updatedTransaction.id,
        status: "SUCCESS",
        txHash,
        amount: transaction.fiatAmount?.toNumber() || 0,
        merchantName: transaction.qrisPayment?.merchantName || "Merchant",
        gatewayTransactionId,
        merchantMapped: !!merchantMap,
        completedAt: updatedTransaction.completedAt,
      },
    });
  } catch (error) {
    console.error("Error confirming payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
