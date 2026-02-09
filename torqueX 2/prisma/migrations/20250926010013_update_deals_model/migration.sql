/*
  Warnings:

  - You are about to drop the column `discountPercent` on the `Deal` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `Deal` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Deal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discountValue` to the `Deal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Deal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `validFrom` to the `Deal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Deal" DROP COLUMN "discountPercent",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "discountType" TEXT NOT NULL DEFAULT 'percentage',
ADD COLUMN     "discountValue" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "minPurchase" DOUBLE PRECISION,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "usageLimit" INTEGER,
ADD COLUMN     "validFrom" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "vehicleType" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Deal_code_key" ON "Deal"("code");
