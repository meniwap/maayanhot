import type { ReactElement } from 'react';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';

export type RenderOptions = Record<string, never>;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

type Queries = {
  getAllByTestId: (testID: string) => ReactTestInstance[];
  getByTestId: (testID: string) => ReactTestInstance;
  getByText: (text: RegExp | string) => ReactTestInstance;
  queryByTestId: (testID: string) => ReactTestInstance | null;
  queryByText: (text: RegExp | string) => ReactTestInstance | null;
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

const matchesText = (content: string, matcher: RegExp | string) =>
  typeof matcher === 'string' ? content === matcher : matcher.test(content);

const createQueries = (): Queries => ({
  getAllByTestId: (testID: string) => {
    const matches: ReactTestInstance[] = [];

    const search = (node: ReactTestInstance) => {
      if (typeof node.type === 'string' && node.props?.testID === testID) {
        matches.push(node);
      }

      for (const child of node.children) {
        if (typeof child === 'object' && child !== null && 'type' in child) {
          search(child as ReactTestInstance);
        }
      }
    };

    search(getRoot());

    if (matches.length === 0) {
      throw new Error(`Unable to find any elements with testID "${testID}".`);
    }

    return matches;
  },
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
  getByText: (text: RegExp | string) => {
    const match = walkTree(
      getRoot(),
      (candidate) => candidate.type === 'Text' && matchesText(getTextContent(candidate), text),
    );

    if (!match) {
      throw new Error(`Unable to find text "${text}".`);
    }

    return match;
  },
  queryByTestId: (testID: string) =>
    walkTree(
      getRoot(),
      (candidate) => typeof candidate.type === 'string' && candidate.props?.testID === testID,
    ),
  queryByText: (text: RegExp | string) =>
    walkTree(
      getRoot(),
      (candidate) => candidate.type === 'Text' && matchesText(getTextContent(candidate), text),
    ),
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

export const waitFor = async <T>(assertion: () => T) => {
  let lastError: unknown;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      let result: T;

      await act(async () => {
        result = assertion();
      });

      return result!;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  throw lastError;
};

export const screen = {
  getAllByTestId(testID: string) {
    if (!currentQueries) {
      throw new Error('screen.getAllByTestId was called before render.');
    }

    return currentQueries.getAllByTestId(testID);
  },
  getByTestId(testID: string) {
    if (!currentQueries) {
      throw new Error('screen.getByTestId was called before render.');
    }

    return currentQueries.getByTestId(testID);
  },
  getByText(text: RegExp | string) {
    if (!currentQueries) {
      throw new Error('screen.getByText was called before render.');
    }

    return currentQueries.getByText(text);
  },
  queryByTestId(testID: string) {
    if (!currentQueries) {
      throw new Error('screen.queryByTestId was called before render.');
    }

    return currentQueries.queryByTestId(testID);
  },
  queryByText(text: RegExp | string) {
    if (!currentQueries) {
      throw new Error('screen.queryByText was called before render.');
    }

    return currentQueries.queryByText(text);
  },
};

export const fireEvent = {
  changeText(node: ReactTestInstance, value: string) {
    act(() => {
      const onChangeText = node.props.onChangeText as ((nextValue: string) => void) | undefined;

      onChangeText?.(value);
    });
  },
  async press(node: ReactTestInstance, payload?: unknown) {
    const onPress = node.props.onPress as ((event?: unknown) => unknown) | undefined;

    if (!onPress) {
      return;
    }

    let result: unknown;

    act(() => {
      result = onPress(payload);
    });

    if (result && typeof (result as Promise<unknown>).then === 'function') {
      await act(async () => {
        await result;
      });
    }
  },
};
