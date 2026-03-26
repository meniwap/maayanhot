import type { PropsWithChildren } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTokens } from '../theme-context';
import { AppText } from './AppText';

export type ChipProps = PropsWithChildren<{
  label: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  variant?: 'filter' | 'selected' | 'status';
}>;

export function Chip({ label, style, testID, variant = 'filter' }: ChipProps) {
  const tokens = useTokens();

  const palette =
    variant === 'selected'
      ? tokens.action.primary
      : variant === 'status'
        ? {
            bg: tokens.bg.accent,
            border: tokens.border.default,
            fg: tokens.text.primary,
          }
        : {
            bg: tokens.bg.surface,
            border: tokens.border.default,
            fg: tokens.text.secondary,
          };

  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderRadius: tokens.radius.round,
          borderWidth: 1,
          justifyContent: 'center',
          minHeight: 34,
          paddingHorizontal: tokens.space['3'],
          paddingVertical: tokens.space['2'],
        },
        style,
      ]}
      testID={testID}
    >
      <AppText
        align="center"
        style={{
          color: palette.fg,
        }}
        variant="labelSm"
      >
        {label}
      </AppText>
    </View>
  );
}
