import type { Branch, Prisma } from '@prisma/client';

export interface BranchListFilter {
  search?: string;
  region?: string;
  isActive?: boolean;
  skip: number;
  take: number;
}

export interface IBranchRepository {
  findById(id: string): Promise<Branch | null>;
  findByCode(code: string): Promise<Branch | null>;
  list(
    filter: BranchListFilter,
  ): Promise<{ items: Branch[]; total: number }>;
  create(data: Prisma.BranchCreateInput): Promise<Branch>;
  update(id: string, data: Prisma.BranchUpdateInput): Promise<Branch>;
  delete(id: string): Promise<void>;
  countUsers(branchId: string): Promise<number>;
}
