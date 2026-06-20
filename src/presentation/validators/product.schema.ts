import { z } from 'zod';

export const createProductCategorySchema = z.object({
  name: z.string().min(1).max(100),
  branchId: z.string().cuid().optional(),
});

export const updateProductCategorySchema = z
  .object({ name: z.string().min(1).max(100).optional() })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });

export const listProductCategoriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  branchId: z.string().cuid().optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  unit: z.string().min(1).max(20).default('pcs'),
  costPrice: z.coerce.number().nonnegative(),
  sellingPrice: z.coerce.number().nonnegative(),
  stock: z.coerce.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
  categoryId: z.string().cuid().nullable().optional(),
  branchId: z.string().cuid().optional(),
});

export const updateProductSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    sku: z.string().min(1).max(100).optional(),
    description: z.string().max(1000).nullable().optional(),
    unit: z.string().min(1).max(20).optional(),
    costPrice: z.coerce.number().nonnegative().optional(),
    sellingPrice: z.coerce.number().nonnegative().optional(),
    isActive: z.boolean().optional(),
    categoryId: z.string().cuid().nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  branchId: z.string().cuid().optional(),
  categoryId: z.string().cuid().optional(),
  isActive: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  orderBy: z.enum(['name', 'stock', 'createdAt']).default('createdAt'),
  orderDir: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateProductCategoryInput = z.infer<typeof createProductCategorySchema>;
export type UpdateProductCategoryInput = z.infer<typeof updateProductCategorySchema>;
export type ListProductCategoriesQuery = z.infer<typeof listProductCategoriesQuerySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
