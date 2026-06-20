import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type {
  IUserRepository,
  UserListFilter,
  UserWithRelations,
} from '@/domain/repositories/user.repository';

const include = {
  role: { include: { permissions: { include: { permission: true } } } },
  branch: true,
} satisfies Prisma.UserInclude;

export class PrismaUserRepository implements IUserRepository {
  findById(id: string): Promise<UserWithRelations | null> {
    return prisma.user.findUnique({ where: { id }, include });
  }

  findByEmail(email: string): Promise<UserWithRelations | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include,
    });
  }

  async list(
    filter: UserListFilter,
  ): Promise<{ items: UserWithRelations[]; total: number }> {
    const where: Prisma.UserWhereInput = {
      ...(filter.branchId ? { branchId: filter.branchId } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.search
        ? {
            OR: [
              { email: { contains: filter.search, mode: 'insensitive' } },
              { firstName: { contains: filter.search, mode: 'insensitive' } },
              { lastName: { contains: filter.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
        skip: filter.skip,
        take: filter.take,
      }),
      prisma.user.count({ where }),
    ]);

    return { items, total };
  }

  create(data: Prisma.UserCreateInput): Promise<UserWithRelations> {
    return prisma.user.create({ data, include });
  }

  update(
    id: string,
    data: Prisma.UserUpdateInput,
  ): Promise<UserWithRelations> {
    return prisma.user.update({ where: { id }, data, include });
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }

  async setLastLogin(id: string, at: Date): Promise<void> {
    await prisma.user.update({ where: { id }, data: { lastLoginAt: at } });
  }
}
