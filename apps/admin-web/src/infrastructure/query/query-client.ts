'use client';

import { QueryClient } from '@tanstack/react-query';

let queryClient: QueryClient | null = null;

export const getAdminWebQueryClient = () => {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: {
          retry: 0,
        },
        queries: {
          refetchOnWindowFocus: false,
          retry: 1,
          staleTime: 15_000,
        },
      },
    });
  }

  return queryClient;
};

export const resetAdminWebQueryClient = () => {
  queryClient?.clear();
  queryClient = null;
};
