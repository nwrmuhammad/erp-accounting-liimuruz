import type { InventoryMovementWithRelations } from '@/domain/repositories/inventory.repository';
import type { StockSummary } from '@/domain/repositories/inventory.repository';

export interface InventoryMovementDto {
  id: string;
  branchId: string;
  branchName: string;
  productId: string;
  productName: string;
  productSku: string;
  productUnit: string;
  category: string | null;
  type: string;
  quantity: number;
  unitCost: number | null;
  totalCost: number | null;
  reason: string | null;
  referenceId: string | null;
  createdById: string;
  createdByName: string;
  createdAt: string;
}

export type { StockSummary };

export function toInventoryMovementDto(
  m: InventoryMovementWithRelations,
): InventoryMovementDto {
  return {
    id: m.id,
    branchId: m.branchId,
    branchName: m.branch.name,
    productId: m.productId,
    productName: m.product.name,
    productSku: m.product.sku,
    productUnit: m.product.unit,
    category: m.product.category?.name ?? null,
    type: m.type,
    quantity: m.quantity,
    unitCost: m.unitCost?.toNumber() ?? null,
    totalCost: m.totalCost?.toNumber() ?? null,
    reason: m.reason,
    referenceId: m.referenceId,
    createdById: m.createdById,
    createdByName: `${m.createdBy.firstName} ${m.createdBy.lastName}`,
    createdAt: m.createdAt.toISOString(),
  };
}
