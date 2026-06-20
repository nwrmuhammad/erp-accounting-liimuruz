import type { RefreshToken, Session } from '@prisma/client';

export interface CreateSessionInput {
  userId: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
}

export interface CreateRefreshTokenInput {
  tokenHash: string;
  userId: string;
  sessionId: string;
  expiresAt: Date;
}

export interface IAuthRepository {
  createSession(input: CreateSessionInput): Promise<Session>;
  revokeSession(sessionId: string): Promise<void>;
  isSessionActive(sessionId: string): Promise<boolean>;

  createRefreshToken(input: CreateRefreshTokenInput): Promise<RefreshToken>;
  findRefreshTokenByHash(hash: string): Promise<RefreshToken | null>;
  revokeRefreshToken(id: string, replacedById?: string): Promise<void>;
  revokeRefreshTokensForSession(sessionId: string): Promise<void>;
}
