import type { StatusVariantToken } from '@maayanhot/design-tokens';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTokens } from '../theme-context';
import { AppText } from './AppText';

const defaultLabels: Record<StatusVariantToken, string> = {
  water: 'יש מים',
  noWater: 'אין מים',
  unknown: 'לא ידוע',
  stale: 'דיווח ישן',
  pending: 'ממתין לאישור',
};

export type StatusBadgeProps = {
  label?: string;
  status: StatusVariantToken;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function StatusBadge({ label, status, style, testID }: StatusBadgeProps) {
  const tokens = useTokens();
  const palette = tokens.status[status];

  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderRadius: tokens.radius.round,
          borderWidth: 1,
          minHeight: 32,
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
        {label ?? defaultLabels[status]}
      </AppText>
    </View>
  );
}
