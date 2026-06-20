'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, buildQuery } from '@/lib/api-client';

interface KirimItem {
  id: string;
  productName: string | null;
  quantity: number;
  kirimDate: string;
  notes: string | null;
  branch: { id: string; name: string };
  createdBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

interface KirimParams {
  page?: number;
  pageSize?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  branchId?: string;
}

interface CreateKirimDto {
  productName?: string;
  quantity: number;
  kirimDate?: string;
  notes?: string;
  branchId?: string;
}

export type { KirimItem };

export function useKirimList(params: KirimParams = {}) {
  return useQuery({
    queryKey: ['kirim', params],
    queryFn: () => apiClient.get<{ items: KirimItem[]; total: number; page: number; pageSize: number; totalPages: number }>(`/kirim${buildQuery(params)}`),
  });
}

export function useCreateKirim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateKirimDto) => apiClient.post<KirimItem>('/kirim', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kirim'] }),
  });
}

export function useUpdateKirim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateKirimDto> }) =>
      apiClient.patch<KirimItem>(`/kirim/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kirim'] }),
  });
}

export function useDeleteKirim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/kirim/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kirim'] }),
  });
}
