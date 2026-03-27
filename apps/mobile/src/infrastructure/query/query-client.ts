import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

let queryClient: QueryClient | null = null;
let queryCachePersister: ReturnType<typeof createAsyncStoragePersister> | null = null;

const shouldPersistQuery = (queryKey: readonly unknown[]) => {
  const [head] = queryKey;

  return head === 'public-spring-catalog' || head === 'public-spring-detail';
};

export const getQueryClient = () => {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: {
          retry: 0,
        },
        queries: {
          gcTime: 1000 * 60 * 60 * 24,
          refetchOnWindowFocus: false,
          retry: 1,
          staleTime: 30_000,
        },
      },
    });
  }

  return queryClient;
};

export const getQueryCachePersister = () => {
  if (!queryCachePersister) {
    queryCachePersister = createAsyncStoragePersister({
      key: 'maayanhot:public-read-cache:v1',
      storage: AsyncStorage,
      throttleTime: 1_000,
    });
  }

  return queryCachePersister;
};

export const getQueryPersistenceOptions = () => ({
  buster: 'phase11-public-read-v1',
  dehydrateOptions: {
    shouldDehydrateQuery: (query: { queryKey: readonly unknown[] }) =>
      shouldPersistQuery(query.queryKey),
  },
  maxAge: 1000 * 60 * 60 * 24,
  persister: getQueryCachePersister(),
});

export const resetQueryClient = () => {
  queryClient?.clear();
  queryClient = null;
  queryCachePersister = null;
};
