'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, buildQuery } from '@/lib/api-client';
import type {
  InventoryMovement, StockSummary,
  InventoryMovementType, PaginatedResponse, CreateInventoryMovementDto,
} from '@/types';

interface InventoryParams {
  page?: number;
  pageSize?: number;
  type?: InventoryMovementType;
  productId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useInventory(params: InventoryParams = {}) {
  return useQuery({
    queryKey: ['inventory', params],
    queryFn: () =>
      apiClient.get<PaginatedResponse<InventoryMovement>>(
        `/inventory${buildQuery(params)}`,
      ),
  });
}

export function useStockSummary(params: { productId?: string } = {}) {
  return useQuery({
    queryKey: ['inventory-stock', params],
    queryFn: () =>
      apiClient.get<StockSummary[]>(`/inventory/stock${buildQuery(params)}`),
  });
}

export function useCreateInventoryMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateInventoryMovementDto) =>
      apiClient.post<InventoryMovement>('/inventory', dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['inventory-stock'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
