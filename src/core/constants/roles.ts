import { RoleType } from '@prisma/client';

export const ROLE_LABELS: Record<RoleType, string> = {
  SUPER_ADMIN: 'Super Administrator',
  BOSS: 'Branch Boss',
  EMPLOYEE: 'Employee',
};

export const ROLE_DESCRIPTIONS: Record<RoleType, string> = {
  SUPER_ADMIN: 'Full system access across all branches.',
  BOSS: 'Manages users and operations within an assigned branch.',
  EMPLOYEE: 'Operational access limited to an assigned branch.',
};

/** Roles allowed to operate globally (no branch scoping). */
export const GLOBAL_ROLES: RoleType[] = ['SUPER_ADMIN'];

export function isGlobalRole(role: RoleType): boolean {
  return GLOBAL_ROLES.includes(role);
}
