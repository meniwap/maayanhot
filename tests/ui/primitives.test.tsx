import { AppText, Inline, Stack, StatusBadge } from '@maayanhot/ui';
import { StyleSheet } from 'react-native';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderWithTheme } from './render-with-theme';

vi.mock('react-native', async () => import('../mocks/react-native'));

type PrimitiveStyleShape = {
  backgroundColor?: string;
  color?: string;
  flexDirection?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  gap?: number;
  lineHeight?: number;
};

afterEach(async () => {
  const { cleanup } = await import('@testing-library/react-native');

  cleanup();
});

describe('shared UI primitives', () => {
  it('maps AppText variants to tokenized typography styles', async () => {
    const { screen } = await import('@testing-library/react-native');

    await renderWithTheme(
      <AppText testID="title" tone="secondary" variant="titleLg">
        כותרת
      </AppText>,
    );

    const style = StyleSheet.flatten(
      screen.getByTestId('title').props.style,
    ) as PrimitiveStyleShape;

    expect(style.fontFamily).toBe('Heebo');
    expect(style.fontSize).toBe(22);
    expect(style.lineHeight).toBe(28);
    expect(style.fontWeight).toBe('600');
    expect(style.color).toBe('#556252');
  });

  it('uses token-based spacing in Stack', async () => {
    const { screen } = await import('@testing-library/react-native');

    await renderWithTheme(
      <Stack gap="4" testID="stack">
        <AppText>אחד</AppText>
        <AppText>שתיים</AppText>
      </Stack>,
    );

    const style = StyleSheet.flatten(
      screen.getByTestId('stack').props.style,
    ) as PrimitiveStyleShape;

    expect(style.gap).toBe(16);
  });

  it('uses logical inline direction helpers instead of hardcoded left-right assumptions', async () => {
    const { screen } = await import('@testing-library/react-native');

    const rtlRender = await renderWithTheme(
      <Inline testID="inline-rtl">
        <AppText>א</AppText>
        <AppText>ב</AppText>
      </Inline>,
    );

    const rtlStyle = StyleSheet.flatten(
      screen.getByTestId('inline-rtl').props.style,
    ) as PrimitiveStyleShape;

    expect(rtlStyle.flexDirection).toBe('row-reverse');

    rtlRender.unmount();

    await renderWithTheme(
      <Inline testID="inline-ltr">
        <AppText>A</AppText>
        <AppText>B</AppText>
      </Inline>,
      { direction: 'ltr' },
    );

    const ltrStyle = StyleSheet.flatten(
      screen.getByTestId('inline-ltr').props.style,
    ) as PrimitiveStyleShape;

    expect(ltrStyle.flexDirection).toBe('row');
  });

  it.each([
    ['water', 'יש מים', '#D6F0E5'],
    ['noWater', 'אין מים', '#F0D8CF'],
    ['unknown', 'לא ידוע', '#E8F2F6'],
    ['stale', 'דיווח ישן', '#F3E4BF'],
    ['pending', 'ממתין לאישור', '#EEE7D7'],
  ] as const)(
    'renders the %s status badge with semantic token styling',
    async (status, label, backgroundColor) => {
      const { screen } = await import('@testing-library/react-native');

      await renderWithTheme(<StatusBadge status={status} testID={`badge-${status}`} />);

      const style = StyleSheet.flatten(
        screen.getByTestId(`badge-${status}`).props.style,
      ) as PrimitiveStyleShape;

      expect(screen.getByText(label)).toBeDefined();
      expect(style.backgroundColor).toBe(backgroundColor);
    },
  );
});
