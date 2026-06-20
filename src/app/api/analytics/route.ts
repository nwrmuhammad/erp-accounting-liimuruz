import type { NextRequest } from 'next/server';
import { route } from '@/server/http/handler';
import { ok } from '@/server/http/responses';
import { authenticate } from '@/presentation/middleware/authenticate';
import { analyticsService } from '@/infrastructure/container';

export const runtime = 'nodejs';

export const GET = route(async (req: NextRequest) => {
  const ctx = await authenticate(req);
  const params = req.nextUrl.searchParams;

  const result = await analyticsService.get(ctx, {
    branchId: params.get('branchId') ?? undefined,
    dateFrom: params.get('dateFrom') ?? undefined,
    dateTo: params.get('dateTo') ?? undefined,
  });

  return ok(result);
});
