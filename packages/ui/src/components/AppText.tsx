import { type TextToneToken, type TypographyVariantToken } from '@maayanhot/design-tokens';
import type { PropsWithChildren } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';

import { useTheme, type LogicalAlign } from '../theme-context';
import { toTextVariantStyle } from '../style-helpers';

export type AppTextProps = PropsWithChildren<{
  align?: LogicalAlign;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
  testID?: string;
  tone?: TextToneToken;
  variant?: TypographyVariantToken;
}>;

export function AppText({
  align = 'start',
  children,
  numberOfLines,
  style,
  testID,
  tone = 'primary',
  variant = 'bodyMd',
}: AppTextProps) {
  const { resolveTextAlign, theme } = useTheme();
  const typographyStyle = toTextVariantStyle(theme, theme.typography.scale[variant]);

  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        typographyStyle,
        {
          color: theme.text[tone],
          textAlign: resolveTextAlign(align),
        },
        style,
      ]}
      testID={testID}
    >
      {children}
    </Text>
  );
}
