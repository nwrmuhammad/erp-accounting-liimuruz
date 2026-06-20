import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type {
  ISaleRepository,
  SaleListFilter,
  SaleWithRelations,
} from '@/domain/repositories/sale.repository';

const include = {
  branch: true,
  createdBy: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.SaleInclude;

export class PrismaSaleRepository implements ISaleRepository {
  findById(id: string): Promise<SaleWithRelations | null> {
    return prisma.sale.findUnique({ where: { id }, include });
  }

  findBySaleNumber(saleNumber: string): Promise<SaleWithRelations | null> {
    return prisma.sale.findUnique({ where: { saleNumber }, include });
  }

  async list(filter: SaleListFilter): Promise<{ items: SaleWithRelations[]; total: number }> {
    const baseWhere: Prisma.SaleWhereInput = {
      ...(filter.branchId ? { branchId: filter.branchId } : {}),
      ...(filter.createdById ? { createdById: filter.createdById } : {}),
      ...(filter.paymentType ? { paymentType: filter.paymentType } : {}),
      ...(filter.onlineReceiver ? { onlineReceiver: filter.onlineReceiver } : {}),
      ...(filter.currency ? { currency: filter.currency } : {}),
      ...(filter.search
        ? {
            OR: [
              { productName: { contains: filter.search, mode: 'insensitive' } },
              { notes: { contains: filter.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    let where: Prisma.SaleWhereInput;

    if (filter.mode === 'active') {
      // UTC date boundaries — form ham UTC midnight yuboradi, shu bilan mos keladi
      const todayUTC = new Date().toISOString().slice(0, 10); // '2026-06-20'
      const todayStart = new Date(todayUTC + 'T00:00:00.000Z');
      const todayEnd = new Date(todayUTC + 'T23:59:59.999Z');

      where = {
        ...baseWhere,
        OR: [
          // Bugungi OCHIQ va YOPILDI — 23:59 gacha ko'rinadi
          {
            saleDate: { gte: todayStart, lte: todayEnd },
            status: { in: ['OCHIQ', 'YOPILDI'] as const },
          },
          // POCHTADA+puli olinmagan — ixtiyoriy sana (pul kelguncha qoladi)
          { status: 'POCHTADA', puliOlindi: false },
        ],
      };
    } else {
      // Barcha sotuvlar (hisobot uchun)
      where = {
        ...baseWhere,
        ...(filter.dateFrom || filter.dateTo
          ? {
              saleDate: {
                ...(filter.dateFrom ? { gte: filter.dateFrom } : {}),
                ...(filter.dateTo ? { lte: filter.dateTo } : {}),
              },
            }
          : {}),
      };
    }

    const orderBy: Prisma.SaleOrderByWithRelationInput =
      filter.orderBy
        ? { [filter.orderBy]: filter.orderDir ?? 'desc' }
        : { saleDate: 'desc' };

    const [items, total] = await Promise.all([
      prisma.sale.findMany({ where, include, orderBy, skip: filter.skip, take: filter.take }),
      prisma.sale.count({ where }),
    ]);

    return { items, total };
  }

  create(data: Prisma.SaleCreateInput): Promise<SaleWithRelations> {
    return prisma.sale.create({ data, include });
  }

  update(id: string, data: Prisma.SaleUpdateInput): Promise<SaleWithRelations> {
    return prisma.sale.update({ where: { id }, data, include });
  }

  async delete(id: string): Promise<void> {
    await prisma.sale.delete({ where: { id } });
  }

  async getNextSaleNumber(branchCode: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `${branchCode}-${dateStr}-`;

    const last = await prisma.sale.findFirst({
      where: { saleNumber: { startsWith: prefix } },
      orderBy: { saleNumber: 'desc' },
      select: { saleNumber: true },
    });

    let seq = 1;
    if (last) {
      const parts = last.saleNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1] ?? '0', 10);
      seq = isNaN(lastSeq) ? 1 : lastSeq + 1;
    }

    return `${prefix}${String(seq).padStart(4, '0')}`;
  }
}
