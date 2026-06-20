import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type {
  ExpenseListFilter,
  ExpenseWithRelations,
  IExpenseRepository,
} from '@/domain/repositories/expense.repository';

const expenseInclude = {
  branch: true,
  paidBy: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.ExpenseInclude;

export class PrismaExpenseRepository implements IExpenseRepository {
  findById(id: string): Promise<ExpenseWithRelations | null> {
    return prisma.expense.findUnique({ where: { id }, include: expenseInclude });
  }

  async list(filter: ExpenseListFilter): Promise<{ items: ExpenseWithRelations[]; total: number }> {
    const where: Prisma.ExpenseWhereInput = {
      ...(filter.branchId ? { branchId: filter.branchId } : {}),
      ...(filter.currency ? { currency: filter.currency } : {}),
      ...(filter.paymentType ? { paymentType: filter.paymentType } : {}),
      ...(filter.onlineReceiver ? { onlineReceiver: filter.onlineReceiver } : {}),
      ...(filter.search
        ? { description: { contains: filter.search, mode: 'insensitive' } }
        : {}),
      ...(filter.dateFrom || filter.dateTo
        ? {
            expenseDate: {
              ...(filter.dateFrom ? { gte: filter.dateFrom } : {}),
              ...(filter.dateTo ? { lte: filter.dateTo } : {}),
            },
          }
        : {}),
    };

    const orderBy: Prisma.ExpenseOrderByWithRelationInput = filter.orderBy
      ? { [filter.orderBy]: filter.orderDir ?? 'desc' }
      : { expenseDate: 'desc' };

    const [items, total] = await Promise.all([
      prisma.expense.findMany({ where, include: expenseInclude, orderBy, skip: filter.skip, take: filter.take }),
      prisma.expense.count({ where }),
    ]);

    return { items, total };
  }

  create(data: Prisma.ExpenseCreateInput): Promise<ExpenseWithRelations> {
    return prisma.expense.create({ data, include: expenseInclude });
  }

  update(id: string, data: Prisma.ExpenseUpdateInput): Promise<ExpenseWithRelations> {
    return prisma.expense.update({ where: { id }, data, include: expenseInclude });
  }

  async delete(id: string): Promise<void> {
    await prisma.expense.delete({ where: { id } });
  }
}
