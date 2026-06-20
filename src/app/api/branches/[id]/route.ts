import type { NextRequest } from 'next/server';
import { route } from '@/server/http/handler';
import { ok } from '@/server/http/responses';
import { authenticate } from '@/presentation/middleware/authenticate';
import { branchService, auditService } from '@/infrastructure/container';
import { updateBranchSchema } from '@/presentation/validators/branch.schema';
import { getClientIp, getUserAgent } from '@/server/http/request-context';

export const runtime = 'nodejs';

interface Params {
  params: Promise<{ id: string }>;
}

export const GET = route(async (req: NextRequest, { params }: Params) => {
  const ctx = await authenticate(req);
  const { id } = await params;
  const branch = await branchService.getById(ctx, id);
  return ok(branch);
});

export const PATCH = route(async (req: NextRequest, { params }: Params) => {
  const ctx = await authenticate(req);
  const { id } = await params;
  const body = updateBranchSchema.parse(await req.json());
  const branch = await branchService.update(ctx, id, body);

  await auditService.record({
    userId: ctx.userId,
    branchId: branch.id,
    action: 'BRANCH_UPDATED',
    entity: 'Branch',
    entityId: id,
    metadata: { fields: Object.keys(body) },
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });

  return ok(branch);
});

export const DELETE = route(async (req: NextRequest, { params }: Params) => {
  const ctx = await authenticate(req);
  const { id } = await params;
  await branchService.remove(ctx, id);

  await auditService.record({
    userId: ctx.userId,
    branchId: id,
    action: 'BRANCH_DELETED',
    entity: 'Branch',
    entityId: id,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });

  return ok({ deleted: true });
});
