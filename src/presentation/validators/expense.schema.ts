import { z } from 'zod';
import { CurrencyType, OnlineReceiver, PaymentType } from '@prisma/client';

export const createExpenseSchema = z
  .object({
    branchId: z.string().cuid().optional(),
    description: z.string().min(1).max(500),
    amount: z.number().positive(),
    currency: z.nativeEnum(CurrencyType),
    exchangeRate: z.number().positive().optional(),
    paymentType: z.nativeEnum(PaymentType),
    onlineReceiver: z.nativeEnum(OnlineReceiver).optional(),
    receiptUrl: z.string().url().optional(),
    notes: z.string().max(1000).optional(),
    expenseDate: z.string().datetime().optional(),
  })
  .refine(
    (d) => d.paymentType !== 'ONLINE' || d.onlineReceiver !== undefined,
    { message: 'onlineReceiver is required for ONLINE payments', path: ['onlineReceiver'] },
  );

export const updateExpenseSchema = z
  .object({
    description: z.string().min(1).max(500).optional(),
    amount: z.number().positive().optional(),
    currency: z.nativeEnum(CurrencyType).optional(),
    exchangeRate: z.number().positive().nullable().optional(),
    paymentType: z.nativeEnum(PaymentType).optional(),
    onlineReceiver: z.nativeEnum(OnlineReceiver).nullable().optional(),
    receiptUrl: z.string().url().nullable().optional(),
    notes: z.string().max(1000).nullable().optional(),
    expenseDate: z.string().datetime().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });

export const listExpensesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  branchId: z.string().cuid().optional(),
  currency: z.nativeEnum(CurrencyType).optional(),
  paymentType: z.nativeEnum(PaymentType).optional(),
  onlineReceiver: z.nativeEnum(OnlineReceiver).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  orderBy: z.enum(['expenseDate', 'amount', 'createdAt']).default('expenseDate'),
  orderDir: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
