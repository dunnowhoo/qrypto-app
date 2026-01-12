/**
 * Xendit Disbursement Service
 * 
 * Handles bank transfers to merchants via Xendit Disbursement API
 * https://developers.xendit.co/api-reference/#create-disbursement
 * 
 * For Hackathon: Uses Xendit Sandbox mode
 */

// Xendit supported bank codes in Indonesia
export const XENDIT_BANK_CODES = {
  BCA: "BCA",
  BNI: "BNI",
  BRI: "BRI",
  MANDIRI: "MANDIRI",
  PERMATA: "PERMATA",
  CIMB: "CIMB",
  BSI: "BSI",
  DANAMON: "DANAMON",
  MAYBANK: "MAYBANK",
  BTN: "BTN",
  OCBC: "OCBC",
  MEGA: "MEGA",
  PANIN: "PANIN",
  HSBC: "HSBC",
  UOB: "UOB",
} as const;

export type XenditBankCode = keyof typeof XENDIT_BANK_CODES;

interface DisbursementRequest {
  externalId: string;           // Your unique transaction ID
  amount: number;               // Amount in IDR (integer, no decimals)
  bankCode: XenditBankCode;     // Bank destination code
  accountNumber: string;        // Bank account number
  accountHolderName: string;    // Account holder name
  description?: string;         // Optional description
}

interface DisbursementResponse {
  id: string;                   // Xendit disbursement ID
  external_id: string;          // Your reference ID
  amount: number;
  bank_code: string;
  account_holder_name: string;
  disbursement_description: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
}

interface XenditError {
  error_code: string;
  message: string;
}

/**
 * Create a disbursement (bank transfer) via Xendit
 */
export async function createDisbursement(
  request: DisbursementRequest
): Promise<{ success: true; data: DisbursementResponse } | { success: false; error: string }> {
  const apiKey = process.env.XENDIT_SECRET_KEY;
  
  if (!apiKey) {
    console.error("XENDIT_SECRET_KEY not configured");
    return { success: false, error: "Payment service not configured" };
  }

  // Xendit API endpoint
  const endpoint = "https://api.xendit.co/disbursements";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
        "X-IDEMPOTENCY-KEY": request.externalId, // Prevent duplicate transactions
      },
      body: JSON.stringify({
        external_id: request.externalId,
        amount: Math.floor(request.amount), // Xendit requires integer
        bank_code: request.bankCode,
        account_holder_name: request.accountHolderName,
        account_number: request.accountNumber,
        description: request.description || "QRIS Payment via QRypto",
      }),
    });

    if (!response.ok) {
      const errorData: XenditError = await response.json();
      console.error("Xendit disbursement error:", errorData);
      return { 
        success: false, 
        error: errorData.message || `Disbursement failed: ${errorData.error_code}` 
      };
    }

    const data: DisbursementResponse = await response.json();
    return { success: true, data };

  } catch (error) {
    console.error("Xendit API error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to process disbursement" 
    };
  }
}

/**
 * Check disbursement status
 */
export async function getDisbursementStatus(
  disbursementId: string
): Promise<{ success: true; data: DisbursementResponse } | { success: false; error: string }> {
  const apiKey = process.env.XENDIT_SECRET_KEY;
  
  if (!apiKey) {
    return { success: false, error: "Payment service not configured" };
  }

  try {
    const response = await fetch(`https://api.xendit.co/disbursements/${disbursementId}`, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
      },
    });

    if (!response.ok) {
      const errorData: XenditError = await response.json();
      return { success: false, error: errorData.message };
    }

    const data: DisbursementResponse = await response.json();
    return { success: true, data };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to check status" 
    };
  }
}

/**
 * Validate bank account via Xendit (for verification before transfer)
 */
export async function validateBankAccount(
  bankCode: XenditBankCode,
  accountNumber: string
): Promise<{ success: true; accountName: string } | { success: false; error: string }> {
  const apiKey = process.env.XENDIT_SECRET_KEY;
  
  if (!apiKey) {
    return { success: false, error: "Payment service not configured" };
  }

  try {
    const response = await fetch("https://api.xendit.co/bank_account_data_requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
      },
      body: JSON.stringify({
        bank_account_number: accountNumber,
        bank_code: bankCode,
      }),
    });

    if (!response.ok) {
      const errorData: XenditError = await response.json();
      return { success: false, error: errorData.message };
    }

    const data = await response.json();
    return { success: true, accountName: data.bank_account_holder_name };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to validate account" 
    };
  }
}

/**
 * MOCK: Simulate disbursement for demo/testing when Xendit is not configured
 * This allows the app to work without Xendit API key for hackathon demo
 */
export async function mockDisbursement(
  request: DisbursementRequest
): Promise<{ success: true; data: DisbursementResponse }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  return {
    success: true,
    data: {
      id: `MOCK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      external_id: request.externalId,
      amount: Math.floor(request.amount),
      bank_code: request.bankCode,
      account_holder_name: request.accountHolderName,
      disbursement_description: request.description || "QRIS Payment via QRypto",
      status: "COMPLETED",
    },
  };
}

/**
 * Smart disbursement: Uses Xendit if configured, otherwise falls back to mock
 */
export async function processDisbursement(
  request: DisbursementRequest
): Promise<{ success: true; data: DisbursementResponse } | { success: false; error: string }> {
  const apiKey = process.env.XENDIT_SECRET_KEY;

  if (apiKey) {
    // Production mode: Use actual Xendit API
    return createDisbursement(request);
  } else {
    // Demo mode: Use mock disbursement
    console.log("[DEMO MODE] Simulating Xendit disbursement:", request);
    return mockDisbursement(request);
  }
}
