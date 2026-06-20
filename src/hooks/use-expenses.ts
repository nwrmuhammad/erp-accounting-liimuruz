'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, buildQuery } from '@/lib/api-client';
import type { Expense, PaginatedResponse, CreateExpenseDto } from '@/types';

interface ExpensesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useExpenses(params: ExpensesParams = {}) {
  return useQuery({
    queryKey: ['expenses', params],
    queryFn: () => apiClient.get<PaginatedResponse<Expense>>(`/expenses${buildQuery(params)}`),
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateExpenseDto) => apiClient.post<Expense>('/expenses', dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useUpdateExpense(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<CreateExpenseDto>) => apiClient.patch<Expense>(`/expenses/${id}`, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/expenses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
