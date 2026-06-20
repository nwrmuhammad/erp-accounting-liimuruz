'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, buildQuery } from '@/lib/api-client';

interface ChiqimItem {
  id: string;
  productName: string | null;
  recipient: string;
  responsible: string;
  chiqimDate: string;
  notes: string | null;
  branch: { id: string; name: string };
  createdBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

interface ChiqimParams {
  page?: number;
  pageSize?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  branchId?: string;
}

interface CreateChiqimDto {
  productName?: string;
  recipient: string;
  responsible: string;
  chiqimDate?: string;
  notes?: string;
  branchId?: string;
}

export type { ChiqimItem };

export function useChiqimList(params: ChiqimParams = {}) {
  return useQuery({
    queryKey: ['chiqim', params],
    queryFn: () => apiClient.get<{ items: ChiqimItem[]; total: number; page: number; pageSize: number; totalPages: number }>(`/chiqim${buildQuery(params)}`),
  });
}

export function useCreateChiqim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateChiqimDto) => apiClient.post<ChiqimItem>('/chiqim', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chiqim'] }),
  });
}

export function useUpdateChiqim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateChiqimDto> }) =>
      apiClient.patch<ChiqimItem>(`/chiqim/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chiqim'] }),
  });
}

export function useDeleteChiqim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/chiqim/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chiqim'] }),
  });
}
