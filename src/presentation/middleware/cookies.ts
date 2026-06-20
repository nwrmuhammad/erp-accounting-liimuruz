import type { NextResponse } from 'next/server';
import { env } from '@/core/config/env';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

const baseOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'lax' as const,
  path: '/',
};

export function setAuthCookies(
  res: NextResponse,
  accessToken: string,
  refreshToken: string,
): void {
  res.cookies.set(ACCESS_COOKIE, accessToken, {
    ...baseOptions,
    maxAge: env.JWT_ACCESS_TTL,
  });
  res.cookies.set(REFRESH_COOKIE, refreshToken, {
    ...baseOptions,
    maxAge: env.JWT_REFRESH_TTL,
  });
}

export function clearAuthCookies(res: NextResponse): void {
  res.cookies.set(ACCESS_COOKIE, '', { ...baseOptions, maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, '', { ...baseOptions, maxAge: 0 });
}
