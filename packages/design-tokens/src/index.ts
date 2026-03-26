export const seedPalette = {
  stone950: '#182018',
  stone800: '#2E3A2D',
  stone600: '#556252',
  sand50: '#F6F3E8',
  sand100: '#EEE7D7',
  sand200: '#E0D2B4',
  water700: '#1F6F8B',
  water500: '#3D9BB6',
  water100: '#D8EEF3',
  spring600: '#2E8B62',
  spring100: '#D6F0E5',
  amber600: '#B27A16',
  amber100: '#F3E4BF',
  clay700: '#9E5A3C',
  clay100: '#F0D8CF',
  danger700: '#B33A2C',
  danger100: '#F6D6D1',
  sky100: '#E8F2F6',
} as const;

export type Direction = 'rtl' | 'ltr';
export type ThemeId = 'spring-light' | 'desert-light';
export type TextToneToken = 'primary' | 'secondary' | 'muted' | 'inverse' | 'link';
export type ActionVariantToken = 'primary' | 'secondary' | 'ghost' | 'danger';
export type StatusVariantToken = 'water' | 'noWater' | 'unknown' | 'stale' | 'pending';
export type SpaceToken = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '8' | '10' | '12';
export type RadiusToken = 'sm' | 'md' | 'lg' | 'xl' | 'round';
export type ElevationToken = '0' | '1' | '2' | '3';
export type IconToken = 'sm' | 'md' | 'lg' | 'xl';
export type FontWeightToken = '400' | '500' | '600' | '700';
export type TypographyVariantToken =
  | 'displayLg'
  | 'displayMd'
  | 'titleLg'
  | 'titleMd'
  | 'bodyLg'
  | 'bodyMd'
  | 'bodySm'
  | 'labelMd'
  | 'labelSm';

export type SemanticTone = {
  bg: string;
  fg: string;
  border: string;
};

export type TypographyScaleToken = {
  fontFamilyRole: 'display' | 'body';
  fontSize: number;
  lineHeight: number;
  fontWeight: FontWeightToken;
  letterSpacing: number;
};

export type ElevationScaleToken = {
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  elevation: number;
};

export type ThemeTokens = {
  id: ThemeId;
  name: string;
  direction: Direction;
  seedPalette: typeof seedPalette;
  bg: {
    canvas: string;
    surface: string;
    surfaceRaised: string;
    surfaceMuted: string;
    accent: string;
  };
  text: Record<TextToneToken, string>;
  border: {
    subtle: string;
    default: string;
    strong: string;
  };
  action: Record<ActionVariantToken, SemanticTone>;
  status: Record<StatusVariantToken, SemanticTone>;
  feedback: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  typography: {
    fontFamily: {
      display: string;
      body: string;
    };
    fontWeight: {
      regular: FontWeightToken;
      medium: FontWeightToken;
      semibold: FontWeightToken;
      bold: FontWeightToken;
    };
    scale: Record<TypographyVariantToken, TypographyScaleToken>;
  };
  space: Record<SpaceToken, number>;
  radius: Record<RadiusToken, number>;
  elevation: Record<ElevationToken, ElevationScaleToken>;
  icon: Record<IconToken, number>;
};

export const spacingScale: Record<SpaceToken, number> = {
  '0': 0,
  '1': 4,
  '2': 8,
  '3': 12,
  '4': 16,
  '5': 20,
  '6': 24,
  '8': 32,
  '10': 40,
  '12': 48,
};

export const radiusScale: Record<RadiusToken, number> = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  round: 999,
};

export const elevationScale: Record<ElevationToken, ElevationScaleToken> = {
  '0': {
    shadowColor: '#000000',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    elevation: 0,
  },
  '1': {
    shadowColor: '#182018',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffsetX: 0,
    shadowOffsetY: 4,
    elevation: 2,
  },
  '2': {
    shadowColor: '#182018',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffsetX: 0,
    shadowOffsetY: 8,
    elevation: 4,
  },
  '3': {
    shadowColor: '#182018',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffsetX: 0,
    shadowOffsetY: 12,
    elevation: 6,
  },
};

export const iconScale: Record<IconToken, number> = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export const typographyScale: ThemeTokens['typography'] = {
  fontFamily: {
    display: 'Heebo',
    body: 'Heebo',
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  scale: {
    displayLg: {
      fontFamilyRole: 'display',
      fontSize: 34,
      lineHeight: 40,
      fontWeight: '700',
      letterSpacing: -0.5,
    },
    displayMd: {
      fontFamilyRole: 'display',
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '700',
      letterSpacing: -0.35,
    },
    titleLg: {
      fontFamilyRole: 'display',
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    titleMd: {
      fontFamilyRole: 'display',
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '600',
      letterSpacing: -0.1,
    },
    bodyLg: {
      fontFamilyRole: 'body',
      fontSize: 17,
      lineHeight: 24,
      fontWeight: '400',
      letterSpacing: 0,
    },
    bodyMd: {
      fontFamilyRole: 'body',
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '400',
      letterSpacing: 0,
    },
    bodySm: {
      fontFamilyRole: 'body',
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '400',
      letterSpacing: 0,
    },
    labelMd: {
      fontFamilyRole: 'body',
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '500',
      letterSpacing: 0.1,
    },
    labelSm: {
      fontFamilyRole: 'body',
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500',
      letterSpacing: 0.15,
    },
  },
};

const baseTheme = {
  direction: 'rtl' as const,
  seedPalette,
  typography: typographyScale,
  space: spacingScale,
  radius: radiusScale,
  elevation: elevationScale,
  icon: iconScale,
};

export const springLightTheme: ThemeTokens = {
  ...baseTheme,
  id: 'spring-light',
  name: 'Spring Light',
  bg: {
    canvas: seedPalette.sand50,
    surface: '#FFFDFC',
    surfaceRaised: '#FFFFFF',
    surfaceMuted: seedPalette.sand100,
    accent: seedPalette.water100,
  },
  text: {
    primary: seedPalette.stone950,
    secondary: seedPalette.stone600,
    muted: '#70806E',
    inverse: '#FFFFFF',
    link: seedPalette.water700,
  },
  border: {
    subtle: '#D7CFBD',
    default: '#BDB59F',
    strong: seedPalette.stone800,
  },
  action: {
    primary: {
      bg: seedPalette.water700,
      fg: '#FFFFFF',
      border: seedPalette.water700,
    },
    secondary: {
      bg: seedPalette.water100,
      fg: seedPalette.water700,
      border: '#9ACCDC',
    },
    ghost: {
      bg: 'transparent',
      fg: seedPalette.water700,
      border: 'transparent',
    },
    danger: {
      bg: seedPalette.danger100,
      fg: seedPalette.danger700,
      border: '#E4A39A',
    },
  },
  status: {
    water: {
      bg: seedPalette.spring100,
      fg: seedPalette.spring600,
      border: '#9ED3BF',
    },
    noWater: {
      bg: seedPalette.clay100,
      fg: seedPalette.clay700,
      border: '#D8AA98',
    },
    unknown: {
      bg: seedPalette.sky100,
      fg: seedPalette.stone800,
      border: '#B7D3DE',
    },
    stale: {
      bg: seedPalette.amber100,
      fg: seedPalette.amber600,
      border: '#DABB78',
    },
    pending: {
      bg: seedPalette.sand100,
      fg: seedPalette.stone800,
      border: '#CDBFA0',
    },
  },
  feedback: {
    success: seedPalette.spring600,
    warning: seedPalette.amber600,
    error: seedPalette.danger700,
    info: seedPalette.water700,
  },
};

export const desertLightTheme: ThemeTokens = {
  ...baseTheme,
  id: 'desert-light',
  name: 'Desert Light',
  bg: {
    canvas: '#FBF1E2',
    surface: '#FFF8F0',
    surfaceRaised: '#FFFFFF',
    surfaceMuted: '#F0E1CB',
    accent: '#EED9B0',
  },
  text: {
    primary: '#2A2018',
    secondary: '#6B594A',
    muted: '#8B7867',
    inverse: '#FFFFFF',
    link: '#A05D32',
  },
  border: {
    subtle: '#DEC7A8',
    default: '#B79673',
    strong: '#634938',
  },
  action: {
    primary: {
      bg: '#A05D32',
      fg: '#FFFFFF',
      border: '#A05D32',
    },
    secondary: {
      bg: '#F0E1CB',
      fg: '#7A4A28',
      border: '#D6B78E',
    },
    ghost: {
      bg: 'transparent',
      fg: '#8D552B',
      border: 'transparent',
    },
    danger: {
      bg: '#F5D4CC',
      fg: seedPalette.danger700,
      border: '#D99A8E',
    },
  },
  status: {
    water: {
      bg: '#D6ECF1',
      fg: '#216D83',
      border: '#9EC4CF',
    },
    noWater: {
      bg: '#EED6C8',
      fg: seedPalette.clay700,
      border: '#D3A58F',
    },
    unknown: {
      bg: '#F2E7D3',
      fg: '#735C42',
      border: '#D2BE9D',
    },
    stale: {
      bg: '#F5E1B9',
      fg: '#9C6B10',
      border: '#D7B06A',
    },
    pending: {
      bg: '#EFE4D2',
      fg: '#6B594A',
      border: '#D1B898',
    },
  },
  feedback: {
    success: seedPalette.spring600,
    warning: '#9C6B10',
    error: seedPalette.danger700,
    info: '#A05D32',
  },
};
