import { QueryClient } from '@tanstack/react-query';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        retry: (failureCount, error) => {
          if ((error as { status?: number })?.status === 401) return false;
          return failureCount < 2;
        },
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
