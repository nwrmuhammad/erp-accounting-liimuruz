import { route } from '@/server/http/handler';
import { ok } from '@/server/http/responses';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export const GET = route(async () => {
  await prisma.$queryRaw`SELECT 1`;
  return ok({ status: 'healthy', timestamp: new Date().toISOString() });
});
