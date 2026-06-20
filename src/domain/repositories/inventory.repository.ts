import type { Prisma, InventoryMovementType } from '@prisma/client';

export type InventoryMovementWithRelations =
  Prisma.InventoryMovementGetPayload<{
    include: {
      product: { include: { category: true } };
      branch: true;
      createdBy: { select: { id: true; firstName: true; lastName: true } };
    };
  }>;

export interface InventoryListFilter {
  branchId?: string;
  productId?: string;
  type?: InventoryMovementType;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  skip: number;
  take: number;
  orderBy?: 'createdAt' | 'quantity';
  orderDir?: 'asc' | 'desc';
}

export interface StockSummary {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  totalIncoming: number;
  totalOutgoing: number;
  currentStock: number;
}

export interface IInventoryRepository {
  findById(id: string): Promise<InventoryMovementWithRelations | null>;
  list(
    filter: InventoryListFilter,
  ): Promise<{ items: InventoryMovementWithRelations[]; total: number }>;
  create(
    data: Prisma.InventoryMovementCreateInput,
  ): Promise<InventoryMovementWithRelations>;
  getStockSummary(branchId: string, productId?: string): Promise<StockSummary[]>;
}
