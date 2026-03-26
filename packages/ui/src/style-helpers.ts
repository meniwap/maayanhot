import type {
  ElevationScaleToken,
  ThemeTokens,
  TypographyScaleToken,
} from '@maayanhot/design-tokens';
import type { TextStyle, ViewStyle } from 'react-native';

export const toElevationStyle = (
  token: ElevationScaleToken,
): Pick<
  ViewStyle,
  'elevation' | 'shadowColor' | 'shadowOpacity' | 'shadowRadius' | 'shadowOffset'
> => ({
  elevation: token.elevation,
  shadowColor: token.shadowColor,
  shadowOpacity: token.shadowOpacity,
  shadowRadius: token.shadowRadius,
  shadowOffset: {
    width: token.shadowOffsetX,
    height: token.shadowOffsetY,
  },
});

export const toTextVariantStyle = (
  theme: ThemeTokens,
  scale: TypographyScaleToken,
): Pick<TextStyle, 'fontFamily' | 'fontSize' | 'fontWeight' | 'letterSpacing' | 'lineHeight'> => ({
  fontFamily: theme.typography.fontFamily[scale.fontFamilyRole],
  fontSize: scale.fontSize,
  fontWeight: scale.fontWeight,
  letterSpacing: scale.letterSpacing,
  lineHeight: scale.lineHeight,
});
