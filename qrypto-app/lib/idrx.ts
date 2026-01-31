import crypto from "crypto";

const IDRX_BASE_URL = process.env.IDRX_BASE_URL || "https://idrx.co";
const IDRX_API_KEY = process.env.IDRX_API_KEY!;
const IDRX_API_SECRET = process.env.IDRX_API_SECRET!;

export function generateIdrxHeaders(
  apiKey: string,
  apiSecret: string,
  body?: any,
) {
  const timestamp = Date.now().toString();

  // Logic: Some IDRX endpoints sign with body, others just timestamp.
  const payload = body ? apiKey + timestamp + JSON.stringify(body) : timestamp;

  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(payload)
    .digest("hex");

  return {
    "idrx-api-key": apiKey,
    "idrx-api-sig": signature,
    "idrx-api-ts": timestamp,
  };
}

export interface OnboardingData {
  email: string;
  fullname: string;
  address: string;
  idNumber: string;
  idFile: File;
}

export interface OnboardingResponse {
  statusCode: number;
  message: string;
  data: {
    id: number;
    fullname: string;
    createdAt: string;
    apiKey: string;
    apiSecret: string;
  };
}

export interface MemberData {
  id: number;
  email: string;
  createdAt: string;
  fullname: string;
  ApiKeys: Array<{
    apiKey: string;
  }>;
}

export interface BankAccountData {
  id: number;
  userId: number;
  bankAccountNumber: string;
  bankAccountName: string;
  bankAccountNumberHash: string | null;
  bankCode: string;
  bankName: string;
  maxAmountTransfer: string;
  deleted: boolean;
  DepositWalletAddress: {
    walletAddress: string;
    createdAt: string;
  };
}

export async function onboardUser(data: OnboardingData): Promise<OnboardingResponse> {
  const formData = new FormData();
  formData.append("email", data.email);
  formData.append("fullname", data.fullname);
  formData.append("address", data.address);
  formData.append("idNumber", data.idNumber);
  formData.append("idFile", data.idFile);

  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", IDRX_API_SECRET)
    .update(IDRX_API_KEY + timestamp)
    .digest("hex");

  const response = await fetch(`${IDRX_BASE_URL}/api/auth/onboarding`, {
    method: "POST",
    headers: {
      "idrx-api-key": IDRX_API_KEY,
      "idrx-api-sig": signature,
      "idrx-api-ts": timestamp,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('IDRX Onboarding Error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData
    });
    throw new Error(`Failed to onboard user: ${response.status} - ${errorData.message || response.statusText}`);
  }

  return response.json();
}

export async function getMembers(): Promise<{ statusCode: number; message: string; data: MemberData[] }> {
  const headers = generateIdrxHeaders(IDRX_API_KEY, IDRX_API_SECRET);

  const response = await fetch(`${IDRX_BASE_URL}/api/auth/members`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to get members: ${response.status}`);
  }

  return response.json();
}

export async function getBankAccounts(): Promise<{ statusCode: number; message: string; data: BankAccountData[] }> {
  const headers = generateIdrxHeaders(IDRX_API_KEY, IDRX_API_SECRET);

  const response = await fetch(`${IDRX_BASE_URL}/api/auth/get-bank-accounts`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to get bank accounts: ${response.status}`);
  }

  return response.json();
}

export async function deleteBankAccount(bankId: number): Promise<{ statusCode: number; message: string; data: null }> {
  const headers = generateIdrxHeaders(IDRX_API_KEY, IDRX_API_SECRET);

  const response = await fetch(`${IDRX_BASE_URL}/api/auth/delete-bank-account/${bankId}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to delete bank account: ${response.status}`);
  }

  return response.json();
}

// Transaction APIs

export interface BankMethod {
  bankCode: string;
  bankName: string;
  maxAmountTransfer: string;
}

export interface RedeemRequestData {
  txHash: string;
  networkChainId: string;
  amountTransfer: string;
  bankAccount: string;
  bankCode: string;
  bankName: string;
  bankAccountName: string;
  walletAddress: string;
  notes?: string;
}

export interface RedeemRequestResponse {
  statusCode: number;
  message: string;
  data: {
    id: number;
    chainId: number;
    userId: number;
    requester: string;
    txHash: string;
    fromAddress: string;
    amount: string;
    bankName: string;
    bankCode: string;
    bankAccountNumber: string;
    bankAccountName: string;
    custRefNumber: string;
    disburseId: number;
    burnStatus: string;
    createdAt: string;
    updatedAt: string;
    deleted: boolean;
  };
}

export interface TransactionHistoryParams {
  transactionType: 'MINT' | 'BURN' | 'BRIDGE' | 'DEPOSIT_REDEEM';
  page: number;
  take: number;
  userMintStatus?: string;
  paymentStatus?: string;
  burnStatus?: string;
  bridgeStatus?: string;
  merchantOrderId?: string;
  originChainId?: number;
  destinationChainId?: number;
  amountMax?: string;
  amountMin?: string;
  txHash?: string;
  orderByDate?: 'ASC' | 'DESC';
  orderByAmount?: 'ASC' | 'DESC';
  transferTxHash?: string;
  burnTxHash?: string;
}

/**
 * Get available bank methods for transfer
 */
export async function getBankMethods(
  apiKey: string,
  apiSecret: string
): Promise<{ statusCode: number; message: string; data: BankMethod[] }> {
  const headers = generateIdrxHeaders(apiKey, apiSecret);

  const response = await fetch(`${IDRX_BASE_URL}/api/transaction/method`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to get bank methods: ${response.status}`);
  }

  return response.json();
}

/**
 * Submit redeem request to transfer IDRX to bank account
 */
export async function submitRedeemRequest(
  apiKey: string,
  apiSecret: string,
  data: RedeemRequestData
): Promise<RedeemRequestResponse> {
  const headers = generateIdrxHeaders(apiKey, apiSecret, data);

  const response = await fetch(`${IDRX_BASE_URL}/api/transaction/redeem-request`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to submit redeem request: ${response.status}`);
  }

  return response.json();
}

/**
 * Get user transaction history
 */
export async function getUserTransactionHistory(
  apiKey: string,
  apiSecret: string,
  params: TransactionHistoryParams
): Promise<any> {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });

  const headers = generateIdrxHeaders(apiKey, apiSecret);

  const response = await fetch(`${IDRX_BASE_URL}/api/transaction/user-transaction-history?${queryParams}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to get transaction history: ${response.status}`);
  }

  return response.json();
}
