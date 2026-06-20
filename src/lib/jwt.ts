import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import type { RoleType } from '@prisma/client';
import { env } from '@/core/config/env';
import { UnauthorizedError } from '@/core/errors/app-error';
import type { AuthContext } from '@/core/types/auth';

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

export interface AccessTokenClaims extends JWTPayload {
  sub: string;
  email: string;
  roleType: RoleType;
  branchId: string | null;
  sessionId: string;
  permissions: string[];
}

export interface SignAccessTokenInput {
  userId: string;
  email: string;
  roleType: RoleType;
  branchId: string | null;
  sessionId: string;
  permissions: string[];
}

export async function signAccessToken(
  input: SignAccessTokenInput,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    email: input.email,
    roleType: input.roleType,
    branchId: input.branchId,
    sessionId: input.sessionId,
    permissions: input.permissions,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(input.userId)
    .setIssuedAt(now)
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setExpirationTime(now + env.JWT_ACCESS_TTL)
    .sign(accessSecret);
}

export async function verifyAccessToken(token: string): Promise<AuthContext> {
  try {
    const { payload } = await jwtVerify<AccessTokenClaims>(token, accessSecret, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });

    if (!payload.sub || !payload.sessionId) {
      throw new UnauthorizedError('Malformed access token');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      roleType: payload.roleType,
      branchId: payload.branchId,
      sessionId: payload.sessionId,
      permissions: payload.permissions ?? [],
    };
  } catch {
    throw new UnauthorizedError('Invalid or expired access token');
  }
}
