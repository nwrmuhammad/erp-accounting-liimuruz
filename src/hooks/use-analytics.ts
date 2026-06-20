'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, buildQuery } from '@/lib/api-client';
import type { Analytics } from '@/types';

interface AnalyticsParams {
  branchId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useAnalytics(params: AnalyticsParams = {}) {
  return useQuery({
    queryKey: ['analytics', params],
    queryFn: () => apiClient.get<Analytics>(`/analytics${buildQuery(params)}`),
    staleTime: 60 * 1000,
  });
}
