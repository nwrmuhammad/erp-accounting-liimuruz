import { PERMISSIONS } from '@/core/constants/permissions';
import { isGlobalRole } from '@/core/constants/roles';
import type { AuthContext } from '@/core/types/auth';
import { authorize } from '@/presentation/guards/rbac';
import { prisma } from '@/lib/prisma';

export interface SalesSummary {
  totalCashUzs: number;
  totalCashUsd: number;
  totalOnline: number;
  totalAli: number;
  totalBilol: number;
  totalSales: number;
  salesCount: number;
}

export interface InventoryTrend {
  date: string;
  incoming: number;
  outgoing: number;
  net: number;
}

export interface ExpenseTrend {
  totalUzs: number;
  totalUsd: number;
  count: number;
}

export interface AnalyticsResult {
  sales: SalesSummary;
  inventoryTrends: InventoryTrend[];
  expenseTrends: ExpenseTrend[];
  period: {
    from: string;
    to: string;
  };
}

export interface AnalyticsQuery {
  branchId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export class AnalyticsService {
  async get(ctx: AuthContext, query: AnalyticsQuery): Promise<AnalyticsResult> {
    authorize(ctx, PERMISSIONS.ANALYTICS_READ);

    const branchId = isGlobalRole(ctx.roleType)
      ? query.branchId
      : (ctx.branchId ?? undefined);

    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : this.startOfMonth();
    const dateTo = query.dateTo ? new Date(query.dateTo) : new Date();

    const dateFilter = { gte: dateFrom, lte: dateTo };
    const branchFilter = branchId ? { branchId } : {};

    const [
      salesCashUzs,
      salesCashUsd,
      salesOnline,
      salesAli,
      salesBilol,
      allSales,
      inventoryMovements,
      expenseStats,
    ] = await Promise.all([
      prisma.sale.aggregate({
        where: { ...branchFilter, paymentType: 'CASH_UZS', createdAt: dateFilter },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: { ...branchFilter, paymentType: 'CASH_USD', createdAt: dateFilter },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: { ...branchFilter, paymentType: 'ONLINE', createdAt: dateFilter },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: { ...branchFilter, paymentType: 'ONLINE', onlineReceiver: 'ALI', createdAt: dateFilter },
        _sum: { totalAmount: true },
      }),
      prisma.sale.aggregate({
        where: { ...branchFilter, paymentType: 'ONLINE', onlineReceiver: 'BILOL', createdAt: dateFilter },
        _sum: { totalAmount: true },
      }),
      prisma.sale.aggregate({
        where: { ...branchFilter, createdAt: dateFilter },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.inventoryMovement.findMany({
        where: { ...branchFilter, createdAt: dateFilter },
        select: { type: true, quantity: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.expense.groupBy({
        by: ['currency'],
        where: { ...branchFilter, expenseDate: dateFilter },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    // Inventory trends — aggregate by day in-memory
    const trendMap = new Map<string, { incoming: number; outgoing: number }>();
    for (const row of inventoryMovements) {
      const day = row.createdAt.toISOString().slice(0, 10);
      if (!trendMap.has(day)) trendMap.set(day, { incoming: 0, outgoing: 0 });
      const entry = trendMap.get(day)!;
      if (row.type === 'INCOMING') entry.incoming += row.quantity;
      else entry.outgoing += row.quantity;
    }
    const inventoryTrends: InventoryTrend[] = Array.from(trendMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, incoming: v.incoming, outgoing: v.outgoing, net: v.incoming - v.outgoing }));

    let totalExpenseUzs = 0;
    let totalExpenseUsd = 0;
    let totalExpenseCount = 0;
    for (const row of expenseStats) {
      totalExpenseCount += row._count;
      if (row.currency === 'UZS') totalExpenseUzs += row._sum.amount?.toNumber() ?? 0;
      if (row.currency === 'USD') totalExpenseUsd += row._sum.amount?.toNumber() ?? 0;
    }
    const expenseTrends: ExpenseTrend[] = [{ totalUzs: totalExpenseUzs, totalUsd: totalExpenseUsd, count: totalExpenseCount }];

    return {
      sales: {
        totalCashUzs: salesCashUzs._sum.totalAmount?.toNumber() ?? 0,
        totalCashUsd: salesCashUsd._sum.totalAmount?.toNumber() ?? 0,
        totalOnline: salesOnline._sum.totalAmount?.toNumber() ?? 0,
        totalAli: salesAli._sum.totalAmount?.toNumber() ?? 0,
        totalBilol: salesBilol._sum.totalAmount?.toNumber() ?? 0,
        totalSales: allSales._sum.totalAmount?.toNumber() ?? 0,
        salesCount: allSales._count,
      },
      inventoryTrends,
      expenseTrends,
      period: { from: dateFrom.toISOString(), to: dateTo.toISOString() },
    };
  }

  private startOfMonth(): Date {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }
}
