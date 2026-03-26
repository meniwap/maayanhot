import type { SpaceToken } from '@maayanhot/design-tokens';
import type { PropsWithChildren } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTokens } from '../theme-context';
import { toElevationStyle } from '../style-helpers';

export type CardProps = PropsWithChildren<{
  padding?: SpaceToken;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  variant?: 'default' | 'raised';
}>;

export function Card({ children, padding = '4', style, testID, variant = 'default' }: CardProps) {
  const tokens = useTokens();
  const elevationStyle =
    variant === 'raised'
      ? toElevationStyle(tokens.elevation['1'])
      : toElevationStyle(tokens.elevation['0']);

  return (
    <View
      style={[
        {
          backgroundColor: variant === 'raised' ? tokens.bg.surfaceRaised : tokens.bg.surface,
          borderColor: tokens.border.default,
          borderRadius: tokens.radius.lg,
          borderWidth: 1,
          gap: tokens.space['3'],
          padding: tokens.space[padding],
        },
        elevationStyle,
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
}
