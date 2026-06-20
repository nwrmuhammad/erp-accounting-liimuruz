'use client';

const BASE = '/api';

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
    const code = json.error?.code;
    if (code === 'UNAUTHORIZED' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error(json.error?.message ?? 'Unauthorized');
  }

  if (!json.success) {
    throw new Error(json.error?.message ?? 'Xatolik yuz berdi');
  }

  return json.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del: (path: string) => request(path, { method: 'DELETE' }),
};
