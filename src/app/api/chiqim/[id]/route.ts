import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { route } from '@/server/http/handler';
import { ok, noContent } from '@/server/http/responses';
import { authenticate } from '@/presentation/middleware/authenticate';
import { authorize } from '@/presentation/guards/rbac';
import { PERMISSIONS } from '@/core/constants/permissions';
import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/core/errors/app-error';

export const runtime = 'nodejs';

const include = {
  branch: { select: { id: true, name: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
};

const updateSchema = z.object({
  productName: z.string().max(200).optional().nullable(),
  recipient: z.string().min(1).max(200).optional(),
  responsible: z.string().min(1).max(200).optional(),
  chiqimDate: z.string().datetime().optional(),
  notes: z.string().max(1000).optional().nullable(),
});

export const PATCH = route(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await authenticate(req);
  authorize(ctx, PERMISSIONS.CHIQIM_UPDATE);

  const { id } = await params;
  const existing = await prisma.chiqim.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Chiqim not found');

  const body = updateSchema.parse(await req.json());
  const item = await prisma.chiqim.update({
    where: { id },
    data: {
      ...(body.productName !== undefined ? { productName: body.productName } : {}),
      ...(body.recipient !== undefined ? { recipient: body.recipient } : {}),
      ...(body.responsible !== undefined ? { responsible: body.responsible } : {}),
      ...(body.chiqimDate !== undefined ? { chiqimDate: new Date(body.chiqimDate) } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    },
    include,
  });

  return ok(item);
});

export const DELETE = route(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await authenticate(req);
  authorize(ctx, PERMISSIONS.CHIQIM_DELETE);

  const { id } = await params;
  const existing = await prisma.chiqim.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Chiqim not found');

  await prisma.chiqim.delete({ where: { id } });
  return noContent();
});
