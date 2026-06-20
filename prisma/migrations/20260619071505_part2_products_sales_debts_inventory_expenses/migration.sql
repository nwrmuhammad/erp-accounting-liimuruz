-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('CASH_UZS', 'CASH_USD', 'ONLINE');

-- CreateEnum
CREATE TYPE "OnlineReceiver" AS ENUM ('ALI', 'BILOL');

-- CreateEnum
CREATE TYPE "CurrencyType" AS ENUM ('UZS', 'USD');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('INCOMING', 'OUTGOING');

-- CreateEnum
CREATE TYPE "DebtStatus" AS ENUM ('ACTIVE', 'PARTIAL', 'PAID');

-- CreateTable
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "costPrice" DECIMAL(18,2) NOT NULL,
    "sellingPrice" DECIMAL(18,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "branchId" TEXT NOT NULL,
    "categoryId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "saleNumber" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "paymentType" "PaymentType" NOT NULL,
    "onlineReceiver" "OnlineReceiver",
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "currency" "CurrencyType" NOT NULL DEFAULT 'UZS',
    "exchangeRate" DECIMAL(18,4),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_items" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "totalPrice" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debts" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "currency" "CurrencyType" NOT NULL,
    "advancePaid" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "remainingAmount" DECIMAL(18,2) NOT NULL,
    "status" "DebtStatus" NOT NULL DEFAULT 'ACTIVE',
    "dueDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debt_payments" (
    "id" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" "CurrencyType" NOT NULL,
    "paymentType" "PaymentType" NOT NULL,
    "onlineReceiver" "OnlineReceiver",
    "collectedById" TEXT NOT NULL,
    "notes" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debt_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "InventoryMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DECIMAL(18,2),
    "totalCost" DECIMAL(18,2),
    "reason" TEXT,
    "referenceId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" "CurrencyType" NOT NULL,
    "exchangeRate" DECIMAL(18,4),
    "paymentType" "PaymentType" NOT NULL,
    "onlineReceiver" "OnlineReceiver",
    "paidById" TEXT NOT NULL,
    "receiptUrl" TEXT,
    "notes" TEXT,
    "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_categories_branchId_idx" ON "product_categories"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_name_branchId_key" ON "product_categories"("name", "branchId");

-- CreateIndex
CREATE INDEX "products_branchId_idx" ON "products"("branchId");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_branchId_key" ON "products"("sku", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "sales_saleNumber_key" ON "sales"("saleNumber");

-- CreateIndex
CREATE INDEX "sales_branchId_idx" ON "sales"("branchId");

-- CreateIndex
CREATE INDEX "sales_createdById_idx" ON "sales"("createdById");

-- CreateIndex
CREATE INDEX "sales_paymentType_idx" ON "sales"("paymentType");

-- CreateIndex
CREATE INDEX "sales_onlineReceiver_idx" ON "sales"("onlineReceiver");

-- CreateIndex
CREATE INDEX "sales_createdAt_idx" ON "sales"("createdAt");

-- CreateIndex
CREATE INDEX "sale_items_saleId_idx" ON "sale_items"("saleId");

-- CreateIndex
CREATE INDEX "sale_items_productId_idx" ON "sale_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "debts_saleId_key" ON "debts"("saleId");

-- CreateIndex
CREATE INDEX "debts_branchId_idx" ON "debts"("branchId");

-- CreateIndex
CREATE INDEX "debts_status_idx" ON "debts"("status");

-- CreateIndex
CREATE INDEX "debts_createdAt_idx" ON "debts"("createdAt");

-- CreateIndex
CREATE INDEX "debt_payments_debtId_idx" ON "debt_payments"("debtId");

-- CreateIndex
CREATE INDEX "debt_payments_collectedById_idx" ON "debt_payments"("collectedById");

-- CreateIndex
CREATE INDEX "inventory_movements_branchId_idx" ON "inventory_movements"("branchId");

-- CreateIndex
CREATE INDEX "inventory_movements_productId_idx" ON "inventory_movements"("productId");

-- CreateIndex
CREATE INDEX "inventory_movements_type_idx" ON "inventory_movements"("type");

-- CreateIndex
CREATE INDEX "inventory_movements_createdAt_idx" ON "inventory_movements"("createdAt");

-- CreateIndex
CREATE INDEX "expense_categories_branchId_idx" ON "expense_categories"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "expense_categories_name_branchId_key" ON "expense_categories"("name", "branchId");

-- CreateIndex
CREATE INDEX "expenses_branchId_idx" ON "expenses"("branchId");

-- CreateIndex
CREATE INDEX "expenses_categoryId_idx" ON "expenses"("categoryId");

-- CreateIndex
CREATE INDEX "expenses_currency_idx" ON "expenses"("currency");

-- CreateIndex
CREATE INDEX "expenses_expenseDate_idx" ON "expenses"("expenseDate");

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "debts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_collectedById_fkey" FOREIGN KEY ("collectedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
