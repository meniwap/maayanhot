import type { SpaceToken } from '@maayanhot/design-tokens';
import type { PropsWithChildren } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme, type InlineJustify, type LogicalCrossAlign } from '../theme-context';

export type InlineProps = PropsWithChildren<{
  align?: LogicalCrossAlign;
  gap?: SpaceToken;
  justify?: InlineJustify;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  wrap?: boolean;
}>;

export function Inline({
  align = 'center',
  children,
  gap = '2',
  justify = 'start',
  style,
  testID,
  wrap = false,
}: InlineProps) {
  const { inlineDirection, resolveCrossAlign, resolveJustify, theme } = useTheme();

  return (
    <View
      style={[
        {
          alignItems: resolveCrossAlign(align),
          display: 'flex',
          flexDirection: inlineDirection,
          flexWrap: wrap ? 'wrap' : 'nowrap',
          gap: theme.space[gap],
          justifyContent: resolveJustify(justify),
        },
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
}
