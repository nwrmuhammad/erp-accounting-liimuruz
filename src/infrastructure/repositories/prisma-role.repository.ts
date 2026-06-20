import type { RoleType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type {
  IRoleRepository,
  RoleWithPermissions,
} from '@/domain/repositories/role.repository';

export class PrismaRoleRepository implements IRoleRepository {
  findByType(type: RoleType): Promise<RoleWithPermissions | null> {
    return prisma.role.findUnique({
      where: { type },
      include: { permissions: { include: { permission: true } } },
    });
  }
}
