import { vi } from 'vitest';

type ManipulateResult = {
  height: number;
  uri: string;
  width: number;
};

let nextResult: ManipulateResult = {
  height: 900,
  uri: 'file:///tmp/manipulated-image.jpg',
  width: 1200,
};
let nextError: Error | null = null;

export const SaveFormat = {
  JPEG: 'jpeg',
  PNG: 'png',
  WEBP: 'webp',
} as const;

export const __resetImageManipulatorMocks = () => {
  nextError = null;
  nextResult = {
    height: 900,
    uri: 'file:///tmp/manipulated-image.jpg',
    width: 1200,
  };
  manipulateAsync.mockClear();
};

export const __setNextManipulateResult = (result: ManipulateResult) => {
  nextResult = result;
};

export const __setNextManipulateError = (error: Error | null) => {
  nextError = error;
};

export const manipulateAsync = vi.fn(async () => {
  if (nextError) {
    throw nextError;
  }

  return nextResult;
});
