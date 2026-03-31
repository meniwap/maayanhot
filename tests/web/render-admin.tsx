// @vitest-environment jsdom

import type { UserRole } from '@maayanhot/contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { PropsWithChildren, ReactElement } from 'react';

import { AdminWebObservabilityContext } from '../../apps/admin-web/src/infrastructure/observability/AdminWebObservabilityProvider';
import {
  AdminSessionContext,
  type AdminSessionSnapshot,
} from '../../apps/admin-web/src/infrastructure/session/AdminSessionProvider';
import { createNoopObservability } from '@maayanhot/observability-core';

const makeSnapshot = (overrides: Partial<AdminSessionSnapshot> = {}): AdminSessionSnapshot => ({
  email: null,
  isConfigured: true,
  primaryRole: null,
  roleSet: [],
  status: 'anonymous',
  userId: null,
  ...overrides,
});

export const createAuthenticatedSnapshot = (
  primaryRole: UserRole,
  roleSet: UserRole[] = [primaryRole],
): AdminSessionSnapshot =>
  makeSnapshot({
    email: `${primaryRole}@maayanhot.test`,
    primaryRole,
    roleSet,
    status: 'authenticated',
    userId: `${primaryRole}-user`,
  });

export const renderAdmin = (
  ui: ReactElement,
  {
    observability = createNoopObservability(),
    seedQueryData = [],
    snapshot = makeSnapshot(),
    signIn = async () => undefined,
    signOut = async () => undefined,
  }: {
    observability?: ReturnType<typeof createNoopObservability>;
    seedQueryData?: Array<{
      data: unknown;
      queryKey: readonly unknown[];
    }>;
    snapshot?: AdminSessionSnapshot;
    signIn?: (email: string, password: string) => Promise<void>;
    signOut?: () => Promise<void>;
  } = {},
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
      queries: {
        retry: false,
      },
    },
  });
  for (const entry of seedQueryData) {
    queryClient.setQueryData(entry.queryKey, entry.data);
  }

  const Wrapper = ({ children }: PropsWithChildren) => (
    <AdminWebObservabilityContext.Provider value={observability}>
      <QueryClientProvider client={queryClient}>
        <AdminSessionContext.Provider
          value={{
            signIn,
            signOut,
            snapshot,
          }}
        >
          {children}
        </AdminSessionContext.Provider>
      </QueryClientProvider>
    </AdminWebObservabilityContext.Provider>
  );

  return {
    ...render(ui, { wrapper: Wrapper }),
    queryClient,
  };
};
