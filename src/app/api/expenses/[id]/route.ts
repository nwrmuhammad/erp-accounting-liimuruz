import type { NextRequest } from 'next/server';
import { route } from '@/server/http/handler';
import { noContent, ok } from '@/server/http/responses';
import { authenticate } from '@/presentation/middleware/authenticate';
import { expenseService, auditService } from '@/infrastructure/container';
import { updateExpenseSchema } from '@/presentation/validators/expense.schema';
import { getClientIp, getUserAgent } from '@/server/http/request-context';

export const runtime = 'nodejs';

export const GET = route(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await authenticate(req);
  const { id } = await params;
  const expense = await expenseService.getById(ctx, id);
  return ok(expense);
});

export const PATCH = route(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await authenticate(req);
  const { id } = await params;
  const body = updateExpenseSchema.parse(await req.json());
  const expense = await expenseService.update(ctx, id, body);

  await auditService.record({
    userId: ctx.userId,
    branchId: expense.branchId,
    action: 'EXPENSE_UPDATED',
    entity: 'Expense',
    entityId: expense.id,
    metadata: body,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });

  return ok(expense);
});

export const DELETE = route(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await authenticate(req);
  const { id } = await params;
  await expenseService.remove(ctx, id);

  await auditService.record({
    userId: ctx.userId,
    action: 'EXPENSE_DELETED',
    entity: 'Expense',
    entityId: id,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });

  return noContent();
});
