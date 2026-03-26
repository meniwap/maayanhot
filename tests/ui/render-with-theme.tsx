import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { springLightTheme, type Direction, type ThemeTokens } from '@maayanhot/design-tokens';
import { ThemeProvider } from '@maayanhot/ui';
import type { RenderOptions } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import {
  DevSessionContext,
  type DevSessionSnapshot,
} from '../../apps/mobile/src/features/dev-session/DevSessionProvider';

type RenderWithThemeOptions = Omit<RenderOptions, 'wrapper'> & {
  direction?: Direction;
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
          {ui}
        </DevSessionContext.Provider>
      </QueryClientProvider>
    </ThemeProvider>,
  );
};
