import type { NextRequest } from 'next/server';
import { route } from '@/server/http/handler';
import { ok } from '@/server/http/responses';
import { authenticate } from '@/presentation/middleware/authenticate';
import { authService, auditService } from '@/infrastructure/container';
import { clearAuthCookies } from '@/presentation/middleware/cookies';
import { getClientIp, getUserAgent } from '@/server/http/request-context';

export const runtime = 'nodejs';

export const POST = route(async (req: NextRequest) => {
  const ctx = await authenticate(req);
  await authService.logout(ctx.sessionId);

  const res = ok({ loggedOut: true });
  clearAuthCookies(res);

  await auditService.record({
    userId: ctx.userId,
    branchId: ctx.branchId,
    action: 'LOGOUT',
    entity: 'Auth',
    entityId: ctx.userId,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });

  return res;
});
