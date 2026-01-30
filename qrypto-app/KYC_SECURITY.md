# KYC Verification & Transaction Security

## Overview

QRypto requires all users to complete KYC (Know Your Customer) verification before they can make transactions. This ensures compliance with regulations and enables secure payment processing through IDRX.

## KYC Flow

### 1. User Registration
- User connects wallet
- Fills basic profile information
- Account created with `kycStatus: PENDING`

### 2. KYC Onboarding
- User submits required documents:
  - Full Name
  - Email Address
  - Physical Address
  - ID Number (KTP/Passport)
  - ID Photo (JPEG, PNG, WEBP)
- Data sent to IDRX API for verification
- IDRX returns API credentials

### 3. API Key Storage
- API Key and Secret received from IDRX
- **Encrypted** using AES-256-CBC encryption
- Stored in database as `encryptedApiKey` and `encryptedSecretKey`
- Used for all IDRX transactions

### 4. Transaction Authorization
- Before any transaction:
  - System verifies `kycStatus === 'APPROVED'`
  - Decrypts API keys from database
  - Uses keys to authenticate with IDRX
  - Processes transaction

## Security Implementation

### Encryption

**File:** `lib/encryption.ts`

```typescript
// Encrypt sensitive data
const encrypted = encryptData(apiKey);

// Decrypt when needed
const apiKey = decryptData(encrypted);
```

**Algorithm:** AES-256-CBC  
**Key Derivation:** scrypt with salt  
**Format:** `iv:encryptedData` (hex encoded)

### KYC Verification

**File:** `lib/kycVerification.ts`

```typescript
// Verify user KYC status
const { isVerified, user } = await verifyKYCStatus(walletAddress);

// Require KYC for endpoints
const { success, user, error } = await requireKYC(walletAddress);
```

## API Endpoints

### POST /api/auth/onboarding

Onboard new user with KYC verification.

**Request:** `multipart/form-data`
```typescript
{
  email: string
  fullname: string
  address: string (physical address)
  idNumber: string
  idFile: File
  walletAddress: string (blockchain address)
}
```

**IDRX Response:**
```json
{
  "statusCode": 201,
  "message": "success",
  "data": {
    "id": 1011,
    "fullname": "JOHN SMITH",
    "createdAt": "2023-12-12T08:10:29.077Z",
    "apiKey": "3d1c15c7afd157a6",
    "apiSecret": "7bb0de01a2cf17c1094db789bfa05eb1adc185482c3ee828a7ba61b683e9b711"
  }
}
```

**Database Storage:**
```typescript
{
  walletAddress: "0x...",
  fullName: "JOHN SMITH",
  email: "john@example.com",
  kycStatus: "APPROVED",
  encryptedApiKey: "iv:encrypted_key",
  encryptedSecretKey: "iv:encrypted_secret"
}
```

### POST /api/payments/create

Create new QRIS payment (requires KYC).

**KYC Check:**
```typescript
const kycCheck = await requireKYC(walletAddress);
if (!kycCheck.success) {
  return NextResponse.json(
    { 
      error: kycCheck.error,
      requiresKYC: true,
    },
    { status: 403 }
  );
}
```

### POST /api/payments/confirm

Confirm payment transaction (requires KYC).

## User Interface

### KYC Status Indicators

**Home Page:**
- Shows warning banner if KYC not complete
- Restricts Scan QR button functionality
- Displays KYC badge on avatar when approved

**Scan Page:**
- Redirects to `/onboarding` if KYC not complete
- Cannot scan QR codes without KYC

**Payment Flow:**
- Blocked at API level if KYC not verified
- Returns `403 Forbidden` with `requiresKYC: true`

### KYC Components

**OnboardingKYC Component:**
```tsx
<OnboardingKYC />
```
- Form for KYC data submission
- File upload for ID
- Calls `/api/auth/onboarding`
- Marks user as KYC complete

**KYCRequired Component:**
```tsx
<KYCRequired />
```
- Informational page
- Explains KYC requirements
- Redirects to onboarding

## Database Schema

```prisma
model User {
  id                 String   @id @default(uuid())
  walletAddress      String   @unique
  fullName           String?
  email              String?
  kycStatus          KycStatus @default(PENDING)
  encryptedApiKey    String?   // AES-256 encrypted
  encryptedSecretKey String?   // AES-256 encrypted
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}

enum KycStatus {
  PENDING   // Not yet submitted KYC
  APPROVED  // KYC verified, can transact
  REJECTED  // KYC rejected, cannot transact
}
```

## Environment Variables

```env
# Encryption secret for API keys (REQUIRED)
ENCRYPTION_SECRET="your-strong-random-secret-here"

# IDRX organization credentials (REQUIRED)
IDRX_API_KEY="your-organization-api-key"
IDRX_API_SECRET="your-organization-api-secret"
```

## Transaction Flow with KYC

```
1. User scans QRIS code
   ↓
2. Check KYC status
   ├─ NOT APPROVED → Redirect to /onboarding
   └─ APPROVED → Continue
       ↓
3. Create payment
   ├─ Verify KYC in API
   ├─ Decrypt user's API keys
   └─ Create transaction record
       ↓
4. User sends IDRX to treasury
   ↓
5. Confirm payment
   ├─ Verify KYC again
   ├─ Use user's API keys for IDRX
   └─ Process disbursement to merchant
       ↓
6. Transaction complete
```

## Security Best Practices

### ✅ DO:
- Always encrypt API keys before storage
- Verify KYC on every transaction endpoint
- Use HTTPS for all API calls
- Rotate encryption keys periodically
- Log KYC verification attempts
- Validate file uploads (type, size)

### ❌ DON'T:
- Store API keys in plaintext
- Allow transactions without KYC
- Expose API keys in client-side code
- Skip KYC verification on any endpoint
- Store unencrypted sensitive data
- Trust client-side KYC validation alone

## Error Handling

### KYC Not Complete
```json
{
  "error": "KYC verification required. Please complete onboarding.",
  "requiresKYC": true
}
```
**Status:** 403 Forbidden

### KYC Rejected
```json
{
  "error": "KYC verification was rejected. Please contact support.",
  "requiresKYC": true
}
```
**Status:** 403 Forbidden

### Missing API Keys
```json
{
  "error": "API keys not found. Please complete onboarding again.",
  "requiresKYC": true
}
```
**Status:** 403 Forbidden

## Testing

### Test KYC Flow
1. Register new user → `kycStatus: PENDING`
2. Try to scan QR → Redirected to onboarding
3. Complete KYC form → API keys stored encrypted
4. Scan QR code → Allowed
5. Create payment → KYC verified, uses user's API keys
6. Confirm payment → Transaction processed with IDRX

### Verify Encryption
```typescript
import { encryptData, decryptData } from '@/lib/encryption';

const original = "test-api-key";
const encrypted = encryptData(original);
const decrypted = decryptData(encrypted);

console.log(encrypted); // "iv:encrypted_hex"
console.log(decrypted === original); // true
```

## Compliance

- **KYC/AML:** Required for all payment processing
- **Data Protection:** Encrypted storage of sensitive data
- **IDRX Integration:** Organization-level API management
- **User Privacy:** Minimal data collection, secure storage
