'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, buildQuery } from '@/lib/api-client';
import type { User, PaginatedResponse } from '@/types';

interface UsersParams { page?: number; pageSize?: number; search?: string; roleType?: string; branchId?: string }

interface CreateUserDto {
  email: string; firstName: string; lastName: string; password: string;
  roleType: string; branchId?: string; phone?: string;
}

export function useUsers(params: UsersParams = {}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => apiClient.get<PaginatedResponse<User>>(`/users${buildQuery(params)}`),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => apiClient.get<User>(`/users/${id}`),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateUserDto) => apiClient.post<User>('/users', dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); },
  });
}

export function useUpdateUser(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<CreateUserDto> & { status?: string }) =>
      apiClient.patch<User>(`/users/${id}`, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/users/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); },
  });
}
