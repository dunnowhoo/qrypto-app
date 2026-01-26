# Mini PRD: QRypto Backend (Next.js)

## Scope

Backend API for crypto payment gateway with encrypted credential storage.

## Database Schema

```typescript
User {
  id: uuid
  walletAddress: string (unique, hardcoded for MVP)
  kycStatus: enum (pending, approved, rejected)
  encryptedApiKey: string
  encryptedSecretKey: string
  createdAt: timestamp
}

BankAccount {
  id: uuid
  userId: uuid (FK)
  bankCode: string
  bankAccountNumber: string
  createdAt: timestamp
}

Transaction {
  id: uuid
  userId: uuid (FK)
  bankAccountId: uuid (FK)
  amount: decimal
  status: enum (pending, completed, failed)
  type: enum (manual, qris)
  merchantId: string? (for QRIS)
  createdAt: timestamp
  completedAt: timestamp?
}

Merchant {
  id: uuid
  merchantId: string (unique, for QRIS)
  name: string
  bankAccountId: uuid (FK)
  defaultAmount: decimal
}
```

## API Endpoints

### Authentication

- `POST /api/auth/kyc` - Submit KYC data, store encrypted API key & secret key
- `GET /api/auth/user` - Get current user info

### Bank Management

- `POST /api/auth/add-bank-account` - Add bank account (calls IDRX API)
- `GET /api/auth/get-bank-accounts` - List user's bank accounts
- `DELETE /api/auth/delete-bank-account/:id` - Delete bank account (calls IDRX API)

### Transactions

- `POST /api/transaction/redeem-request` - Create redeem request with bank ID + amount
- `GET /api/transaction/user-transaction-history` - Get user's transaction history
- `POST /api/qris/scan` - Process QRIS scan: extract merchant ID, lookup bank, auto-redeem with hardcoded amount

## Technical Implementation

### Encryption

- Use AES-256-GCM for API key & secret key encryption
- Store encryption key in environment variable
- Decrypt credentials on-the-fly when calling IDRX API

### IDRX API Integration

- Implement HMAC-SHA256 signature generation (timestamp + secret)
- Headers: `idrx-api-key`, `idrx-api-sig`, `idrx-api-ts`
- Decrypt user's keys before each IDRX API call

### Static Data

- `lib/constants.ts` - `BANK_LIST` array with supported banks

## Core Logic

### KYC Endpoint

1. Accept KYC data + API key + secret key
2. Encrypt both keys with AES-256-GCM
3. Store encrypted keys in User table
4. Call IDRX `/api/onboarding`

### Redeem Flow

0. user give bank detail and amount
1. Decrypt user's API key & secret
2. Generate IDRX signature
3. User add bank account of destination by calling IDRX `/api/onboarding/add-bank-account`, get bankId and use for next step
4. Call IDRX `/api/transaction/redeem-request` with bankId and amount
5. Store transaction record

### QRIS Flow

1. Extract merchant ID from QR data
2. Query Merchant table for bank account ID
3. Auto-redeem with merchant's default amount
4. Store transaction record with type='qris'

## Environment Variables

```
DATABASE_URL=
ENCRYPTION_KEY=
IDRX_BASE_URL=
```

## Dependencies

- Prisma (ORM)
- crypto (Node.js native, for encryption)
- axios (HTTP client)
