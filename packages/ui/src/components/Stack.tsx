import type { SpaceToken } from '@maayanhot/design-tokens';
import type { PropsWithChildren } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme, type LogicalCrossAlign } from '../theme-context';

export type StackProps = PropsWithChildren<{
  align?: LogicalCrossAlign;
  gap?: SpaceToken;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}>;

export function Stack({ align = 'stretch', children, gap = '3', style, testID }: StackProps) {
  const { resolveCrossAlign, theme } = useTheme();

  return (
    <View
      style={[
        {
          alignItems: resolveCrossAlign(align),
          display: 'flex',
          gap: theme.space[gap],
        },
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
}
