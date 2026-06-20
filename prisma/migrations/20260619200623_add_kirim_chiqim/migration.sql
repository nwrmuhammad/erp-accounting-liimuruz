-- CreateTable
CREATE TABLE "kirims" (
    "id" TEXT NOT NULL,
    "productName" TEXT,
    "quantity" INTEGER NOT NULL,
    "kirimDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branchId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kirims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chiqims" (
    "id" TEXT NOT NULL,
    "productName" TEXT,
    "recipient" TEXT NOT NULL,
    "responsible" TEXT NOT NULL,
    "chiqimDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branchId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chiqims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kirims_branchId_idx" ON "kirims"("branchId");

-- CreateIndex
CREATE INDEX "kirims_kirimDate_idx" ON "kirims"("kirimDate");

-- CreateIndex
CREATE INDEX "chiqims_branchId_idx" ON "chiqims"("branchId");

-- CreateIndex
CREATE INDEX "chiqims_chiqimDate_idx" ON "chiqims"("chiqimDate");

-- AddForeignKey
ALTER TABLE "kirims" ADD CONSTRAINT "kirims_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kirims" ADD CONSTRAINT "kirims_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chiqims" ADD CONSTRAINT "chiqims_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chiqims" ADD CONSTRAINT "chiqims_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
