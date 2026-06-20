'use client';

import type { PaginatedResponse } from '@/types';

const BASE = '/api';

class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  const json = await res.json();

  if (res.status === 401) {
    const code = json.error?.code ?? 'UNAUTHORIZED';
    if (code === 'UNAUTHORIZED' && typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new ApiError(code, json.error?.message ?? 'Unauthorized', 401);
  }

  if (!json.success) {
    throw new ApiError(
      json.error?.code ?? 'UNKNOWN',
      json.error?.message ?? 'Xatolik yuz berdi',
      res.status,
    );
  }

  return json.data as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T = void>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export { ApiError };

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function buildQuery(params: object): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params) as [string, unknown][]) {
    if (v !== undefined && v !== '' && v !== null) q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}
