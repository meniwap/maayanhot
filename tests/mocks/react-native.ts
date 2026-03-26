import React from 'react';

type MockProps = {
  children?: React.ReactNode | ((state: { pressed: boolean }) => React.ReactNode);
  [key: string]: unknown;
};

type StyleInput = false | null | undefined | Record<string, unknown> | StyleInput[];

const flattenStyle = (style: StyleInput): Record<string, unknown> => {
  if (!style) {
    return {};
  }

  if (Array.isArray(style)) {
    return style.reduce<Record<string, unknown>>((accumulator, item) => {
      return {
        ...accumulator,
        ...flattenStyle(item),
      };
    }, {});
  }

  return style;
};

const createHostComponent = (displayName: string) => {
  const Component = ({ children, ...props }: MockProps) =>
    React.createElement(displayName, props, children as React.ReactNode);

  Component.displayName = displayName;

  return Component;
};

export const View = createHostComponent('View');
export const Text = createHostComponent('Text');
export const ScrollView = createHostComponent('ScrollView');
export const Image = createHostComponent('Image');
export const TextInput = createHostComponent('TextInput');
export const Pressable = ({ children, ...props }: MockProps) =>
  React.createElement(
    'Pressable',
    props,
    typeof children === 'function' ? children({ pressed: false }) : children,
  );

export const I18nManager = {
  allowRTL: () => undefined,
  forceRTL: () => undefined,
  isRTL: true,
};

export const Platform = {
  OS: 'ios',
  select: <T>(choices: { default?: T; ios?: T }) => choices.ios ?? choices.default,
};

export const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T) => styles,
  absoluteFillObject: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  flatten: flattenStyle,
  hairlineWidth: 1,
};
