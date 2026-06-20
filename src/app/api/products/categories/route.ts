import type { NextRequest } from 'next/server';
import { route } from '@/server/http/handler';
import { created, ok } from '@/server/http/responses';
import { authenticate } from '@/presentation/middleware/authenticate';
import { productService, auditService } from '@/infrastructure/container';
import {
  createProductCategorySchema,
  listProductCategoriesQuerySchema,
} from '@/presentation/validators/product.schema';
import { getClientIp, getUserAgent } from '@/server/http/request-context';

export const runtime = 'nodejs';

export const GET = route(async (req: NextRequest) => {
  const ctx = await authenticate(req);
  const query = listProductCategoriesQuerySchema.parse(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  const result = await productService.listCategories(ctx, query);
  return ok(result);
});

export const POST = route(async (req: NextRequest) => {
  const ctx = await authenticate(req);
  const body = createProductCategorySchema.parse(await req.json());
  const cat = await productService.createCategory(ctx, body);

  await auditService.record({
    userId: ctx.userId,
    branchId: cat.branchId,
    action: 'PRODUCT_CATEGORY_CREATED',
    entity: 'ProductCategory',
    entityId: cat.id,
    metadata: { name: cat.name },
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });

  return created(cat);
});
