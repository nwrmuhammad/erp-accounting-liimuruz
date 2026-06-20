import type { Branch, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type {
  BranchListFilter,
  IBranchRepository,
} from '@/domain/repositories/branch.repository';

export class PrismaBranchRepository implements IBranchRepository {
  findById(id: string): Promise<Branch | null> {
    return prisma.branch.findUnique({ where: { id } });
  }

  findByCode(code: string): Promise<Branch | null> {
    return prisma.branch.findUnique({ where: { code } });
  }

  async list(
    filter: BranchListFilter,
  ): Promise<{ items: Branch[]; total: number }> {
    const where: Prisma.BranchWhereInput = {
      ...(filter.region ? { region: filter.region } : {}),
      ...(filter.isActive !== undefined ? { isActive: filter.isActive } : {}),
      ...(filter.search
        ? {
            OR: [
              { name: { contains: filter.search, mode: 'insensitive' } },
              { code: { contains: filter.search, mode: 'insensitive' } },
              { city: { contains: filter.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.branch.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: filter.skip,
        take: filter.take,
      }),
      prisma.branch.count({ where }),
    ]);

    return { items, total };
  }

  create(data: Prisma.BranchCreateInput): Promise<Branch> {
    return prisma.branch.create({ data });
  }

  update(id: string, data: Prisma.BranchUpdateInput): Promise<Branch> {
    return prisma.branch.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.branch.delete({ where: { id } });
  }

  countUsers(branchId: string): Promise<number> {
    return prisma.user.count({ where: { branchId } });
  }
}
