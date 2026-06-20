import type { RoleType } from '@prisma/client';

/** Decoded access-token claims attached to every authenticated request. */
export interface AuthContext {
  userId: string;
  email: string;
  roleType: RoleType;
  branchId: string | null;
  sessionId: string;
  permissions: string[];
}

/** Standard paginated list result returned by services. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}
