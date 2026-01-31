-- Migration to sync database schema with current Prisma schema
-- This migration is safe to run on existing data

-- Add walletAddress column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'User' AND column_name = 'walletAddress'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "walletAddress" TEXT;
    -- Copy data from address to walletAddress if address exists
    UPDATE "User" SET "walletAddress" = "address" WHERE "address" IS NOT NULL;
    -- Make walletAddress unique
    CREATE UNIQUE INDEX IF NOT EXISTS "User_walletAddress_key" ON "User"("walletAddress");
  END IF;
END $$;

-- Add other missing columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'User' AND column_name = 'idNumber'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "idNumber" TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS "User_idNumber_key" ON "User"("idNumber");
  END IF;
END $$;

-- Add kycStatus enum and column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'KycStatus') THEN
    CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'User' AND column_name = 'kycStatus'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "kycStatus" "KycStatus" DEFAULT 'PENDING';
  END IF;
END $$;

-- Add encrypted keys columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'User' AND column_name = 'encryptedApiKey'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "encryptedApiKey" TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'User' AND column_name = 'encryptedSecretKey'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "encryptedSecretKey" TEXT;
  END IF;
END $$;
