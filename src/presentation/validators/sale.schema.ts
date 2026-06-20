import { z } from 'zod';
import { PaymentType, OnlineReceiver, CurrencyType, SaleStatus } from '@prisma/client';

export const createSaleSchema = z
  .object({
    branchId: z.string().cuid().optional(),
    productName: z.string().max(200).optional(),
    quantity: z.number().int().positive().optional(),
    totalAmount: z.number().positive(),
    currency: z.nativeEnum(CurrencyType).default('UZS'),
    paymentType: z.nativeEnum(PaymentType),
    onlineReceiver: z.nativeEnum(OnlineReceiver).optional(),
    saleDate: z.string().datetime().optional(),
    status: z.nativeEnum(SaleStatus).optional(),
    notes: z.string().max(1000).optional(),
  })
  .refine(
    (d) => d.paymentType !== 'ONLINE' || d.onlineReceiver !== undefined,
    { message: 'onlineReceiver is required for ONLINE payments', path: ['onlineReceiver'] },
  );

export const listSalesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  branchId: z.string().cuid().optional(),
  paymentType: z.nativeEnum(PaymentType).optional(),
  onlineReceiver: z.nativeEnum(OnlineReceiver).optional(),
  currency: z.nativeEnum(CurrencyType).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  orderBy: z.enum(['createdAt', 'totalAmount', 'saleDate']).default('saleDate'),
  orderDir: z.enum(['asc', 'desc']).default('desc'),
  mode: z.enum(['active', 'all']).default('active'),
});

export const updateSaleSchema = z
  .object({
    productName: z.string().max(200).optional(),
    quantity: z.number().int().positive().optional().nullable(),
    totalAmount: z.number().positive().optional(),
    currency: z.nativeEnum(CurrencyType).optional(),
    paymentType: z.nativeEnum(PaymentType).optional(),
    onlineReceiver: z.nativeEnum(OnlineReceiver).optional().nullable(),
    saleDate: z.string().datetime().optional(),
    status: z.nativeEnum(SaleStatus).optional(),
    puliOlindi: z.boolean().optional(),
    notes: z.string().max(1000).optional().nullable(),
  })
  .refine(
    (d) => d.paymentType !== 'ONLINE' || d.onlineReceiver !== undefined,
    { message: 'onlineReceiver is required for ONLINE payments', path: ['onlineReceiver'] },
  );

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;
export type ListSalesQuery = z.infer<typeof listSalesQuerySchema>;
