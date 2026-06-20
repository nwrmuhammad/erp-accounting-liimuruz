import type { NextRequest } from 'next/server';
import { route } from '@/server/http/handler';
import { noContent, ok } from '@/server/http/responses';
import { authenticate } from '@/presentation/middleware/authenticate';
import { saleService, auditService } from '@/infrastructure/container';
import { updateSaleSchema } from '@/presentation/validators/sale.schema';
import { getClientIp, getUserAgent } from '@/server/http/request-context';

export const runtime = 'nodejs';

export const GET = route(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await authenticate(req);
  const { id } = await params;
  const sale = await saleService.getById(ctx, id);
  return ok(sale);
});

export const PATCH = route(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await authenticate(req);
  const { id } = await params;
  const body = updateSaleSchema.parse(await req.json());
  const sale = await saleService.update(ctx, id, body);

  await auditService.record({
    userId: ctx.userId,
    branchId: sale.branchId,
    action: 'SALE_UPDATED',
    entity: 'Sale',
    entityId: sale.id,
    metadata: { paymentType: sale.paymentType, totalAmount: sale.totalAmount },
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });

  return ok(sale);
});

export const DELETE = route(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await authenticate(req);
  const { id } = await params;
  await saleService.remove(ctx, id);

  await auditService.record({
    userId: ctx.userId,
    action: 'SALE_DELETED',
    entity: 'Sale',
    entityId: id,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });

  return noContent();
});
