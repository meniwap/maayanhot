import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { springLightTheme, type Direction, type ThemeTokens } from '@maayanhot/design-tokens';
import { ThemeProvider } from '@maayanhot/ui';
import type { RenderOptions } from '@testing-library/react-native';
import type { ContextType, ReactElement } from 'react';

import {
  DevSessionContext,
  type DevSessionSnapshot,
} from '../../apps/mobile/src/features/dev-session/DevSessionProvider';
import { OfflineReportQueueContext } from '../../apps/mobile/src/infrastructure/offline/OfflineReportQueueProvider';
import type { OfflineReportQueueSnapshot } from '../../apps/mobile/src/infrastructure/offline/offline-report-queue';

type RenderWithThemeOptions = Omit<RenderOptions, 'wrapper'> & {
  direction?: Direction;
  offlineQueueSnapshot?: Partial<OfflineReportQueueSnapshot>;
  offlineQueueValue?: Partial<ContextType<typeof OfflineReportQueueContext>>;
  seedQueryData?: Array<{
    data: unknown;
    queryKey: readonly unknown[];
  }>;
  sessionSnapshot?: Partial<DevSessionSnapshot>;
  theme?: ThemeTokens;
};

export const renderWithTheme = async (ui: ReactElement, options: RenderWithThemeOptions = {}) => {
  const theme = options.theme ?? springLightTheme;
  const direction = options.direction ?? theme.direction;
  const { render } = await import('@testing-library/react-native');
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: {
        retry: 0,
      },
      queries: {
        retry: 0,
      },
    },
  });
  for (const entry of options.seedQueryData ?? []) {
    queryClient.setQueryData(entry.queryKey, entry.data);
  }
  const sessionSnapshot: DevSessionSnapshot = {
    email: null,
    isConfigured: true,
    isDevSessionEnabled: true,
    primaryRole: null,
    roleSet: [],
    status: 'anonymous',
    userId: null,
    ...options.sessionSnapshot,
  };
  const offlineQueueSnapshot: OfflineReportQueueSnapshot = {
    activeUserId: sessionSnapshot.userId,
    isAppActive: true,
    isHydrated: true,
    isOnline: true,
    items: [],
    recentDeliveries: [],
    ...options.offlineQueueSnapshot,
  };
  const offlineQueueValue: ContextType<typeof OfflineReportQueueContext> = {
    discardPreparedAttachment: async () => undefined,
    discardQueuedReport: async () => undefined,
    prepareAttachment: async (asset) => asset,
    retryQueuedReport: async () => undefined,
    snapshot: offlineQueueSnapshot,
    submitDraft: async () => ({
      feedback: 'report-pending',
      queueId: 'queue-1',
      reportId: 'report-1',
      status: 'submitted',
    }),
    ...options.offlineQueueValue,
  };

  return render(
    <ThemeProvider direction={direction} initialTheme={theme}>
      <QueryClientProvider client={queryClient}>
        <DevSessionContext.Provider
          value={{
            signInAsDemoAdmin: async () => undefined,
            signInAsDemoUser: async () => undefined,
            signOut: async () => undefined,
            snapshot: sessionSnapshot,
          }}
        >
          <OfflineReportQueueContext.Provider value={offlineQueueValue}>
            {ui}
          </OfflineReportQueueContext.Provider>
        </DevSessionContext.Provider>
      </QueryClientProvider>
    </ThemeProvider>,
  );
};
