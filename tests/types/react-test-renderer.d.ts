declare module 'react-test-renderer' {
  import type { ReactElement } from 'react';

  export type ReactTestInstance = {
    children: Array<string | ReactTestInstance>;
    parent: ReactTestInstance | null;
    props: Record<string, unknown>;
    type: string | ((...args: never[]) => unknown);
  };

  export type ReactTestRenderer = {
    root: ReactTestInstance;
    unmount: () => void;
  };

  export function create(element: ReactElement): ReactTestRenderer;
  export function act(callback: () => void): void;
}
