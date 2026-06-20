import { z } from 'zod';
import { InventoryMovementType } from '@prisma/client';

export const createInventoryMovementSchema = z.object({
  branchId: z.string().cuid().optional(),
  productId: z.string().cuid(),
  type: z.nativeEnum(InventoryMovementType),
  quantity: z.number().int().positive(),
  unitCost: z.number().nonnegative().optional(),
  reason: z.string().max(500).optional(),
  referenceId: z.string().max(100).optional(),
});

export const listInventoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  branchId: z.string().cuid().optional(),
  productId: z.string().cuid().optional(),
  type: z.nativeEnum(InventoryMovementType).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  orderBy: z.enum(['createdAt', 'quantity']).default('createdAt'),
  orderDir: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateInventoryMovementInput = z.infer<typeof createInventoryMovementSchema>;
export type ListInventoryQuery = z.infer<typeof listInventoryQuerySchema>;
