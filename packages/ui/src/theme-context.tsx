import { springLightTheme, type Direction, type ThemeTokens } from '@maayanhot/design-tokens';
import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import type { TextStyle, ViewStyle } from 'react-native';

export type LogicalAlign = 'start' | 'center' | 'end';
export type LogicalCrossAlign = LogicalAlign | 'stretch';
export type InlineJustify = 'start' | 'center' | 'end' | 'between';

export type ThemeContextValue = {
  theme: ThemeTokens;
  setTheme: (theme: ThemeTokens) => void;
  direction: Direction;
  isRTL: boolean;
  inlineDirection: ViewStyle['flexDirection'];
  resolveTextAlign: (align?: LogicalAlign) => TextStyle['textAlign'];
  resolveCrossAlign: (align?: LogicalCrossAlign) => ViewStyle['alignItems'];
  resolveJustify: (justify?: InlineJustify) => ViewStyle['justifyContent'];
};

type ThemeProviderProps = PropsWithChildren<{
  initialTheme?: ThemeTokens;
  direction?: Direction;
}>;

const ThemeContext = createContext<ThemeContextValue | null>(null);

const resolveTextAlignForDirection = (
  direction: Direction,
  align: LogicalAlign = 'start',
): TextStyle['textAlign'] => {
  if (align === 'center') {
    return 'center';
  }

  if (align === 'start') {
    return direction === 'rtl' ? 'right' : 'left';
  }

  return direction === 'rtl' ? 'left' : 'right';
};

const resolveCrossAlignValue = (align: LogicalCrossAlign = 'start'): ViewStyle['alignItems'] => {
  if (align === 'stretch') {
    return 'stretch';
  }

  if (align === 'center') {
    return 'center';
  }

  return align === 'start' ? 'flex-start' : 'flex-end';
};

const resolveJustifyValue = (justify: InlineJustify = 'start'): ViewStyle['justifyContent'] => {
  if (justify === 'center') {
    return 'center';
  }

  if (justify === 'between') {
    return 'space-between';
  }

  return justify === 'start' ? 'flex-start' : 'flex-end';
};

export function ThemeProvider({
  children,
  direction,
  initialTheme = springLightTheme,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeTokens>(initialTheme);
  const activeDirection = direction ?? theme.direction;

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      direction: activeDirection,
      isRTL: activeDirection === 'rtl',
      inlineDirection: activeDirection === 'rtl' ? 'row-reverse' : 'row',
      resolveTextAlign: (align?: LogicalAlign) =>
        resolveTextAlignForDirection(activeDirection, align),
      resolveCrossAlign: (align?: LogicalCrossAlign) => resolveCrossAlignValue(align),
      resolveJustify: (justify?: InlineJustify) => resolveJustifyValue(justify),
    }),
    [activeDirection, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider.');
  }

  return context;
}

export function useTokens() {
  return useTheme().theme;
}
