# Testing Guide untuk Bank Transfer Feature

## Prerequisites

### 1. Setup Environment Variables
Buat file `.env.local` dari `.env.example`:

```bash
cp .env.example .env.local
```

Update dengan nilai yang sebenarnya:

```bash
# Database (Anda sudah punya ini)
DATABASE_URL="postgresql://..."

# IDRX API - Dapatkan dari tim IDRX
IDRX_BASE_URL="https://idrx.co"
IDRX_API_KEY="your_actual_idrx_api_key"
IDRX_API_SECRET="your_actual_idrx_api_secret"

# IDRX Contract - Dapatkan dari tim IDRX
NEXT_PUBLIC_IDRX_CONTRACT_ADDRESS="0x..." # Real IDRX contract address on Base

# Base Network (sudah benar)
NEXT_PUBLIC_BASE_RPC_URL="https://mainnet.base.org"
NEXT_PUBLIC_CHAIN_ID="8453"

# Encryption (generate random string)
ENCRYPTION_SECRET="$(openssl rand -hex 32)"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Database
```bash
npx prisma generate
npx prisma db push
```

---

## Testing Checklist

### ✅ Phase 1: Basic Setup (5 menit)

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Check No TypeScript Errors**
   - Open VS Code
   - Lihat Problems panel (Cmd/Ctrl + Shift + M)
   - Pastikan tidak ada error merah di transfer page

3. **Test Build**
   ```bash
   npm run build
   ```
   Jika ada error, fix dulu sebelum lanjut testing.

---

### ✅ Phase 2: Authentication Flow (10 menit)

1. **Test User Registration**
   - Buka http://localhost:3000
   - Connect wallet (MetaMask/Coinbase Wallet)
   - Klik Register
   - Isi form dan submit
   - **Expected:** User berhasil dibuat di database

2. **Test KYC Onboarding**
   - Login dengan wallet
   - Klik "Complete KYC Now"
   - Isi semua field:
     - Full Name: "John Doe"
     - Email: "john@example.com"
     - Phone: "+6281234567890"
     - ID Number (KTP): "1234567890123456"
     - Upload ID photo (any image)
     - Input IDRX API Key & Secret
   - Submit
   - **Expected:** KYC status = APPROVED, redirected to home page

3. **Verify Database**
   ```sql
   SELECT walletAddress, fullName, kycStatus, encryptedApiKey 
   FROM "User" 
   WHERE walletAddress = '0x...';
   ```
   **Expected:** Data tersimpan, encryptedApiKey tidak null

---

### ✅ Phase 3: Bank Transfer UI (15 menit)

1. **Test Transfer Page Access**
   - Login
   - Klik tombol "Transfer" di home page
   - **Expected:** Redirected to /transfer

2. **Test Bank List Loading**
   - Observe loading spinner
   - **Expected:** 
     - Loading muncul
     - Setelah selesai, bank dropdown terisi
     - Jika error: Periksa console untuk API error

3. **Test Form Validation**
   
   **Test A: Empty Fields**
   - Jangan isi apapun
   - Klik "Submit Transfer Request"
   - **Expected:** Error "Incomplete form"

   **Test B: Amount Too Small**
   - Pilih bank: BCA
   - Account: 1234567890
   - Name: JOHN DOE
   - Amount: 10000
   - Submit
   - **Expected:** Error "Minimum transfer amount is Rp 20,000"

   **Test C: Amount Too Large**
   - Amount: 999999999999
   - Submit
   - **Expected:** Error "Amount exceeds limit"

   **Test D: Valid Form**
   - Amount: 50000
   - Submit
   - **Expected:** Loading modal muncul

---

### ✅ Phase 4: Blockchain Integration (20 menit)

**PENTING:** Untuk test ini, Anda perlu:
- Wallet terkoneksi ke Base Mainnet
- Memiliki ETH di Base untuk gas fees (~$0.01)
- Memiliki IDRX tokens di wallet

1. **Test Balance Display**
   - Buka /transfer
   - **Expected:** Terlihat "Your IDRX Balance: X IDRX"

2. **Test Insufficient Balance**
   - Isi amount lebih besar dari balance
   - Submit
   - **Expected:** Error "Insufficient balance"

3. **Test Burn Transaction**
   
   **Setup:**
   - Pastikan Anda punya minimal 50,000 IDRX
   - Pastikan Anda punya ETH untuk gas

   **Steps:**
   - Pilih bank: BCA
   - Account: 1234567890  
   - Name: JOHN DOE
   - Amount: 50000
   - Submit

   **Expected Behavior:**
   - Loading stage 1: "Preparing Transaction" (2 detik)
   - Loading stage 2: "Burning IDRX Tokens" 
   - MetaMask popup muncul untuk confirm transaction
   - Setelah confirm: Wait for blockchain confirmation (~5 detik)
   - Loading stage 3: "Submitting Request"
   - Success screen muncul
   - Redirect ke /history

   **Jika Error:**
   - "Transaction cancelled" → Anda reject di MetaMask (normal)
   - "Insufficient gas" → Tambah ETH ke wallet
   - "Insufficient IDRX balance" → Tambah IDRX ke wallet
   - "Contract address not configured" → Set NEXT_PUBLIC_IDRX_CONTRACT_ADDRESS

4. **Verify Transaction on Blockchain**
   ```bash
   # Buka BaseScan
   https://basescan.org/tx/[txHash_dari_console]
   ```
   **Expected:** Transaction visible, status: Success

---

### ✅ Phase 5: IDRX API Integration (15 menit)

1. **Test Bank Methods API**
   ```bash
   curl -X GET "http://localhost:3000/api/transaction/method?walletAddress=0xYourAddress"
   ```
   **Expected Response:**
   ```json
   {
     "data": [
       {
         "bankCode": "014",
         "bankName": "BCA",
         "maxAmountTransfer": "1000000000"
       }
     ]
   }
   ```

2. **Test Redeem Request API**
   ```bash
   curl -X POST "http://localhost:3000/api/transaction/redeem-request" \
     -H "Content-Type: application/json" \
     -d '{
       "txHash": "0xabc123...",
       "networkChainId": "8453",
       "amountTransfer": "50000",
       "bankAccount": "1234567890",
       "bankCode": "014",
       "bankName": "BCA",
       "bankAccountName": "JOHN DOE",
       "walletAddress": "0xYourAddress"
     }'
   ```
   **Expected Response (Success):**
   ```json
   {
     "transactionId": "12345",
     "custRefNumber": "REF-001",
     "disburseId": "DISB-001",
     "burnStatus": "REQUESTED"
   }
   ```

3. **Test Transaction History API**
   ```bash
   curl -X GET "http://localhost:3000/api/transaction/user-transaction-history?walletAddress=0xYourAddress&transactionType=BURN&page=1&take=10"
   ```
   **Expected Response:**
   ```json
   {
     "metadata": {
       "page": 1,
       "perPage": 10,
       "pageCount": 1,
       "totalCount": 1
     },
     "records": [
       {
         "id": 1,
         "amount": "50000",
         "burnStatus": "REQUESTED",
         "bankName": "BCA",
         "createdAt": "2026-01-30T..."
       }
     ]
   }
   ```

---

### ✅ Phase 6: History Page (10 menit)

1. **Test History Access**
   - Login
   - Klik "History" di bottom navbar
   - **Expected:** Redirected to /history

2. **Test Transaction Type Filters**
   - Klik "Transfers to Bank" → Shows BURN transactions
   - Klik "Top Up" → Shows MINT transactions
   - **Expected:** Data filtered correctly

3. **Test Pagination**
   - If more than 10 transactions
   - **Expected:** Pagination buttons appear
   - Click Next/Previous → Data changes

4. **Test User Isolation**
   - Login dengan wallet A → See transactions
   - Logout, login dengan wallet B → See different transactions
   - **Expected:** Each user only sees their own transactions

---

### ✅ Phase 7: Error Handling (15 menit)

1. **Test KYC Not Completed**
   - Register new user (jangan complete KYC)
   - Try to access /transfer
   - **Expected:** Redirected to /onboarding

2. **Test Invalid API Keys**
   - Temporarily set wrong IDRX_API_KEY in .env.local
   - Restart server
   - Try to submit transfer
   - **Expected:** Error "Authentication failed"

3. **Test Network Error**
   - Disconnect internet
   - Try to submit transfer
   - **Expected:** Error "Network error"

4. **Test User Rejects Wallet Transaction**
   - Start transfer
   - When MetaMask popup appears, click "Reject"
   - **Expected:** Error "Transaction cancelled"

---

## Common Issues & Solutions

### Issue: "IDRX contract address not configured"
**Solution:**
```bash
# Add to .env.local
NEXT_PUBLIC_IDRX_CONTRACT_ADDRESS="0xActualContractAddress"
```
Contact IDRX team untuk contract address yang benar.

### Issue: "Insufficient gas"
**Solution:**
- Add ETH to your wallet on Base network
- Bridge ETH from Ethereum mainnet: https://bridge.base.org

### Issue: "Invalid API credentials"
**Solution:**
1. Verify IDRX_API_KEY & IDRX_API_SECRET di .env.local
2. Pastikan user sudah input API keys saat onboarding
3. Check database: `SELECT encryptedApiKey FROM "User" WHERE ...`

### Issue: Bank list tidak muncul
**Solution:**
1. Check console untuk error
2. Verify API endpoint: `curl http://localhost:3000/api/transaction/method?walletAddress=...`
3. Check IDRX API credentials

### Issue: TypeScript errors
**Solution:**
```bash
# Regenerate Prisma client
npx prisma generate

# Restart TypeScript server
# In VS Code: Cmd+Shift+P → "Restart TypeScript Server"
```

---

## Success Criteria

✅ User bisa register & complete KYC
✅ Transfer page menampilkan bank list
✅ Form validation bekerja dengan benar
✅ Burn transaction berhasil di blockchain
✅ IDRX API menerima transfer request
✅ History page menampilkan transaksi user
✅ Error handling menampilkan pesan yang jelas
✅ Loading states informatif dan tidak crash

---

## Next Steps Setelah Testing

1. **Production Deployment:**
   - Deploy ke Vercel/Railway
   - Update environment variables
   - Test di production environment

2. **Monitoring:**
   - Setup Sentry untuk error tracking
   - Add analytics (Google Analytics/Mixpanel)
   - Monitor IDRX API usage

3. **Improvements:**
   - Add transaction receipt/invoice download
   - Email notifications untuk status transfer
   - Transaction limits per day
   - Multi-signature untuk large transfers

4. **Security Audit:**
   - Review encryption implementation
   - Penetration testing
   - API rate limiting
   - CSRF protection
