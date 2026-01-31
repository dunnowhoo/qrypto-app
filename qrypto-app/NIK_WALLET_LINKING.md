# NIK-Based Wallet Linking Feature

## Problem

Previously, when a user tried to use multiple wallets with the same identity (NIK), they would encounter errors:

1. **"This email is already registered with another wallet address"** - When trying to use the same email
2. **"You have already submitted KYC"** - When trying to re-do KYC with a different wallet

This was frustrating because:
- ❌ Same person couldn't use multiple wallets
- ❌ Had to create multiple IDRX accounts (not allowed)
- ❌ Confusing user experience

## Solution

**NIK-Based Wallet Linking** - The system now recognizes that multiple wallets can belong to the same person (identified by NIK).

## How It Works

### Scenario 1: First Wallet (Initial KYC)

```
User logs in with Wallet A (0x7dce...)
├─ Submits KYC with:
│  ├─ Email: fps0703@gmail.com
│  ├─ NIK: 3214120712030003
│  └─ Full Name: Fauzan Putra Sanjaya
└─ KYC Status: APPROVED ✅
```

### Scenario 2: Second Wallet (Auto-Link)

```
User logs in with Wallet B (0x1f49...)
├─ Submits KYC with:
│  ├─ Email: fauzanputra0703@gmail.com (different email)
│  ├─ NIK: 3214120712030003 (SAME NIK!)
│  └─ Full Name: Fauzan Putra Sanjaya
│
├─ System detects: NIK already approved ✅
│
└─ Auto-links Wallet B to existing KYC:
   ├─ Copies all KYC data from Wallet A
   ├─ Copies IDRX API keys
   ├─ Sets status: APPROVED immediately
   └─ No need to re-do KYC! 🎉
```

## Benefits

✅ **Same person, multiple wallets** - Use as many wallets as you want  
✅ **No duplicate KYC** - KYC once, use everywhere  
✅ **Instant approval** - New wallets get approved automatically  
✅ **Shared IDRX account** - All wallets use the same IDRX API keys  
✅ **Better UX** - Seamless experience across wallets  

## Technical Implementation

### Database Check Flow

```typescript
// 1. Check if NIK is already approved
const existingUserWithNIK = await prisma.user.findFirst({
  where: { 
    idNumber: idNumber,
    kycStatus: "APPROVED"
  }
});

// 2. If found, link new wallet to existing user
if (existingUserWithNIK) {
  const user = await prisma.user.upsert({
    where: { walletAddress: newWallet },
    update: {
      // Copy ALL KYC data from approved user
      address: existingUserWithNIK.address,
      fullName: existingUserWithNIK.fullName,
      email: existingUserWithNIK.email,
      idNumber: existingUserWithNIK.idNumber,
      kycStatus: "APPROVED",
      encryptedApiKey: existingUserWithNIK.encryptedApiKey,
      encryptedSecretKey: existingUserWithNIK.encryptedSecretKey,
    },
    create: { /* same data */ }
  });
  
  return { success: true, linkedFromNIK: true };
}
```

### Security Checks

1. **NIK must be APPROVED** - Only links to already-approved KYC
2. **Wallet conflict check** - Prevents linking wallet that's already used by different person
3. **One-way link** - Can't "steal" someone else's KYC by using their NIK

## Example Use Cases

### Use Case 1: Multiple Devices

```
User has:
- Trust Wallet on Phone A (Wallet 1)
- MetaMask on Phone B (Wallet 2)
- Phantom on Laptop (Wallet 3)

All 3 wallets → Same NIK → Same KYC → All APPROVED ✅
```

### Use Case 2: Wallet Migration

```
User wants to:
- Stop using old wallet (security concern)
- Start using new wallet

Old wallet: Already KYC approved
New wallet: Auto-approved via NIK link ✅
```

### Use Case 3: Testing

```
Developer wants to:
- Test with multiple wallets
- Same identity (NIK)

Wallet 1: KYC approved
Wallet 2, 3, 4, 5: Auto-approved ✅
```

## API Response

### Success Response (Linked)

```json
{
  "success": true,
  "message": "Wallet linked to existing KYC profile. No need to re-do KYC!",
  "data": {
    "userId": "faa7960a-6d85-4fc5-b6f9-ff970d617a11",
    "fullname": "Fauzan Putra Sanjaya",
    "kycStatus": "APPROVED",
    "linkedFromNIK": true,
    "createdAt": "2026-01-31T07:24:31.941Z"
  }
}
```

### Error Response (Wallet Conflict)

```json
{
  "error": "This wallet is already registered with a different identity (NIK)",
  "code": "WALLET_ALREADY_USED",
  "details": "This wallet address is already linked to another person's KYC. Please use a different wallet."
}
```

## Database Schema

### User Table

```prisma
model User {
  id                 String   @id @default(uuid())
  walletAddress      String   @unique          // Different per wallet
  idNumber           String?  @unique          // SAME for all wallets of same person
  email              String?                   // Copied from first approved KYC
  fullName           String?                   // Copied from first approved KYC
  kycStatus          KycStatus @default(PENDING)
  encryptedApiKey    String?                   // Copied from first approved KYC
  encryptedSecretKey String?                   // Copied from first approved KYC
  // ... other fields
}
```

## Testing

### Test Case 1: Link New Wallet

```bash
# 1. First wallet - do KYC
POST /api/auth/onboarding
{
  "walletAddress": "0x7dce...",
  "email": "fps0703@gmail.com",
  "idNumber": "3214120712030003",
  "fullname": "Fauzan Putra Sanjaya",
  "address": "Perum Kota Permata"
}
# Response: KYC APPROVED ✅

# 2. Second wallet - same NIK
POST /api/auth/onboarding
{
  "walletAddress": "0x1f49...",
  "email": "fauzanputra0703@gmail.com",  // Different email OK!
  "idNumber": "3214120712030003",        // SAME NIK
  "fullname": "Fauzan Putra Sanjaya",
  "address": "Perum Kota Permata"
}
# Response: Auto-approved via NIK link! ✅
```

### Test Case 2: Wallet Conflict

```bash
# Wallet already linked to Person A (NIK: 1111)
# Try to link to Person B (NIK: 2222)
POST /api/auth/onboarding
{
  "walletAddress": "0x7dce...",  // Already used by Person A
  "idNumber": "2222"              // Different NIK
}
# Response: ERROR - Wallet already used ❌
```

## Monitoring

Check linked wallets in Prisma Studio:

```sql
-- Find all wallets for same person
SELECT walletAddress, email, kycStatus, createdAt
FROM "User"
WHERE idNumber = '3214120712030003'
ORDER BY createdAt;
```

## Future Enhancements

Potential improvements:

1. **Wallet Management Page** - Show all linked wallets
2. **Primary Wallet** - Set one wallet as primary
3. **Wallet Unlinking** - Remove wallet from account
4. **Wallet Limit** - Max N wallets per person
5. **Audit Log** - Track when wallets are linked

## Status

✅ **Implemented** - NIK-based wallet linking is now live  
✅ **Tested** - Works with multiple wallets  
✅ **Deployed** - Available in production  
