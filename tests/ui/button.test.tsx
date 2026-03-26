import { desertLightTheme, springLightTheme } from '@maayanhot/design-tokens';
import { Button } from '@maayanhot/ui';
import { StyleSheet } from 'react-native';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderWithTheme } from './render-with-theme';

vi.mock('react-native', async () => import('../mocks/react-native'));

type ButtonStyleShape = {
  backgroundColor?: string;
  opacity?: number;
};

afterEach(async () => {
  const { cleanup } = await import('@testing-library/react-native');

  cleanup();
});

const getButtonHost = async (testID: string) => {
  const { screen } = await import('@testing-library/react-native');

  return screen.getByTestId(testID);
};

describe('Button', () => {
  it('renders the provided label', async () => {
    const { screen } = await import('@testing-library/react-native');

    await renderWithTheme(<Button label="שלח דיווח" testID="report-button" />);

    expect(screen.getByText('שלח דיווח')).toBeDefined();
  });

  it('applies semantic variant styling and changes centrally when the theme object changes', async () => {
    const springRender = await renderWithTheme(
      <Button label="עדכון" testID="spring-button" variant="primary" />,
      {
        theme: springLightTheme,
      },
    );

    const springStyle = StyleSheet.flatten(
      (await getButtonHost('spring-button'))?.props.style,
    ) as ButtonStyleShape;

    springRender.unmount();

    await renderWithTheme(<Button label="עדכון" testID="desert-button" variant="primary" />, {
      theme: desertLightTheme,
    });

    const desertStyle = StyleSheet.flatten(
      (await getButtonHost('desert-button'))?.props.style,
    ) as ButtonStyleShape;

    expect(springStyle.backgroundColor).toBe(springLightTheme.action.primary.bg);
    expect(desertStyle.backgroundColor).toBe(desertLightTheme.action.primary.bg);
    expect(desertStyle.backgroundColor).not.toBe(springStyle.backgroundColor);
  });

  it('marks disabled buttons semantically and visually', async () => {
    await renderWithTheme(
      <Button disabled label="שמירה מושבתת" testID="disabled-button" variant="secondary" />,
    );

    const host = await getButtonHost('disabled-button');
    const style = StyleSheet.flatten(host?.props.style) as ButtonStyleShape;

    expect(host?.props.accessibilityRole).toBe('button');
    expect(host?.props.accessibilityState).toEqual({ disabled: true });
    expect(style.backgroundColor).toBe(springLightTheme.bg.surfaceMuted);
    expect(style.opacity).toBe(0.6);
  });
});
