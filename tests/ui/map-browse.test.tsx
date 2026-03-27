import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import IndexRoute from '../../apps/mobile/app/index';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { publicSpringCatalogFixture } from '../fixtures/public-spring-data';
import { __resetRouterMocks } from '../mocks/expo-router';

import { renderWithTheme } from './render-with-theme';

const { publicSpringReadRepositoryMock } = vi.hoisted(() => ({
  publicSpringReadRepositoryMock: {
    getCatalog: vi.fn(),
    getDetailById: vi.fn(),
  },
}));

vi.mock('react-native', async () => import('../mocks/react-native'));
vi.mock('expo-router', async () => import('../mocks/expo-router'));
vi.mock(
  '../../apps/mobile/src/infrastructure/supabase/repositories/public-spring-read-repository',
  async () => ({
    publicSpringReadRepository: publicSpringReadRepositoryMock,
  }),
);

afterEach(async () => {
  const { cleanup } = await import('@testing-library/react-native');

  cleanup();
  __resetRouterMocks();
});

describe('Phase 6 map browse flow', () => {
  beforeEach(async () => {
    const fixtures = await import('../fixtures/public-spring-data');

    publicSpringReadRepositoryMock.getCatalog.mockReset();
    publicSpringReadRepositoryMock.getDetailById.mockReset();
    publicSpringReadRepositoryMock.getCatalog.mockResolvedValue(
      fixtures.publicSpringCatalogFixture,
    );
    publicSpringReadRepositoryMock.getDetailById.mockImplementation(async (springId: string) =>
      fixtures.getPublicSpringDetailFixtureById(springId),
    );
  });

  it('renders the map browse shell as the default route instead of the Phase 2 showcase', async () => {
    const { screen } = await import('@testing-library/react-native');

    await renderWithTheme(<IndexRoute />);

    expect(screen.getByTestId('map-browse-screen')).toBeDefined();
    expect(screen.queryByTestId('phase-2-showcase')).toBeNull();
  });

  it('renders one marker per public browse fixture row without clustering', async () => {
    const { screen, waitFor } = await import('@testing-library/react-native');

    await renderWithTheme(<IndexRoute />);

    await waitFor(() => {
      for (const spring of publicSpringCatalogFixture) {
        expect(screen.getByTestId(`map-marker-${spring.id}`)).toBeDefined();
      }
    });
  });

  it('shows a teaser on marker press and clears it when the map surface is pressed', async () => {
    const { fireEvent, screen, waitFor } = await import('@testing-library/react-native');

    await renderWithTheme(<IndexRoute />);

    await waitFor(() => expect(screen.getByTestId('map-marker-spring-ein-haniya')).toBeDefined());
    fireEvent.press(screen.getByTestId('map-marker-spring-ein-haniya'));
    await waitFor(() => expect(screen.getByTestId('selected-spring-teaser')).toBeDefined());
    expect(screen.getByText('עין חניה')).toBeDefined();
    expect(screen.getByText('יש מים לפי דיווח מאושר עדכני')).toBeDefined();

    fireEvent.press(screen.getByTestId('map-surface'));
    await waitFor(() => expect(screen.queryByTestId('selected-spring-teaser')).toBeNull());
  });

  it('keeps the browse fixture aligned to the public-safe read surface only', () => {
    const fixtureRow = publicSpringCatalogFixture[0];

    expect(fixtureRow).toHaveProperty('confidence');
    expect(fixtureRow).not.toHaveProperty('moderationStatus');
    expect(fixtureRow).not.toHaveProperty('derivedFromReportIds');
    expect(fixtureRow).not.toHaveProperty('approvedReportCountConsidered');
  });

  it('keeps app route code free of direct MapLibre imports', () => {
    const routeSource = readFileSync(resolve(process.cwd(), 'apps/mobile/app/index.tsx'), 'utf8');
    const screenSource = readFileSync(
      resolve(process.cwd(), 'apps/mobile/src/features/map-browse/MapBrowseScreen.tsx'),
      'utf8',
    );

    expect(routeSource).not.toContain('@maplibre/maplibre-react-native');
    expect(screenSource).not.toContain('@maplibre/maplibre-react-native');
  });

  it('shows offline cached catalog copy when hydrated public data exists and the network fetch fails', async () => {
    const { screen, waitFor } = await import('@testing-library/react-native');

    publicSpringReadRepositoryMock.getCatalog.mockRejectedValueOnce(new Error('network down'));

    await renderWithTheme(<IndexRoute />, {
      offlineQueueSnapshot: {
        isOnline: false,
      },
      seedQueryData: [
        {
          data: publicSpringCatalogFixture,
          queryKey: ['public-spring-catalog'],
        },
      ],
    });

    await waitFor(() => expect(screen.getByTestId('map-browse-screen')).toBeDefined());
    expect(screen.getByText(/מהמטמון הציבורי המקומי/)).toBeDefined();
  });
});
