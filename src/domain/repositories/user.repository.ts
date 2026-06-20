import type { Prisma, User } from '@prisma/client';

export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    role: { include: { permissions: { include: { permission: true } } } };
    branch: true;
  };
}>;

export interface UserListFilter {
  search?: string;
  branchId?: string;
  status?: User['status'];
  skip: number;
  take: number;
}

export interface IUserRepository {
  findById(id: string): Promise<UserWithRelations | null>;
  findByEmail(email: string): Promise<UserWithRelations | null>;
  list(
    filter: UserListFilter,
  ): Promise<{ items: UserWithRelations[]; total: number }>;
  create(data: Prisma.UserCreateInput): Promise<UserWithRelations>;
  update(id: string, data: Prisma.UserUpdateInput): Promise<UserWithRelations>;
  delete(id: string): Promise<void>;
  setLastLogin(id: string, at: Date): Promise<void>;
}
