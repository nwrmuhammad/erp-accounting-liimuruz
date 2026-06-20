import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { route } from '@/server/http/handler';
import { ok, created } from '@/server/http/responses';
import { authenticate } from '@/presentation/middleware/authenticate';
import { authorize } from '@/presentation/guards/rbac';
import { PERMISSIONS } from '@/core/constants/permissions';
import { isGlobalRole } from '@/core/constants/roles';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const include = {
  branch: { select: { id: true, name: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
};

const createSchema = z.object({
  productName: z.string().max(200).optional(),
  quantity: z.number().int().positive(),
  kirimDate: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
  branchId: z.string().cuid().optional(),
});

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  branchId: z.string().cuid().optional(),
});

export const GET = route(async (req: NextRequest) => {
  const ctx = await authenticate(req);
  authorize(ctx, PERMISSIONS.KIRIM_LIST);

  const q = listSchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  const branchId = isGlobalRole(ctx.roleType) ? q.branchId : (ctx.branchId ?? '__none__');

  const where = {
    ...(branchId ? { branchId } : {}),
    ...(q.search ? { productName: { contains: q.search, mode: 'insensitive' as const } } : {}),
    ...(q.dateFrom || q.dateTo ? {
      kirimDate: {
        ...(q.dateFrom ? { gte: new Date(q.dateFrom) } : {}),
        ...(q.dateTo ? { lte: new Date(q.dateTo) } : {}),
      },
    } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.kirim.findMany({ where, include, orderBy: { kirimDate: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
    prisma.kirim.count({ where }),
  ]);

  return ok({ items, total, page: q.page, pageSize: q.pageSize, totalPages: Math.max(1, Math.ceil(total / q.pageSize)) });
});

export const POST = route(async (req: NextRequest) => {
  const ctx = await authenticate(req);
  authorize(ctx, PERMISSIONS.KIRIM_CREATE);

  const body = createSchema.parse(await req.json());
  const branchId = isGlobalRole(ctx.roleType) ? (body.branchId ?? ctx.branchId!) : ctx.branchId!;

  const item = await prisma.kirim.create({
    data: {
      productName: body.productName ?? null,
      quantity: body.quantity,
      kirimDate: body.kirimDate ? new Date(body.kirimDate) : new Date(),
      notes: body.notes ?? null,
      branch: { connect: { id: branchId } },
      createdBy: { connect: { id: ctx.userId } },
    },
    include,
  });

  return created(item);
});
