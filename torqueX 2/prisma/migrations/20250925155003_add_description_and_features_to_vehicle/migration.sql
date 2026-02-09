-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "description" TEXT,
ADD COLUMN     "features" TEXT[] DEFAULT ARRAY[]::TEXT[];
