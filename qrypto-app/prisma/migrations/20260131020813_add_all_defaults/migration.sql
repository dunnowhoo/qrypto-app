-- Add default UUID/CUID generation for all tables

-- BankAccount
ALTER TABLE "BankAccount" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- Merchant
ALTER TABLE "Merchant" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- MerchantMap (already has default from previous migration, but ensure it's set)
ALTER TABLE "MerchantMap" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- QrisPayment (uses cuid, but we'll use uuid for consistency)
ALTER TABLE "QrisPayment" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- Transaction
ALTER TABLE "Transaction" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- TreasuryWallet
ALTER TABLE "TreasuryWallet" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
