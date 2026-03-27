import { vi } from 'vitest';

type RouterMock = {
  back: (...args: unknown[]) => void;
  forward: (...args: unknown[]) => void;
  prefetch: (...args: unknown[]) => Promise<void>;
  push: (...args: unknown[]) => void;
  refresh: (...args: unknown[]) => void;
  replace: (...args: unknown[]) => void;
};

const createRouterMock = (): RouterMock => ({
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn().mockResolvedValue(undefined),
  push: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
});

let router = createRouterMock();
let searchParams = new URLSearchParams();
let pathname = '/';

export const __resetNextNavigationMock = () => {
  router = createRouterMock();
  searchParams = new URLSearchParams();
  pathname = '/';
};

export const __getRouterMock = () => router;

export const __setPathname = (value: string) => {
  pathname = value;
};

export const __setSearchParams = (entries: Record<string, string | null | undefined>) => {
  searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(entries)) {
    if (value) {
      searchParams.set(key, value);
    }
  }
};

export const useRouter = () => router;

export const usePathname = () => pathname;

export const useSearchParams = () => searchParams;

export const redirect = (path: string) => {
  router.replace(path);
  throw new Error(`NEXT_REDIRECT:${path}`);
};

export const notFound = () => {
  throw new Error('NEXT_NOT_FOUND');
};
