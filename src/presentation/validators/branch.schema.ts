import { z } from 'zod';

export const createBranchSchema = z.object({
  name: z.string().min(1).max(150),
  code: z
    .string()
    .min(2)
    .max(20)
    .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase letters, numbers or dashes'),
  region: z.string().min(1).max(100),
  city: z.string().max(100).optional(),
  address: z.string().max(255).optional(),
  phone: z.string().max(30).optional(),
});

export const updateBranchSchema = z
  .object({
    name: z.string().min(1).max(150).optional(),
    region: z.string().min(1).max(100).optional(),
    city: z.string().max(100).nullable().optional(),
    address: z.string().max(255).nullable().optional(),
    phone: z.string().max(30).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const listBranchesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  region: z.string().max(100).optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
export type ListBranchesQuery = z.infer<typeof listBranchesQuerySchema>;
