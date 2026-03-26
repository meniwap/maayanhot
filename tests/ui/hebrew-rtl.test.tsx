import { AppText, Inline, Screen } from '@maayanhot/ui';
import { StyleSheet } from 'react-native';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderWithTheme } from './render-with-theme';

vi.mock('react-native', async () => import('../mocks/react-native'));

type LayoutStyleShape = {
  flexDirection?: string;
  textAlign?: string;
};

afterEach(async () => {
  const { cleanup } = await import('@testing-library/react-native');

  cleanup();
});

describe('RTL and Hebrew smoke checks', () => {
  it('renders Hebrew-first content with logical alignment primitives', async () => {
    const { screen } = await import('@testing-library/react-native');

    await renderWithTheme(
      <Screen scrollable testID="screen">
        <Inline justify="between" testID="meta-row">
          <AppText align="start" testID="hebrew-copy">
            עדכון אחרון מהשטח
          </AppText>
          <AppText tone="muted">Last report pending</AppText>
        </Inline>
      </Screen>,
    );

    const inlineStyle = StyleSheet.flatten(
      screen.getByTestId('meta-row').props.style,
    ) as LayoutStyleShape;
    const textStyle = StyleSheet.flatten(
      screen.getByTestId('hebrew-copy').props.style,
    ) as LayoutStyleShape;

    expect(screen.getByText('עדכון אחרון מהשטח')).toBeDefined();
    expect(screen.getByText('Last report pending')).toBeDefined();
    expect(inlineStyle.flexDirection).toBe('row-reverse');
    expect(textStyle.textAlign).toBe('right');
  });
});
