import type { ReactElement } from 'react';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';

export type RenderOptions = Record<string, never>;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

type Queries = {
  getByTestId: (testID: string) => ReactTestInstance;
  getByText: (text: string) => ReactTestInstance;
};

let currentRenderer: ReactTestRenderer | null = null;
let currentQueries: Queries | null = null;

const getRoot = () => {
  if (!currentRenderer) {
    throw new Error('Nothing has been rendered yet.');
  }

  return currentRenderer.root;
};

const walkTree = (
  node: ReactTestInstance,
  predicate: (candidate: ReactTestInstance) => boolean,
): ReactTestInstance | null => {
  if (predicate(node)) {
    return node;
  }

  for (const child of node.children) {
    if (typeof child === 'object' && child !== null && 'type' in child) {
      const match = walkTree(child as ReactTestInstance, predicate);

      if (match) {
        return match;
      }
    }
  }

  return null;
};

const getTextContent = (node: ReactTestInstance): string =>
  node.children
    .map((child: string | ReactTestInstance) => {
      if (typeof child === 'string') {
        return child;
      }

      if (typeof child === 'object' && child !== null && 'children' in child) {
        return getTextContent(child as ReactTestInstance);
      }

      return '';
    })
    .join('');

const createQueries = (): Queries => ({
  getByTestId: (testID: string) => {
    const match = walkTree(
      getRoot(),
      (candidate) => typeof candidate.type === 'string' && candidate.props?.testID === testID,
    );

    if (!match) {
      throw new Error(`Unable to find an element with testID "${testID}".`);
    }

    return match;
  },
  getByText: (text: string) => {
    const match = walkTree(
      getRoot(),
      (candidate) => candidate.type === 'Text' && getTextContent(candidate) === text,
    );

    if (!match) {
      throw new Error(`Unable to find text "${text}".`);
    }

    return match;
  },
});

export const cleanup = () => {
  if (currentRenderer) {
    act(() => {
      currentRenderer?.unmount();
    });
  }

  currentRenderer = null;
  currentQueries = null;
};

export const render = (ui: ReactElement) => {
  let renderer: ReactTestRenderer;

  act(() => {
    renderer = create(ui);
  });

  currentRenderer = renderer!;
  currentQueries = createQueries();

  return {
    ...currentQueries,
    unmount: () => {
      cleanup();
    },
  };
};

export const screen = {
  getByTestId(testID: string) {
    if (!currentQueries) {
      throw new Error('screen.getByTestId was called before render.');
    }

    return currentQueries.getByTestId(testID);
  },
  getByText(text: string) {
    if (!currentQueries) {
      throw new Error('screen.getByText was called before render.');
    }

    return currentQueries.getByText(text);
  },
};
