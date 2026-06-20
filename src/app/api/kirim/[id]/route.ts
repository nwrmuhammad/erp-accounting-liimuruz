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
  quantity: z.number().int().positive().optional(),
  kirimDate: z.string().datetime().optional(),
  notes: z.string().max(1000).optional().nullable(),
});

export const PATCH = route(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await authenticate(req);
  authorize(ctx, PERMISSIONS.KIRIM_UPDATE);

  const { id } = await params;
  const existing = await prisma.kirim.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Kirim not found');

  const body = updateSchema.parse(await req.json());
  const item = await prisma.kirim.update({
    where: { id },
    data: {
      ...(body.productName !== undefined ? { productName: body.productName } : {}),
      ...(body.quantity !== undefined ? { quantity: body.quantity } : {}),
      ...(body.kirimDate !== undefined ? { kirimDate: new Date(body.kirimDate) } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    },
    include,
  });

  return ok(item);
});

export const DELETE = route(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await authenticate(req);
  authorize(ctx, PERMISSIONS.KIRIM_DELETE);

  const { id } = await params;
  const existing = await prisma.kirim.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Kirim not found');

  await prisma.kirim.delete({ where: { id } });
  return noContent();
});
