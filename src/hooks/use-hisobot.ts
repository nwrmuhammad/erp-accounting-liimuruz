'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, buildQuery } from '@/lib/api-client';
import type { SaleStatus, CurrencyType, PaymentType, OnlineReceiver } from '@/types';

export interface HisobotSaleItem {
  id: string;
  productName: string | null;
  quantity: number | null;
  totalAmount: number;
  currency: CurrencyType;
  paymentType: PaymentType;
  onlineReceiver: OnlineReceiver | null;
  status: SaleStatus;
  puliOlindi: boolean;
  notes: string | null;
  saleDate: string;
  branchName: string;
  createdByName: string;
}

export interface HisobotGroup {
  date: string;
  totalUzs: number;
  totalUsd: number;
  count: number;
  items: HisobotSaleItem[];
}

interface HisobotParams {
  branchId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

interface HisobotResponse {
  groups: HisobotGroup[];
  total: number;
  page: number;
  pageSize: number;
}

export function useHisobot(params: HisobotParams = {}) {
  return useQuery({
    queryKey: ['hisobot', params],
    queryFn: () => apiClient.get<HisobotResponse>(`/hisobot${buildQuery(params)}`),
  });
}
