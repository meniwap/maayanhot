import { QueryClient } from '@tanstack/react-query';

let queryClient: QueryClient | null = null;

export const getQueryClient = () => {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: {
          retry: 0,
        },
        queries: {
          refetchOnWindowFocus: false,
          retry: 1,
          staleTime: 30_000,
        },
      },
    });
  }

  return queryClient;
};

export const resetQueryClient = () => {
  queryClient?.clear();
  queryClient = null;
};
