import type { Prisma, RoleType } from '@prisma/client';

export type RoleWithPermissions = Prisma.RoleGetPayload<{
  include: { permissions: { include: { permission: true } } };
}>;

export interface IRoleRepository {
  findByType(type: RoleType): Promise<RoleWithPermissions | null>;
}
