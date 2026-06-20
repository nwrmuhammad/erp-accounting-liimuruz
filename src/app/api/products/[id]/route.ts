import type { NextRequest } from 'next/server';
import { route } from '@/server/http/handler';
import { noContent, ok } from '@/server/http/responses';
import { authenticate } from '@/presentation/middleware/authenticate';
import { productService, auditService } from '@/infrastructure/container';
import { updateProductSchema } from '@/presentation/validators/product.schema';
import { getClientIp, getUserAgent } from '@/server/http/request-context';

export const runtime = 'nodejs';

export const GET = route(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await authenticate(req);
  const { id } = await params;
  const product = await productService.getById(ctx, id);
  return ok(product);
});

export const PATCH = route(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await authenticate(req);
  const { id } = await params;
  const body = updateProductSchema.parse(await req.json());
  const product = await productService.update(ctx, id, body);

  await auditService.record({
    userId: ctx.userId,
    branchId: product.branchId,
    action: 'PRODUCT_UPDATED',
    entity: 'Product',
    entityId: product.id,
    metadata: body,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });

  return ok(product);
});

export const DELETE = route(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await authenticate(req);
  const { id } = await params;
  await productService.remove(ctx, id);

  await auditService.record({
    userId: ctx.userId,
    action: 'PRODUCT_DELETED',
    entity: 'Product',
    entityId: id,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });

  return noContent();
});
