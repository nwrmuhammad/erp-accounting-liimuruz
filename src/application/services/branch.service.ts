import { ConflictError, NotFoundError } from '@/core/errors/app-error';
import { PERMISSIONS } from '@/core/constants/permissions';
import { isGlobalRole } from '@/core/constants/roles';
import type { AuthContext, Paginated } from '@/core/types/auth';
import type { IBranchRepository } from '@/domain/repositories/branch.repository';
import { authorize, assertBranchAccess } from '@/presentation/guards/rbac';
import type {
  CreateBranchInput,
  ListBranchesQuery,
  UpdateBranchInput,
} from '@/presentation/validators/branch.schema';
import type { Branch } from '@prisma/client';
import { ForbiddenError } from '@/core/errors/app-error';

export interface BranchDto {
  id: string;
  name: string;
  code: string;
  region: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

function toBranchDto(branch: Branch): BranchDto {
  return {
    id: branch.id,
    name: branch.name,
    code: branch.code,
    region: branch.region,
    city: branch.city,
    address: branch.address,
    phone: branch.phone,
    isActive: branch.isActive,
    createdAt: branch.createdAt.toISOString(),
  };
}

export class BranchService {
  constructor(private readonly branches: IBranchRepository) {}

  async list(
    ctx: AuthContext,
    query: ListBranchesQuery,
  ): Promise<Paginated<BranchDto>> {
    authorize(ctx, PERMISSIONS.BRANCH_LIST);

    // Scoped roles only see their own branch in lists.
    if (!isGlobalRole(ctx.roleType)) {
      if (!ctx.branchId) {
        return {
          items: [],
          total: 0,
          page: query.page,
          pageSize: query.pageSize,
          totalPages: 1,
        };
      }
      const branch = await this.branches.findById(ctx.branchId);
      const items = branch ? [toBranchDto(branch)] : [];
      return {
        items,
        total: items.length,
        page: 1,
        pageSize: query.pageSize,
        totalPages: 1,
      };
    }

    const { items, total } = await this.branches.list({
      search: query.search,
      region: query.region,
      isActive: query.isActive,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });

    return {
      items: items.map(toBranchDto),
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  }

  async getById(ctx: AuthContext, id: string): Promise<BranchDto> {
    authorize(ctx, PERMISSIONS.BRANCH_READ);
    const branch = await this.branches.findById(id);
    if (!branch) throw new NotFoundError('Branch not found');
    assertBranchAccess(ctx, branch.id);
    return toBranchDto(branch);
  }

  async create(ctx: AuthContext, input: CreateBranchInput): Promise<BranchDto> {
    authorize(ctx, PERMISSIONS.BRANCH_CREATE);
    const existing = await this.branches.findByCode(input.code);
    if (existing) throw new ConflictError('Branch code already exists');

    const branch = await this.branches.create({
      name: input.name,
      code: input.code,
      region: input.region,
      city: input.city ?? null,
      address: input.address ?? null,
      phone: input.phone ?? null,
    });
    return toBranchDto(branch);
  }

  async update(
    ctx: AuthContext,
    id: string,
    input: UpdateBranchInput,
  ): Promise<BranchDto> {
    authorize(ctx, PERMISSIONS.BRANCH_UPDATE);
    const branch = await this.branches.findById(id);
    if (!branch) throw new NotFoundError('Branch not found');

    const updated = await this.branches.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.region !== undefined ? { region: input.region } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });
    return toBranchDto(updated);
  }

  async remove(ctx: AuthContext, id: string): Promise<void> {
    authorize(ctx, PERMISSIONS.BRANCH_DELETE);
    const branch = await this.branches.findById(id);
    if (!branch) throw new NotFoundError('Branch not found');

    const userCount = await this.branches.countUsers(id);
    if (userCount > 0) {
      throw new ForbiddenError(
        'Cannot delete a branch that still has assigned users',
      );
    }
    await this.branches.delete(id);
  }
}
