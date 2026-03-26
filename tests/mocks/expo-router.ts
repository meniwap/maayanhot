import React from 'react';
import { vi } from 'vitest';

type RouterParams = Record<string, string | string[] | undefined>;

const router = {
  back: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
};

let localSearchParams: RouterParams = {};

export const __getRouter = () => router;

export const __resetRouterMocks = () => {
  localSearchParams = {};
  router.back.mockReset();
  router.push.mockReset();
  router.replace.mockReset();
};

export const __setLocalSearchParams = (params: RouterParams) => {
  localSearchParams = params;
};

export const useRouter = () => router;

export const useLocalSearchParams = <T extends RouterParams>() => localSearchParams as T;

export const Stack = ({
  children,
  ...props
}: {
  children?: React.ReactNode;
  [key: string]: unknown;
}) => React.createElement('ExpoRouterStack', props, children);
