import { RoleType } from '@prisma/client';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '@/core/errors/app-error';
import { PERMISSIONS } from '@/core/constants/permissions';
import { isGlobalRole } from '@/core/constants/roles';
import type { AuthContext, Paginated } from '@/core/types/auth';
import { hashPassword } from '@/lib/password';
import type { IUserRepository } from '@/domain/repositories/user.repository';
import type { IBranchRepository } from '@/domain/repositories/branch.repository';
import type { IRoleRepository } from '@/domain/repositories/role.repository';
import { authorize, assertBranchAccess } from '@/presentation/guards/rbac';
import { toUserDto, type UserDto } from '@/application/dto/user.dto';
import type {
  CreateUserInput,
  ListUsersQuery,
  UpdateUserInput,
} from '@/presentation/validators/user.schema';

export class UserService {
  constructor(
    private readonly users: IUserRepository,
    private readonly branches: IBranchRepository,
    private readonly roles: IRoleRepository,
  ) {}

  async list(
    ctx: AuthContext,
    query: ListUsersQuery,
  ): Promise<Paginated<UserDto>> {
    authorize(ctx, PERMISSIONS.USER_LIST);

    // Branch-scoped roles can only ever list users in their own branch.
    const effectiveBranchId = isGlobalRole(ctx.roleType)
      ? query.branchId
      : (ctx.branchId ?? '__none__');

    const { items, total } = await this.users.list({
      search: query.search,
      branchId: effectiveBranchId,
      status: query.status,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });

    return {
      items: items.map(toUserDto),
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  }

  async getById(ctx: AuthContext, id: string): Promise<UserDto> {
    authorize(ctx, PERMISSIONS.USER_READ);
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundError('User not found');
    assertBranchAccess(ctx, user.branchId);
    return toUserDto(user);
  }

  async create(ctx: AuthContext, input: CreateUserInput): Promise<UserDto> {
    authorize(ctx, PERMISSIONS.USER_CREATE);
    this.assertCanAssignRole(ctx, input.roleType);

    const targetBranchId = this.resolveBranchForWrite(
      ctx,
      input.roleType,
      input.branchId ?? null,
    );

    if (targetBranchId) {
      const branch = await this.branches.findById(targetBranchId);
      if (!branch) throw new NotFoundError('Branch not found');
    }

    const existing = await this.users.findByEmail(input.email);
    if (existing) throw new ConflictError('Email is already in use');

    const role = await this.roles.findByType(input.roleType);
    if (!role) throw new NotFoundError('Role not found');

    const created = await this.users.create({
      email: input.email.toLowerCase(),
      passwordHash: await hashPassword(input.password),
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone ?? null,
      role: { connect: { id: role.id } },
      branch: targetBranchId ? { connect: { id: targetBranchId } } : undefined,
    });

    return toUserDto(created);
  }

  async update(
    ctx: AuthContext,
    id: string,
    input: UpdateUserInput,
  ): Promise<UserDto> {
    authorize(ctx, PERMISSIONS.USER_UPDATE);

    const user = await this.users.findById(id);
    if (!user) throw new NotFoundError('User not found');
    assertBranchAccess(ctx, user.branchId);

    if (input.roleType) {
      this.assertCanAssignRole(ctx, input.roleType);
    }

    const data: Parameters<IUserRepository['update']>[1] = {
      ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
      ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    };

    if (input.password) {
      data.passwordHash = await hashPassword(input.password);
    }

    if (input.roleType) {
      const role = await this.roles.findByType(input.roleType);
      if (!role) throw new NotFoundError('Role not found');
      data.role = { connect: { id: role.id } };
    }

    if (input.branchId !== undefined) {
      if (!isGlobalRole(ctx.roleType)) {
        throw new ForbiddenError('Only a super admin can reassign branches');
      }
      data.branch = input.branchId
        ? { connect: { id: input.branchId } }
        : { disconnect: true };
    }

    const updated = await this.users.update(id, data);
    return toUserDto(updated);
  }

  async remove(ctx: AuthContext, id: string): Promise<void> {
    authorize(ctx, PERMISSIONS.USER_DELETE);
    if (id === ctx.userId) {
      throw new ForbiddenError('You cannot delete your own account');
    }
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundError('User not found');
    assertBranchAccess(ctx, user.branchId);
    await this.users.delete(id);
  }

  /** Only SUPER_ADMIN may create/assign SUPER_ADMIN or BOSS roles. */
  private assertCanAssignRole(ctx: AuthContext, role: RoleType): void {
    if (isGlobalRole(ctx.roleType)) return;
    if (role === RoleType.SUPER_ADMIN || role === RoleType.BOSS) {
      throw new ForbiddenError('You cannot assign this role');
    }
  }

  /** Scoped roles always write into their own branch; globals choose freely. */
  private resolveBranchForWrite(
    ctx: AuthContext,
    role: RoleType,
    requestedBranchId: string | null,
  ): string | null {
    if (isGlobalRole(ctx.roleType)) {
      // SUPER_ADMIN users are global and must not be tied to a branch.
      return role === RoleType.SUPER_ADMIN ? null : requestedBranchId;
    }
    if (!ctx.branchId) {
      throw new ForbiddenError('Your account is not assigned to a branch');
    }
    return ctx.branchId;
  }
}
