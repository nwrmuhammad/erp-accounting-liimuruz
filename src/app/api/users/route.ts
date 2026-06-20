import type { NextRequest } from 'next/server';
import { route } from '@/server/http/handler';
import { created, ok } from '@/server/http/responses';
import { authenticate } from '@/presentation/middleware/authenticate';
import { userService, auditService } from '@/infrastructure/container';
import {
  createUserSchema,
  listUsersQuerySchema,
} from '@/presentation/validators/user.schema';
import { getClientIp, getUserAgent } from '@/server/http/request-context';

export const runtime = 'nodejs';

export const GET = route(async (req: NextRequest) => {
  const ctx = await authenticate(req);
  const query = listUsersQuerySchema.parse(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  const result = await userService.list(ctx, query);
  return ok(result);
});

export const POST = route(async (req: NextRequest) => {
  const ctx = await authenticate(req);
  const body = createUserSchema.parse(await req.json());
  const user = await userService.create(ctx, body);

  await auditService.record({
    userId: ctx.userId,
    branchId: user.branch?.id ?? null,
    action: 'USER_CREATED',
    entity: 'User',
    entityId: user.id,
    metadata: { roleType: user.roleType },
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });

  return created(user);
});
