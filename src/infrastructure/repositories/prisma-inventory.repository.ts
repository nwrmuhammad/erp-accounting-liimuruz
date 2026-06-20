import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type {
  IInventoryRepository,
  InventoryListFilter,
  InventoryMovementWithRelations,
  StockSummary,
} from '@/domain/repositories/inventory.repository';

const include = {
  product: { include: { category: true } },
  branch: true,
  createdBy: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.InventoryMovementInclude;

export class PrismaInventoryRepository implements IInventoryRepository {
  findById(id: string): Promise<InventoryMovementWithRelations | null> {
    return prisma.inventoryMovement.findUnique({ where: { id }, include });
  }

  async list(
    filter: InventoryListFilter,
  ): Promise<{ items: InventoryMovementWithRelations[]; total: number }> {
    const where: Prisma.InventoryMovementWhereInput = {
      ...(filter.branchId ? { branchId: filter.branchId } : {}),
      ...(filter.productId ? { productId: filter.productId } : {}),
      ...(filter.type ? { type: filter.type } : {}),
      ...(filter.search
        ? {
            product: {
              OR: [
                { name: { contains: filter.search, mode: 'insensitive' } },
                { sku: { contains: filter.search, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
      ...(filter.dateFrom || filter.dateTo
        ? {
            createdAt: {
              ...(filter.dateFrom ? { gte: filter.dateFrom } : {}),
              ...(filter.dateTo ? { lte: filter.dateTo } : {}),
            },
          }
        : {}),
    };

    const orderBy: Prisma.InventoryMovementOrderByWithRelationInput =
      filter.orderBy
        ? { [filter.orderBy]: filter.orderDir ?? 'desc' }
        : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where,
        include,
        orderBy,
        skip: filter.skip,
        take: filter.take,
      }),
      prisma.inventoryMovement.count({ where }),
    ]);

    return { items, total };
  }

  create(
    data: Prisma.InventoryMovementCreateInput,
  ): Promise<InventoryMovementWithRelations> {
    return prisma.inventoryMovement.create({ data, include });
  }

  async getStockSummary(
    branchId: string,
    productId?: string,
  ): Promise<StockSummary[]> {
    const where: Prisma.InventoryMovementWhereInput = {
      branchId,
      ...(productId ? { productId } : {}),
    };

    const movements = await prisma.inventoryMovement.groupBy({
      by: ['productId', 'type'],
      where,
      _sum: { quantity: true },
    });

    const productIds = [...new Set(movements.map((m) => m.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true, unit: true, stock: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const summaryMap = new Map<string, StockSummary>();
    for (const m of movements) {
      const product = productMap.get(m.productId);
      if (!product) continue;

      if (!summaryMap.has(m.productId)) {
        summaryMap.set(m.productId, {
          productId: m.productId,
          productName: product.name,
          sku: product.sku,
          unit: product.unit,
          totalIncoming: 0,
          totalOutgoing: 0,
          currentStock: product.stock,
        });
      }

      const summary = summaryMap.get(m.productId)!;
      if (m.type === 'INCOMING') {
        summary.totalIncoming += m._sum.quantity ?? 0;
      } else {
        summary.totalOutgoing += m._sum.quantity ?? 0;
      }
    }

    return Array.from(summaryMap.values());
  }
}
