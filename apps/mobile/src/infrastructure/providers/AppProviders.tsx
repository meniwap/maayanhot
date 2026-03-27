import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import type { PropsWithChildren } from 'react';

import { DevSessionProvider } from '../../features/dev-session/DevSessionProvider';
import { OfflineReportQueueProvider } from '../offline/OfflineReportQueueProvider';
import { getQueryClient, getQueryPersistenceOptions } from '../query/query-client';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <PersistQueryClientProvider
      client={getQueryClient()}
      persistOptions={getQueryPersistenceOptions()}
    >
      <DevSessionProvider>
        <OfflineReportQueueProvider>{children}</OfflineReportQueueProvider>
      </DevSessionProvider>
    </PersistQueryClientProvider>
  );
}
