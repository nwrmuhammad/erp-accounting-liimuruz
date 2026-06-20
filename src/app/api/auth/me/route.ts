import type { NextRequest } from 'next/server';
import { route } from '@/server/http/handler';
import { ok } from '@/server/http/responses';
import { NotFoundError } from '@/core/errors/app-error';
import { authenticate } from '@/presentation/middleware/authenticate';
import { userService } from '@/infrastructure/container';

export const runtime = 'nodejs';

export const GET = route(async (req: NextRequest) => {
  const ctx = await authenticate(req);
  const user = await userService.getById(ctx, ctx.userId);
  if (!user) throw new NotFoundError('User not found');
  return ok(user);
});
