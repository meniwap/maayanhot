import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import type { PropsWithChildren } from 'react';

import { DevSessionProvider } from '../../features/dev-session/DevSessionProvider';
import { OfflineReportQueueProvider } from '../offline/OfflineReportQueueProvider';
import { MobileObservabilityProvider } from '../observability/MobileObservabilityProvider';
import { getQueryClient, getQueryPersistenceOptions } from '../query/query-client';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <MobileObservabilityProvider>
      <PersistQueryClientProvider
        client={getQueryClient()}
        persistOptions={getQueryPersistenceOptions()}
      >
        <DevSessionProvider>
          <OfflineReportQueueProvider>{children}</OfflineReportQueueProvider>
        </DevSessionProvider>
      </PersistQueryClientProvider>
    </MobileObservabilityProvider>
  );
}
