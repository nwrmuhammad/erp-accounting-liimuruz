/*
  Warnings:

  - You are about to drop the `debt_payments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `debts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "debt_payments" DROP CONSTRAINT "debt_payments_collectedById_fkey";

-- DropForeignKey
ALTER TABLE "debt_payments" DROP CONSTRAINT "debt_payments_debtId_fkey";

-- DropForeignKey
ALTER TABLE "debts" DROP CONSTRAINT "debts_branchId_fkey";

-- DropForeignKey
ALTER TABLE "debts" DROP CONSTRAINT "debts_saleId_fkey";

-- DropTable
DROP TABLE "debt_payments";

-- DropTable
DROP TABLE "debts";

-- DropEnum
DROP TYPE "DebtStatus";
