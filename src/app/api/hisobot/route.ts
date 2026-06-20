import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { route } from '@/server/http/handler';
import { ok } from '@/server/http/responses';
import { authenticate } from '@/presentation/middleware/authenticate';
import { authorize } from '@/presentation/guards/rbac';
import { PERMISSIONS } from '@/core/constants/permissions';
import { isGlobalRole } from '@/core/constants/roles';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const querySchema = z.object({
  branchId: z.string().cuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(100),
});

export const GET = route(async (req: NextRequest) => {
  const ctx = await authenticate(req);
  authorize(ctx, PERMISSIONS.HISOBOT_READ);

  const q = querySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  const branchId = isGlobalRole(ctx.roleType) ? q.branchId : (ctx.branchId ?? '__none__');

  const where = {
    ...(branchId ? { branchId } : {}),
    ...(q.dateFrom || q.dateTo
      ? {
          saleDate: {
            ...(q.dateFrom ? { gte: new Date(q.dateFrom) } : {}),
            ...(q.dateTo ? { lte: new Date(q.dateTo) } : {}),
          },
        }
      : {}),
  };

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { saleDate: 'desc' },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
    prisma.sale.count({ where }),
  ]);

  // Group by date string (YYYY-MM-DD)
  const grouped = new Map<string, typeof sales>();
  for (const s of sales) {
    const day = s.saleDate.toISOString().slice(0, 10);
    if (!grouped.has(day)) grouped.set(day, []);
    grouped.get(day)!.push(s);
  }

  const groups = Array.from(grouped.entries()).map(([date, items]) => ({
    date,
    totalUzs: items.filter(s => s.currency === 'UZS').reduce((sum, s) => sum + s.totalAmount.toNumber(), 0),
    totalUsd: items.filter(s => s.currency === 'USD').reduce((sum, s) => sum + s.totalAmount.toNumber(), 0),
    count: items.length,
    items: items.map(s => ({
      id: s.id,
      productName: s.productName,
      quantity: s.quantity,
      totalAmount: s.totalAmount.toNumber(),
      currency: s.currency,
      paymentType: s.paymentType,
      onlineReceiver: s.onlineReceiver,
      status: s.status,
      puliOlindi: s.puliOlindi,
      notes: s.notes,
      saleDate: s.saleDate.toISOString(),
      branchName: s.branch.name,
      createdByName: `${s.createdBy.firstName} ${s.createdBy.lastName}`,
    })),
  }));

  return ok({ groups, total, page: q.page, pageSize: q.pageSize });
});
