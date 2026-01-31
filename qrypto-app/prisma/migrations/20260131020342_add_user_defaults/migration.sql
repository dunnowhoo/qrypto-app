-- Add default UUID generation for User.id
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- Add automatic timestamp update for User.updatedAt
-- Note: PostgreSQL doesn't have built-in auto-update for timestamps
-- Prisma will handle this at the application level
-- This migration just ensures the column exists and can be updated
