import type { NextRequest } from 'next/server';

export function getClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return req.headers.get('x-real-ip');
}

export function getUserAgent(req: NextRequest): string | null {
  return req.headers.get('user-agent');
}
