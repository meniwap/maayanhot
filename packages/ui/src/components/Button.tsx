import type { ActionVariantToken } from '@maayanhot/design-tokens';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable } from 'react-native';

import { useTokens } from '../theme-context';
import { AppText } from './AppText';

export type ButtonProps = {
  disabled?: boolean;
  label: string;
  onPress?: () => void;
  stretch?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  variant?: ActionVariantToken;
};

export function Button({
  disabled = false,
  label,
  onPress,
  stretch = false,
  style,
  testID,
  variant = 'primary',
}: ButtonProps) {
  const tokens = useTokens();
  const palette = tokens.action[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        {
          alignItems: 'center',
          backgroundColor: disabled ? tokens.bg.surfaceMuted : palette.bg,
          borderColor: disabled ? tokens.border.subtle : palette.border,
          borderRadius: tokens.radius.round,
          borderWidth: variant === 'ghost' ? 0 : 1,
          justifyContent: 'center',
          minHeight: 48,
          opacity: disabled ? 0.6 : 1,
          paddingHorizontal: tokens.space['4'],
          paddingVertical: tokens.space['3'],
          width: stretch ? '100%' : undefined,
        },
        style,
      ]}
      testID={testID}
    >
      <AppText
        align="center"
        style={{
          color: disabled ? tokens.text.muted : palette.fg,
        }}
        variant="labelMd"
      >
        {label}
      </AppText>
    </Pressable>
  );
}
