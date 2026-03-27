import { springLightTheme } from '@maayanhot/design-tokens';

export const adminTheme = springLightTheme;

export const adminSurfaceShadow = `0 ${adminTheme.elevation['1'].shadowOffsetY}px ${adminTheme.elevation['1'].shadowRadius}px rgba(24, 32, 24, ${adminTheme.elevation['1'].shadowOpacity})`;
