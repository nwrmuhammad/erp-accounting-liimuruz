import type { ExpenseWithRelations } from '@/domain/repositories/expense.repository';

export interface ExpenseDto {
  id: string;
  branchId: string;
  branchName: string;
  description: string;
  amount: number;
  currency: string;
  exchangeRate: number | null;
  paymentType: string;
  onlineReceiver: string | null;
  paidById: string;
  paidByName: string;
  receiptUrl: string | null;
  notes: string | null;
  expenseDate: string;
  createdAt: string;
  updatedAt: string;
}

export function toExpenseDto(e: ExpenseWithRelations): ExpenseDto {
  return {
    id: e.id,
    branchId: e.branchId,
    branchName: e.branch.name,
    description: e.description,
    amount: e.amount.toNumber(),
    currency: e.currency,
    exchangeRate: e.exchangeRate?.toNumber() ?? null,
    paymentType: e.paymentType,
    onlineReceiver: e.onlineReceiver,
    paidById: e.paidById,
    paidByName: `${e.paidBy.firstName} ${e.paidBy.lastName}`,
    receiptUrl: e.receiptUrl,
    notes: e.notes,
    expenseDate: e.expenseDate.toISOString(),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}
