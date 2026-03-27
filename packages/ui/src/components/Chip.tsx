import type { PropsWithChildren } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTokens } from '../theme-context';
import { AppText } from './AppText';

export type ChipProps = PropsWithChildren<{
  disabled?: boolean;
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  variant?: 'filter' | 'selected' | 'status';
}>;

export function Chip({
  disabled = false,
  label,
  onPress,
  style,
  testID,
  variant = 'filter',
}: ChipProps) {
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

  const content = (
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
      {...(!onPress && testID ? { testID } : {})}
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

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{ opacity: disabled ? 0.6 : 1 }}
      testID={testID}
    >
      {content}
    </Pressable>
  );
}
