import type { NextRequest } from 'next/server';
import { route } from '@/server/http/handler';
import { ok } from '@/server/http/responses';
import { loginSchema } from '@/presentation/validators/auth.schema';
import { authService, auditService } from '@/infrastructure/container';
import { setAuthCookies } from '@/presentation/middleware/cookies';
import { getClientIp, getUserAgent } from '@/server/http/request-context';

export const runtime = 'nodejs';

export const POST = route(async (req: NextRequest) => {
  const body = loginSchema.parse(await req.json());
  const meta = { ipAddress: getClientIp(req), userAgent: getUserAgent(req) };

  const result = await authService.login(body.email, body.password, meta);

  const res = ok({ accessToken: result.accessToken, user: result.user });
  setAuthCookies(res, result.accessToken, result.refreshToken);

  await auditService.record({
    userId: result.user.id,
    branchId: result.user.branch?.id ?? null,
    action: 'LOGIN',
    entity: 'Auth',
    entityId: result.user.id,
    ...meta,
  });

  return res;
});
