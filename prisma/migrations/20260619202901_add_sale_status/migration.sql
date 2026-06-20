-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('OCHIQ', 'YOPILDI', 'POCHTADA');

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "puliOlindi" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "SaleStatus" NOT NULL DEFAULT 'OCHIQ';

-- CreateIndex
CREATE INDEX "sales_status_idx" ON "sales"("status");

-- CreateIndex
CREATE INDEX "sales_saleDate_idx" ON "sales"("saleDate");
