import { springLightTheme, type Direction, type ThemeTokens } from '@maayanhot/design-tokens';
import { ThemeProvider } from '@maayanhot/ui';
import type { RenderOptions } from '@testing-library/react-native';
import type { ReactElement } from 'react';

type RenderWithThemeOptions = Omit<RenderOptions, 'wrapper'> & {
  direction?: Direction;
  theme?: ThemeTokens;
};

export const renderWithTheme = async (ui: ReactElement, options: RenderWithThemeOptions = {}) => {
  const theme = options.theme ?? springLightTheme;
  const direction = options.direction ?? theme.direction;
  const { render } = await import('@testing-library/react-native');

  return render(
    <ThemeProvider direction={direction} initialTheme={theme}>
      {ui}
    </ThemeProvider>,
  );
};
