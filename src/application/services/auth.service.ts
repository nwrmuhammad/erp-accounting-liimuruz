import type { RoleType } from '@prisma/client';
import {
  ForbiddenError,
  UnauthorizedError,
} from '@/core/errors/app-error';
import { env } from '@/core/config/env';
import { signAccessToken } from '@/lib/jwt';
import { verifyPassword } from '@/lib/password';
import { generateOpaqueToken, hashToken } from '@/lib/token';
import type { IUserRepository } from '@/domain/repositories/user.repository';
import type { IAuthRepository } from '@/domain/repositories/auth.repository';
import { toUserDto, type UserDto } from '@/application/dto/user.dto';

interface RequestMeta {
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

export class AuthService {
  constructor(
    private readonly users: IUserRepository,
    private readonly auth: IAuthRepository,
  ) {}

  async login(
    email: string,
    password: string,
    meta: RequestMeta,
  ): Promise<AuthTokens> {
    const user = await this.users.findByEmail(email);
    // Constant-ish handling: same error whether user missing or password wrong.
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError('Account is not active');
    }

    const tokens = await this.issueSessionTokens(
      {
        userId: user.id,
        email: user.email,
        roleType: user.role.type,
        branchId: user.branchId,
        permissions: user.role.permissions.map((rp) => rp.permission.key),
      },
      meta,
    );

    await this.users.setLastLogin(user.id, new Date());

    return { ...tokens, user: toUserDto(user) };
  }

  async refresh(rawRefreshToken: string): Promise<Omit<AuthTokens, 'user'>> {
    const tokenHash = hashToken(rawRefreshToken);
    const stored = await this.auth.findRefreshTokenByHash(tokenHash);

    if (!stored || stored.revokedAt || stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
    if (!stored.sessionId) {
      throw new UnauthorizedError('Refresh token is not bound to a session');
    }

    const sessionActive = await this.auth.isSessionActive(stored.sessionId);
    if (!sessionActive) {
      throw new UnauthorizedError('Session is no longer active');
    }

    const user = await this.users.findById(stored.userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedError('User is not active');
    }

    // Rotate: issue a new refresh token, then revoke the old one.
    const accessToken = await signAccessToken({
      userId: user.id,
      email: user.email,
      roleType: user.role.type,
      branchId: user.branchId,
      sessionId: stored.sessionId,
      permissions: user.role.permissions.map((rp) => rp.permission.key),
    });

    const newRaw = generateOpaqueToken();
    const newToken = await this.auth.createRefreshToken({
      tokenHash: hashToken(newRaw),
      userId: user.id,
      sessionId: stored.sessionId,
      expiresAt: new Date(Date.now() + env.JWT_REFRESH_TTL * 1000),
    });
    await this.auth.revokeRefreshToken(stored.id, newToken.id);

    return { accessToken, refreshToken: newRaw };
  }

  async logout(sessionId: string): Promise<void> {
    await this.auth.revokeRefreshTokensForSession(sessionId);
    await this.auth.revokeSession(sessionId);
  }

  private async issueSessionTokens(
    claims: {
      userId: string;
      email: string;
      roleType: RoleType;
      branchId: string | null;
      permissions: string[];
    },
    meta: RequestMeta,
  ): Promise<Omit<AuthTokens, 'user'>> {
    const session = await this.auth.createSession({
      userId: claims.userId,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt: new Date(Date.now() + env.JWT_REFRESH_TTL * 1000),
    });

    const accessToken = await signAccessToken({
      userId: claims.userId,
      email: claims.email,
      roleType: claims.roleType,
      branchId: claims.branchId,
      sessionId: session.id,
      permissions: claims.permissions,
    });

    const rawRefresh = generateOpaqueToken();
    await this.auth.createRefreshToken({
      tokenHash: hashToken(rawRefresh),
      userId: claims.userId,
      sessionId: session.id,
      expiresAt: session.expiresAt,
    });

    return { accessToken, refreshToken: rawRefresh };
  }
}
