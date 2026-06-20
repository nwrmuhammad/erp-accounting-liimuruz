import type { UserWithRelations } from '@/domain/repositories/user.repository';

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: string;
  roleType: string;
  permissions: string[];
  branch: { id: string; name: string; code: string } | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export function toUserDto(user: UserWithRelations): UserDto {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    status: user.status,
    roleType: user.role.type,
    permissions: user.role.permissions.map((rp) => rp.permission.key),
    branch: user.branch
      ? { id: user.branch.id, name: user.branch.name, code: user.branch.code }
      : null,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}
