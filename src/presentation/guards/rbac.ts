import { ForbiddenError } from '@/core/errors/app-error';
import { isGlobalRole } from '@/core/constants/roles';
import type { AuthContext } from '@/core/types/auth';
import type { PermissionKey } from '@/core/constants/permissions';

/** SUPER_ADMIN bypasses all checks; others must hold the permission key. */
export function authorize(ctx: AuthContext, permission: PermissionKey): void {
  if (ctx.roleType === 'SUPER_ADMIN') return;
  if (!ctx.permissions.includes(permission)) {
    throw new ForbiddenError(`Missing permission: ${permission}`);
  }
}

export function authorizeAny(
  ctx: AuthContext,
  permissions: PermissionKey[],
): void {
  if (ctx.roleType === 'SUPER_ADMIN') return;
  const has = permissions.some((p) => ctx.permissions.includes(p));
  if (!has) {
    throw new ForbiddenError(
      `Missing one of permissions: ${permissions.join(', ')}`,
    );
  }
}

/**
 * Enforces branch-level data isolation. Global roles see everything;
 * scoped roles may only touch resources in their own branch.
 */
export function assertBranchAccess(
  ctx: AuthContext,
  targetBranchId: string | null,
): void {
  if (isGlobalRole(ctx.roleType)) return;
  if (!ctx.branchId) {
    throw new ForbiddenError('Your account is not assigned to a branch');
  }
  if (targetBranchId !== null && targetBranchId !== ctx.branchId) {
    throw new ForbiddenError('Resource belongs to a different branch');
  }
}

/** Returns the branch filter to apply for list queries based on the role. */
export function branchScopeFilter(ctx: AuthContext): string | undefined {
  return isGlobalRole(ctx.roleType) ? undefined : (ctx.branchId ?? '__none__');
}
