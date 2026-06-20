import type { Prisma } from '@prisma/client';
import { NotFoundError } from '@/core/errors/app-error';
import { PERMISSIONS } from '@/core/constants/permissions';
import { isGlobalRole } from '@/core/constants/roles';
import type { AuthContext, Paginated } from '@/core/types/auth';
import { authorize, assertBranchAccess } from '@/presentation/guards/rbac';
import type { IExpenseRepository } from '@/domain/repositories/expense.repository';
import { toExpenseDto, type ExpenseDto } from '@/application/dto/expense.dto';
import type {
  CreateExpenseInput,
  ListExpensesQuery,
  UpdateExpenseInput,
} from '@/presentation/validators/expense.schema';

export class ExpenseService {
  constructor(private readonly expenses: IExpenseRepository) {}

  async list(ctx: AuthContext, query: ListExpensesQuery): Promise<Paginated<ExpenseDto>> {
    authorize(ctx, PERMISSIONS.EXPENSE_LIST);
    const branchId = isGlobalRole(ctx.roleType) ? query.branchId : (ctx.branchId ?? '__none__');

    const { items, total } = await this.expenses.list({
      branchId,
      currency: query.currency,
      paymentType: query.paymentType,
      onlineReceiver: query.onlineReceiver,
      search: query.search,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: query.orderBy,
      orderDir: query.orderDir,
    });

    return {
      items: items.map(toExpenseDto),
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  }

  async getById(ctx: AuthContext, id: string): Promise<ExpenseDto> {
    authorize(ctx, PERMISSIONS.EXPENSE_READ);
    const expense = await this.expenses.findById(id);
    if (!expense) throw new NotFoundError('Expense not found');
    assertBranchAccess(ctx, expense.branchId);
    return toExpenseDto(expense);
  }

  async create(ctx: AuthContext, input: CreateExpenseInput): Promise<ExpenseDto> {
    authorize(ctx, PERMISSIONS.EXPENSE_CREATE);
    const branchId = isGlobalRole(ctx.roleType) ? (input.branchId ?? ctx.branchId!) : ctx.branchId!;

    const expense = await this.expenses.create({
      branch: { connect: { id: branchId } },
      description: input.description,
      amount: input.amount,
      currency: input.currency,
      exchangeRate: input.exchangeRate ?? null,
      paymentType: input.paymentType,
      onlineReceiver: input.onlineReceiver ?? null,
      paidBy: { connect: { id: ctx.userId } },
      receiptUrl: input.receiptUrl ?? null,
      notes: input.notes ?? null,
      expenseDate: input.expenseDate ? new Date(input.expenseDate) : new Date(),
    } as Prisma.ExpenseCreateInput);

    return toExpenseDto(expense);
  }

  async update(ctx: AuthContext, id: string, input: UpdateExpenseInput): Promise<ExpenseDto> {
    authorize(ctx, PERMISSIONS.EXPENSE_UPDATE);
    const expense = await this.expenses.findById(id);
    if (!expense) throw new NotFoundError('Expense not found');
    assertBranchAccess(ctx, expense.branchId);

    const updated = await this.expenses.update(id, {
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.exchangeRate !== undefined ? { exchangeRate: input.exchangeRate } : {}),
      ...(input.paymentType !== undefined ? { paymentType: input.paymentType } : {}),
      ...(input.onlineReceiver !== undefined ? { onlineReceiver: input.onlineReceiver } : {}),
      ...(input.receiptUrl !== undefined ? { receiptUrl: input.receiptUrl } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.expenseDate !== undefined ? { expenseDate: new Date(input.expenseDate) } : {}),
    });

    return toExpenseDto(updated);
  }

  async remove(ctx: AuthContext, id: string): Promise<void> {
    authorize(ctx, PERMISSIONS.EXPENSE_DELETE);
    const expense = await this.expenses.findById(id);
    if (!expense) throw new NotFoundError('Expense not found');
    assertBranchAccess(ctx, expense.branchId);
    await this.expenses.delete(id);
  }
}
