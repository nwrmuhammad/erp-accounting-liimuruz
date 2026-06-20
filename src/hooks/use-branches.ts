'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, buildQuery } from '@/lib/api-client';
import type { Branch, PaginatedResponse } from '@/types';

interface BranchesParams { page?: number; pageSize?: number; search?: string }

interface CreateBranchDto {
  name: string; code: string; address?: string; phone?: string;
}

export function useBranches(params: BranchesParams = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['branches', params],
    queryFn: () => apiClient.get<PaginatedResponse<Branch>>(`/branches${buildQuery(params)}`),
    enabled: options.enabled !== false,
  });
}

export function useBranch(id: string) {
  return useQuery({
    queryKey: ['branches', id],
    queryFn: () => apiClient.get<Branch>(`/branches/${id}`),
    enabled: !!id,
  });
}

export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateBranchDto) => apiClient.post<Branch>('/branches', dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branches'] }); },
  });
}

export function useUpdateBranch(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<CreateBranchDto> & { isActive?: boolean }) =>
      apiClient.patch<Branch>(`/branches/${id}`, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branches'] }); },
  });
}

export function useDeleteBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/branches/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branches'] }); },
  });
}
