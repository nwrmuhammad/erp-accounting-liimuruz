import type { Prisma, PaymentType, OnlineReceiver, CurrencyType } from '@prisma/client';

export type SaleWithRelations = Prisma.SaleGetPayload<{
  include: {
    branch: true;
    createdBy: { select: { id: true; firstName: true; lastName: true } };
  };
}>;

export interface SaleListFilter {
  branchId?: string;
  createdById?: string;
  paymentType?: PaymentType;
  onlineReceiver?: OnlineReceiver;
  currency?: CurrencyType;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  skip: number;
  take: number;
  orderBy?: 'createdAt' | 'totalAmount' | 'saleDate';
  orderDir?: 'asc' | 'desc';
  mode?: 'active' | 'all';
}

export interface ISaleRepository {
  findById(id: string): Promise<SaleWithRelations | null>;
  findBySaleNumber(saleNumber: string): Promise<SaleWithRelations | null>;
  list(filter: SaleListFilter): Promise<{ items: SaleWithRelations[]; total: number }>;
  create(data: Prisma.SaleCreateInput): Promise<SaleWithRelations>;
  update(id: string, data: Prisma.SaleUpdateInput): Promise<SaleWithRelations>;
  delete(id: string): Promise<void>;
  getNextSaleNumber(branchCode: string): Promise<string>;
}
