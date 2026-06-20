import type { NextRequest } from 'next/server';
import { route } from '@/server/http/handler';
import { ok } from '@/server/http/responses';
import { authenticate } from '@/presentation/middleware/authenticate';
import { userService, auditService } from '@/infrastructure/container';
import { updateUserSchema } from '@/presentation/validators/user.schema';
import { getClientIp, getUserAgent } from '@/server/http/request-context';

export const runtime = 'nodejs';

interface Params {
  params: Promise<{ id: string }>;
}

export const GET = route(async (req: NextRequest, { params }: Params) => {
  const ctx = await authenticate(req);
  const { id } = await params;
  const user = await userService.getById(ctx, id);
  return ok(user);
});

export const PATCH = route(async (req: NextRequest, { params }: Params) => {
  const ctx = await authenticate(req);
  const { id } = await params;
  const body = updateUserSchema.parse(await req.json());
  const user = await userService.update(ctx, id, body);

  await auditService.record({
    userId: ctx.userId,
    branchId: user.branch?.id ?? null,
    action: 'USER_UPDATED',
    entity: 'User',
    entityId: id,
    metadata: { fields: Object.keys(body) },
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });

  return ok(user);
});

export const DELETE = route(async (req: NextRequest, { params }: Params) => {
  const ctx = await authenticate(req);
  const { id } = await params;
  await userService.remove(ctx, id);

  await auditService.record({
    userId: ctx.userId,
    branchId: ctx.branchId,
    action: 'USER_DELETED',
    entity: 'User',
    entityId: id,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });

  return ok({ deleted: true });
});
