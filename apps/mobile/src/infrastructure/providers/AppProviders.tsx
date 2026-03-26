import { QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';

import { DevSessionProvider } from '../../features/dev-session/DevSessionProvider';
import { getQueryClient } from '../query/query-client';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <DevSessionProvider>{children}</DevSessionProvider>
    </QueryClientProvider>
  );
}
