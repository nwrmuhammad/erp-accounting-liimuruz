import type { NextRequest } from 'next/server';
import { route } from '@/server/http/handler';
import { created, ok } from '@/server/http/responses';
import { authenticate } from '@/presentation/middleware/authenticate';
import { branchService, auditService } from '@/infrastructure/container';
import {
  createBranchSchema,
  listBranchesQuerySchema,
} from '@/presentation/validators/branch.schema';
import { getClientIp, getUserAgent } from '@/server/http/request-context';

export const runtime = 'nodejs';

export const GET = route(async (req: NextRequest) => {
  const ctx = await authenticate(req);
  const query = listBranchesQuerySchema.parse(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  const result = await branchService.list(ctx, query);
  return ok(result);
});

export const POST = route(async (req: NextRequest) => {
  const ctx = await authenticate(req);
  const body = createBranchSchema.parse(await req.json());
  const branch = await branchService.create(ctx, body);

  await auditService.record({
    userId: ctx.userId,
    branchId: branch.id,
    action: 'BRANCH_CREATED',
    entity: 'Branch',
    entityId: branch.id,
    metadata: { code: branch.code },
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });

  return created(branch);
});
