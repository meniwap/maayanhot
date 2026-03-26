import { desertLightTheme, springLightTheme } from '@maayanhot/design-tokens';
import { describe, expect, it } from 'vitest';

describe('design tokens', () => {
  it('exposes the required semantic groups and scales', () => {
    expect(springLightTheme).toEqual(
      expect.objectContaining({
        action: expect.objectContaining({
          danger: expect.any(Object),
          ghost: expect.any(Object),
          primary: expect.any(Object),
          secondary: expect.any(Object),
        }),
        bg: expect.objectContaining({
          accent: expect.any(String),
          canvas: expect.any(String),
          surface: expect.any(String),
          surfaceMuted: expect.any(String),
          surfaceRaised: expect.any(String),
        }),
        border: expect.objectContaining({
          default: expect.any(String),
          strong: expect.any(String),
          subtle: expect.any(String),
        }),
        feedback: expect.objectContaining({
          error: expect.any(String),
          info: expect.any(String),
          success: expect.any(String),
          warning: expect.any(String),
        }),
        icon: expect.objectContaining({
          lg: expect.any(Number),
          md: expect.any(Number),
          sm: expect.any(Number),
          xl: expect.any(Number),
        }),
        radius: expect.objectContaining({
          lg: expect.any(Number),
          md: expect.any(Number),
          round: expect.any(Number),
          sm: expect.any(Number),
          xl: expect.any(Number),
        }),
        space: expect.objectContaining({
          '0': expect.any(Number),
          '10': expect.any(Number),
          '12': expect.any(Number),
          '4': expect.any(Number),
        }),
        status: expect.objectContaining({
          noWater: expect.any(Object),
          pending: expect.any(Object),
          stale: expect.any(Object),
          unknown: expect.any(Object),
          water: expect.any(Object),
        }),
        text: expect.objectContaining({
          inverse: expect.any(String),
          link: expect.any(String),
          muted: expect.any(String),
          primary: expect.any(String),
          secondary: expect.any(String),
        }),
        typography: expect.objectContaining({
          fontFamily: expect.objectContaining({
            body: 'Heebo',
            display: 'Heebo',
          }),
          scale: expect.objectContaining({
            bodyMd: expect.any(Object),
            displayMd: expect.any(Object),
            titleLg: expect.any(Object),
          }),
        }),
      }),
    );
  });

  it('keeps structural scales stable while letting themes override semantic colors centrally', () => {
    expect(desertLightTheme.bg.canvas).not.toBe(springLightTheme.bg.canvas);
    expect(desertLightTheme.action.primary.bg).not.toBe(springLightTheme.action.primary.bg);
    expect(desertLightTheme.space).toEqual(springLightTheme.space);
    expect(desertLightTheme.radius).toEqual(springLightTheme.radius);
    expect(desertLightTheme.typography).toEqual(springLightTheme.typography);
  });
});
