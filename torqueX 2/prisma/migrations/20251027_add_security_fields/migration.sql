/*
 * Migration Script: Add Security Fields
 * 
 * This script adds the new security-related fields to the database schema.
 * Run with: npx prisma migrate dev --name add_security_fields
 */

-- AlterTable User to add security fields
ALTER TABLE "User" ADD COLUMN "phone" TEXT,
ADD COLUMN "address" TEXT,
ADD COLUMN "passwordHash" TEXT,
ADD COLUMN "passwordSalt" TEXT;

-- AlterTable Deal to add code hash and usage tracking
ALTER TABLE "Deal" ADD COLUMN "codeHash" TEXT NOT NULL UNIQUE,
ADD COLUMN "currentUsage" INTEGER NOT NULL DEFAULT 0;

-- AlterTable Booking to add payment security fields
ALTER TABLE "Booking" ADD COLUMN "paymentIntentId" TEXT,
ADD COLUMN "paymentMethod" TEXT,
ADD COLUMN "promoCode" TEXT;

-- Create index on Deal codeHash for faster lookups
CREATE UNIQUE INDEX "Deal_codeHash_key" ON "Deal"("codeHash");

-- Create index on Booking paymentIntentId for tracking
CREATE INDEX "Booking_paymentIntentId_idx" ON "Booking"("paymentIntentId");
