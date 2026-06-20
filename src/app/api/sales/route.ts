import type { NextRequest } from 'next/server';
import { route } from '@/server/http/handler';
import { created, ok } from '@/server/http/responses';
import { authenticate } from '@/presentation/middleware/authenticate';
import { saleService, auditService } from '@/infrastructure/container';
import {
  createSaleSchema,
  listSalesQuerySchema,
} from '@/presentation/validators/sale.schema';
import { getClientIp, getUserAgent } from '@/server/http/request-context';

export const runtime = 'nodejs';

export const GET = route(async (req: NextRequest) => {
  const ctx = await authenticate(req);
  const query = listSalesQuerySchema.parse(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  const result = await saleService.list(ctx, query);
  return ok(result);
});

export const POST = route(async (req: NextRequest) => {
  const ctx = await authenticate(req);
  const body = createSaleSchema.parse(await req.json());
  const sale = await saleService.create(ctx, body);

  await auditService.record({
    userId: ctx.userId,
    branchId: sale.branchId,
    action: 'SALE_CREATED',
    entity: 'Sale',
    entityId: sale.id,
    metadata: {
      saleNumber: sale.saleNumber,
      paymentType: sale.paymentType,
      totalAmount: sale.totalAmount,
      currency: sale.currency,
    },
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });

  return created(sale);
});
