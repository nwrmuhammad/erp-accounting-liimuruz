/*
  Warnings:

  - You are about to drop the column `customerName` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `customerPhone` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `exchangeRate` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the `sale_items` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "sale_items" DROP CONSTRAINT "sale_items_productId_fkey";

-- DropForeignKey
ALTER TABLE "sale_items" DROP CONSTRAINT "sale_items_saleId_fkey";

-- DropIndex
DROP INDEX "sales_onlineReceiver_idx";

-- AlterTable
ALTER TABLE "sales" DROP COLUMN "customerName",
DROP COLUMN "customerPhone",
DROP COLUMN "exchangeRate",
ADD COLUMN     "productName" TEXT,
ADD COLUMN     "quantity" INTEGER,
ADD COLUMN     "saleDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "sale_items";
