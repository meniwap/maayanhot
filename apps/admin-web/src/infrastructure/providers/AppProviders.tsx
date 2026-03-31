'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';

import { AdminWebObservabilityProvider } from '../observability/AdminWebObservabilityProvider';
import { getAdminWebQueryClient } from '../query/query-client';
import { AdminSessionProvider } from '../session/AdminSessionProvider';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AdminWebObservabilityProvider>
      <QueryClientProvider client={getAdminWebQueryClient()}>
        <AdminSessionProvider>{children}</AdminSessionProvider>
      </QueryClientProvider>
    </AdminWebObservabilityProvider>
  );
}
