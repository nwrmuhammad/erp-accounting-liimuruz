import type { SaleWithRelations } from '@/domain/repositories/sale.repository';

export interface SaleDto {
  id: string;
  saleNumber: string;
  branchId: string;
  branchName: string;
  createdById: string;
  createdByName: string;
  productName: string | null;
  quantity: number | null;
  paymentType: string;
  onlineReceiver: string | null;
  totalAmount: number;
  currency: string;
  saleDate: string;
  status: string;
  puliOlindi: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toSaleDto(s: SaleWithRelations): SaleDto {
  return {
    id: s.id,
    saleNumber: s.saleNumber,
    branchId: s.branchId,
    branchName: s.branch.name,
    createdById: s.createdById,
    createdByName: `${s.createdBy.firstName} ${s.createdBy.lastName}`,
    productName: s.productName,
    quantity: s.quantity,
    paymentType: s.paymentType,
    onlineReceiver: s.onlineReceiver,
    totalAmount: s.totalAmount.toNumber(),
    currency: s.currency,
    saleDate: s.saleDate.toISOString(),
    status: s.status,
    puliOlindi: s.puliOlindi,
    notes: s.notes,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}
