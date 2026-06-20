import type { NextRequest } from 'next/server';
import { route } from '@/server/http/handler';
import { ok } from '@/server/http/responses';
import { authenticate } from '@/presentation/middleware/authenticate';
import { inventoryService } from '@/infrastructure/container';

export const runtime = 'nodejs';

export const GET = route(async (req: NextRequest) => {
  const ctx = await authenticate(req);
  const productId = req.nextUrl.searchParams.get('productId') ?? undefined;
  const summary = await inventoryService.getStockSummary(ctx, productId);
  return ok(summary);
});
