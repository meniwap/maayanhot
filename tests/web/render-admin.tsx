// @vitest-environment jsdom

import type { UserRole } from '@maayanhot/contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { PropsWithChildren, ReactElement } from 'react';

import {
  AdminSessionContext,
  type AdminSessionSnapshot,
} from '../../apps/admin-web/src/infrastructure/session/AdminSessionProvider';

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
    snapshot = makeSnapshot(),
    signIn = async () => undefined,
    signOut = async () => undefined,
  }: {
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

  const Wrapper = ({ children }: PropsWithChildren) => (
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
  );

  return {
    ...render(ui, { wrapper: Wrapper }),
    queryClient,
  };
};
