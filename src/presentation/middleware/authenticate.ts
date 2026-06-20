import type { NextRequest } from 'next/server';
import { UnauthorizedError } from '@/core/errors/app-error';
import { verifyAccessToken } from '@/lib/jwt';
import type { AuthContext } from '@/core/types/auth';
import { ACCESS_COOKIE } from '@/presentation/middleware/cookies';

function extractToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization');
  if (header?.startsWith('Bearer ')) {
    return header.slice('Bearer '.length).trim();
  }
  return req.cookies.get(ACCESS_COOKIE)?.value ?? null;
}

/** Verifies the access token and returns the auth context, or throws 401. */
export async function authenticate(req: NextRequest): Promise<AuthContext> {
  const token = extractToken(req);
  if (!token) {
    throw new UnauthorizedError('Missing authentication token');
  }
  return verifyAccessToken(token);
}
