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
    expect(fixtureRow).toHaveProperty('alternateNames');
    expect(fixtureRow).not.toHaveProperty('moderationStatus');
    expect(fixtureRow).not.toHaveProperty('derivedFromReportIds');
    expect(fixtureRow).not.toHaveProperty('approvedReportCountConsidered');
  });

  it('shares discovery state across map and list views', async () => {
    const { fireEvent, screen, waitFor } = await import('@testing-library/react-native');

    await renderWithTheme(<IndexRoute />);

    fireEvent.changeText(screen.getByTestId('discovery-search-input'), 'prat');

    await waitFor(() => {
      expect(screen.getByTestId('map-marker-spring-ein-fara')).toBeDefined();
      expect(screen.queryByTestId('map-marker-spring-ein-haniya')).toBeNull();
    });

    await fireEvent.press(screen.getByTestId('discovery-view-list'));

    await waitFor(() => expect(screen.getByTestId('discovery-list')).toBeDefined());
    expect(screen.getByTestId('discovery-list-item-spring-ein-fara')).toBeDefined();
    expect(screen.queryByTestId('discovery-list-item-spring-ein-haniya')).toBeNull();
    expect(screen.getByTestId('discovery-search-input').props.value).toBe('prat');
  });

  it('switches from list selection back to map and keeps the selected spring focused', async () => {
    const { fireEvent, screen, waitFor } = await import('@testing-library/react-native');

    await renderWithTheme(<IndexRoute />);

    await fireEvent.press(screen.getByTestId('discovery-view-list'));
    await waitFor(() =>
      expect(screen.getByTestId('discovery-list-item-spring-ein-haniya')).toBeDefined(),
    );

    await fireEvent.press(screen.getByTestId('discovery-list-show-map-spring-ein-haniya'));

    await waitFor(() => expect(screen.getByTestId('selected-spring-teaser')).toBeDefined());
    expect(screen.getByTestId('selected-spring-title').children.join('')).toBe('עין חניה');
  });

  it('applies filter chips to both result views and clears selection when a result drops out', async () => {
    const { fireEvent, screen, waitFor } = await import('@testing-library/react-native');

    await renderWithTheme(<IndexRoute />);

    await waitFor(() => expect(screen.getByTestId('map-marker-spring-ein-haniya')).toBeDefined());
    fireEvent.press(screen.getByTestId('map-marker-spring-ein-haniya'));
    await waitFor(() => expect(screen.getByTestId('selected-spring-teaser')).toBeDefined());

    await fireEvent.press(screen.getByTestId('discovery-water-no_water'));

    await waitFor(() => {
      expect(screen.queryByTestId('selected-spring-teaser')).toBeNull();
      expect(screen.getByTestId('map-marker-spring-ein-fara')).toBeDefined();
      expect(screen.queryByTestId('map-marker-spring-ein-haniya')).toBeNull();
    });

    await fireEvent.press(screen.getByTestId('discovery-view-list'));
    await waitFor(() =>
      expect(screen.getByTestId('discovery-list-item-spring-ein-fara')).toBeDefined(),
    );
    expect(screen.queryByTestId('discovery-list-item-spring-ein-haniya')).toBeNull();
  });

  it('supports result reset and empty-state recovery', async () => {
    const { fireEvent, screen, waitFor } = await import('@testing-library/react-native');

    await renderWithTheme(<IndexRoute />);

    await fireEvent.press(screen.getByTestId('discovery-view-list'));
    fireEvent.changeText(screen.getByTestId('discovery-search-input'), 'zzz');

    await waitFor(() => expect(screen.getByTestId('discovery-empty-state')).toBeDefined());
    await fireEvent.press(screen.getByTestId('discovery-empty-reset'));

    await waitFor(() =>
      expect(screen.getByTestId('discovery-list-item-spring-ein-haniya')).toBeDefined(),
    );
    expect(screen.getByTestId('discovery-results-summary').children.join('')).toContain('4 מתוך 4');
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

  it('keeps cached discovery usable offline in list view', async () => {
    const { fireEvent, screen, waitFor } = await import('@testing-library/react-native');

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

    await fireEvent.press(screen.getByTestId('discovery-view-list'));
    fireEvent.changeText(screen.getByTestId('discovery-search-input'), 'גליל');

    await waitFor(() => expect(screen.getByTestId('discovery-list')).toBeDefined());
    expect(screen.getByTestId('discovery-list-item-spring-ein-tina')).toBeDefined();
    expect(screen.queryByTestId('discovery-list-item-spring-ein-haniya')).toBeNull();
  });
});
