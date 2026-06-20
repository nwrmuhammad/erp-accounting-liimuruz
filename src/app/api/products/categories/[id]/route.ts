import type { NextRequest } from 'next/server';
import { route } from '@/server/http/handler';
import { noContent, ok } from '@/server/http/responses';
import { authenticate } from '@/presentation/middleware/authenticate';
import { productService, auditService } from '@/infrastructure/container';
import { updateProductCategorySchema } from '@/presentation/validators/product.schema';
import { getClientIp, getUserAgent } from '@/server/http/request-context';

export const runtime = 'nodejs';

export const GET = route(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await authenticate(req);
  const { id } = await params;
  const cat = await productService.getCategoryById(ctx, id);
  return ok(cat);
});

export const PATCH = route(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await authenticate(req);
  const { id } = await params;
  const body = updateProductCategorySchema.parse(await req.json());
  const cat = await productService.updateCategory(ctx, id, body);

  await auditService.record({
    userId: ctx.userId,
    branchId: cat.branchId,
    action: 'PRODUCT_CATEGORY_UPDATED',
    entity: 'ProductCategory',
    entityId: cat.id,
    metadata: body,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });

  return ok(cat);
});

export const DELETE = route(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await authenticate(req);
  const { id } = await params;
  await productService.deleteCategory(ctx, id);

  await auditService.record({
    userId: ctx.userId,
    action: 'PRODUCT_CATEGORY_DELETED',
    entity: 'ProductCategory',
    entityId: id,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });

  return noContent();
});
