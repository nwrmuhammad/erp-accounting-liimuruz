import type { NextRequest } from 'next/server';
import { route } from '@/server/http/handler';
import { ok } from '@/server/http/responses';
import { authenticate } from '@/presentation/middleware/authenticate';
import { inventoryService } from '@/infrastructure/container';

export const runtime = 'nodejs';

export const GET = route(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await authenticate(req);
  const { id } = await params;
  const movement = await inventoryService.getById(ctx, id);
  return ok(movement);
});
