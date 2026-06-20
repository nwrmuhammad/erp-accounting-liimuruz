import type { NextRequest } from 'next/server';
import { route } from '@/server/http/handler';
import { created, ok } from '@/server/http/responses';
import { authenticate } from '@/presentation/middleware/authenticate';
import { inventoryService, auditService } from '@/infrastructure/container';
import {
  createInventoryMovementSchema,
  listInventoryQuerySchema,
} from '@/presentation/validators/inventory.schema';
import { getClientIp, getUserAgent } from '@/server/http/request-context';

export const runtime = 'nodejs';

export const GET = route(async (req: NextRequest) => {
  const ctx = await authenticate(req);
  const query = listInventoryQuerySchema.parse(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  const result = await inventoryService.list(ctx, query);
  return ok(result);
});

export const POST = route(async (req: NextRequest) => {
  const ctx = await authenticate(req);
  const body = createInventoryMovementSchema.parse(await req.json());
  const movement = await inventoryService.create(ctx, body);

  await auditService.record({
    userId: ctx.userId,
    branchId: movement.branchId,
    action: `INVENTORY_${movement.type}`,
    entity: 'InventoryMovement',
    entityId: movement.id,
    metadata: {
      productId: movement.productId,
      productName: movement.productName,
      type: movement.type,
      quantity: movement.quantity,
    },
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });

  return created(movement);
});
