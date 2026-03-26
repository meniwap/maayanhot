import type { SpaceToken } from '@maayanhot/design-tokens';
import type { PropsWithChildren } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTokens } from '../theme-context';

type ScreenTone = 'canvas' | 'surface';

export type ScreenProps = PropsWithChildren<{
  background?: ScreenTone;
  contentStyle?: StyleProp<ViewStyle>;
  gap?: SpaceToken;
  padding?: SpaceToken;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}>;

export function Screen({
  background = 'canvas',
  children,
  contentStyle,
  gap = '5',
  padding = '4',
  scrollable = false,
  style,
  testID,
}: ScreenProps) {
  const tokens = useTokens();
  const containerStyle = {
    backgroundColor: tokens.bg[background],
    flex: 1,
  } satisfies ViewStyle;
  const innerStyle = {
    flexGrow: 1,
    gap: tokens.space[gap],
    paddingHorizontal: tokens.space[padding],
    paddingVertical: tokens.space['6'],
  } satisfies ViewStyle;

  if (scrollable) {
    return (
      <ScrollView
        contentContainerStyle={[innerStyle, contentStyle]}
        style={[containerStyle, style]}
        testID={testID}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[containerStyle, innerStyle, style, contentStyle]} testID={testID}>
      {children}
    </View>
  );
}
