import type { NextRequest } from 'next/server';
import { route } from '@/server/http/handler';
import { ok } from '@/server/http/responses';
import { UnauthorizedError } from '@/core/errors/app-error';
import { authService } from '@/infrastructure/container';
import {
  REFRESH_COOKIE,
  setAuthCookies,
} from '@/presentation/middleware/cookies';

export const runtime = 'nodejs';

export const POST = route(async (req: NextRequest) => {
  const cookieToken = req.cookies.get(REFRESH_COOKIE)?.value;
  let bodyToken: string | undefined;
  try {
    const json = (await req.json()) as { refreshToken?: string };
    bodyToken = json.refreshToken;
  } catch {
    bodyToken = undefined;
  }

  const rawToken = cookieToken ?? bodyToken;
  if (!rawToken) {
    throw new UnauthorizedError('Refresh token is required');
  }

  const tokens = await authService.refresh(rawToken);

  const res = ok({ accessToken: tokens.accessToken });
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  return res;
});
