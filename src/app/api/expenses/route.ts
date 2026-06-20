import type { NextRequest } from 'next/server';
import { route } from '@/server/http/handler';
import { created, ok } from '@/server/http/responses';
import { authenticate } from '@/presentation/middleware/authenticate';
import { expenseService, auditService } from '@/infrastructure/container';
import {
  createExpenseSchema,
  listExpensesQuerySchema,
} from '@/presentation/validators/expense.schema';
import { getClientIp, getUserAgent } from '@/server/http/request-context';

export const runtime = 'nodejs';

export const GET = route(async (req: NextRequest) => {
  const ctx = await authenticate(req);
  const query = listExpensesQuerySchema.parse(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  const result = await expenseService.list(ctx, query);
  return ok(result);
});

export const POST = route(async (req: NextRequest) => {
  const ctx = await authenticate(req);
  const body = createExpenseSchema.parse(await req.json());
  const expense = await expenseService.create(ctx, body);

  await auditService.record({
    userId: ctx.userId,
    branchId: expense.branchId,
    action: 'EXPENSE_CREATED',
    entity: 'Expense',
    entityId: expense.id,
    metadata: {
      amount: expense.amount,
      currency: expense.currency,
    },
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });

  return created(expense);
});
