'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, buildQuery } from '@/lib/api-client';
import type { Sale, PaginatedResponse, CreateSaleDto, PaymentType, OnlineReceiver } from '@/types';

interface SalesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  paymentType?: PaymentType;
  onlineReceiver?: OnlineReceiver;
  dateFrom?: string;
  dateTo?: string;
  mode?: 'active' | 'all';
}

export function useSales(params: SalesParams = {}) {
  return useQuery({
    queryKey: ['sales', params],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Sale>>(`/sales${buildQuery(params)}`),
  });
}

export function useSale(id: string) {
  return useQuery({
    queryKey: ['sales', id],
    queryFn: () => apiClient.get<Sale>(`/sales/${id}`),
    enabled: !!id,
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSaleDto) => apiClient.post<Sale>('/sales', dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useUpdateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateSaleDto> & { status?: string; puliOlindi?: boolean } }) =>
      apiClient.patch<Sale>(`/sales/${id}`, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useDeleteSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/sales/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
