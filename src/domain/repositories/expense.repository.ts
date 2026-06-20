import type {
  Prisma,
  CurrencyType,
  PaymentType,
  OnlineReceiver,
} from '@prisma/client';

export type ExpenseWithRelations = Prisma.ExpenseGetPayload<{
  include: {
    branch: true;
    paidBy: { select: { id: true; firstName: true; lastName: true } };
  };
}>;

export interface ExpenseListFilter {
  branchId?: string;
  currency?: CurrencyType;
  paymentType?: PaymentType;
  onlineReceiver?: OnlineReceiver;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  skip: number;
  take: number;
  orderBy?: 'expenseDate' | 'amount' | 'createdAt';
  orderDir?: 'asc' | 'desc';
}

export interface IExpenseRepository {
  findById(id: string): Promise<ExpenseWithRelations | null>;
  list(filter: ExpenseListFilter): Promise<{ items: ExpenseWithRelations[]; total: number }>;
  create(data: Prisma.ExpenseCreateInput): Promise<ExpenseWithRelations>;
  update(id: string, data: Prisma.ExpenseUpdateInput): Promise<ExpenseWithRelations>;
  delete(id: string): Promise<void>;
}
