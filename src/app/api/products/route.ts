import type { NextRequest } from 'next/server';
import { route } from '@/server/http/handler';
import { created, ok } from '@/server/http/responses';
import { authenticate } from '@/presentation/middleware/authenticate';
import { productService, auditService } from '@/infrastructure/container';
import {
  createProductSchema,
  listProductsQuerySchema,
} from '@/presentation/validators/product.schema';
import { getClientIp, getUserAgent } from '@/server/http/request-context';

export const runtime = 'nodejs';

export const GET = route(async (req: NextRequest) => {
  const ctx = await authenticate(req);
  const query = listProductsQuerySchema.parse(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  const result = await productService.list(ctx, query);
  return ok(result);
});

export const POST = route(async (req: NextRequest) => {
  const ctx = await authenticate(req);
  const body = createProductSchema.parse(await req.json());
  const product = await productService.create(ctx, body);

  await auditService.record({
    userId: ctx.userId,
    branchId: product.branchId,
    action: 'PRODUCT_CREATED',
    entity: 'Product',
    entityId: product.id,
    metadata: { name: product.name, sku: product.sku },
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });

  return created(product);
});
