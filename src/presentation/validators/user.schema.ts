import { z } from 'zod';
import { RoleType, UserStatus } from '@prisma/client';

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().max(30).optional(),
  roleType: z.nativeEnum(RoleType),
  branchId: z.string().cuid().nullable().optional(),
});

export const updateUserSchema = z
  .object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    phone: z.string().max(30).nullable().optional(),
    status: z.nativeEnum(UserStatus).optional(),
    roleType: z.nativeEnum(RoleType).optional(),
    branchId: z.string().cuid().nullable().optional(),
    password: z.string().min(8).max(128).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  branchId: z.string().cuid().optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
