import type { RefreshToken, Session } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type {
  CreateRefreshTokenInput,
  CreateSessionInput,
  IAuthRepository,
} from '@/domain/repositories/auth.repository';

export class PrismaAuthRepository implements IAuthRepository {
  createSession(input: CreateSessionInput): Promise<Session> {
    return prisma.session.create({ data: input });
  }

  async revokeSession(sessionId: string): Promise<void> {
    await prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  async isSessionActive(sessionId: string): Promise<boolean> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { revokedAt: true, expiresAt: true },
    });
    if (!session) return false;
    if (session.revokedAt) return false;
    return session.expiresAt.getTime() > Date.now();
  }

  createRefreshToken(input: CreateRefreshTokenInput): Promise<RefreshToken> {
    return prisma.refreshToken.create({ data: input });
  }

  findRefreshTokenByHash(hash: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({ where: { tokenHash: hash } });
  }

  async revokeRefreshToken(id: string, replacedById?: string): Promise<void> {
    await prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date(), replacedById: replacedById ?? null },
    });
  }

  async revokeRefreshTokensForSession(sessionId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
