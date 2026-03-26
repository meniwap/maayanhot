import IndexRoute from '../../apps/mobile/app/index';
import SpringDetailRoute from '../../apps/mobile/app/springs/[springId]';
import { __getRouter, __resetRouterMocks, __setLocalSearchParams } from '../mocks/expo-router';
import { renderWithTheme } from '../ui/render-with-theme';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', async () => import('../mocks/react-native'));
vi.mock('expo-router', async () => import('../mocks/expo-router'));
vi.mock(
  '../../apps/mobile/src/infrastructure/supabase/repositories/public-spring-read-repository',
  async () => {
    const fixtures = await import('../fixtures/public-spring-data');

    return {
      publicSpringReadRepository: {
        getCatalog: vi.fn(async () => fixtures.publicSpringCatalogFixture),
        getDetailById: vi.fn(async (springId: string) =>
          fixtures.getPublicSpringDetailFixtureById(springId),
        ),
      },
    };
  },
);

afterEach(async () => {
  const { cleanup } = await import('@testing-library/react-native');

  cleanup();
  __resetRouterMocks();
});

describe('Phase 7 spring read flow', () => {
  it('moves from the selected teaser into the dedicated detail route', async () => {
    const { fireEvent, screen, waitFor } = await import('@testing-library/react-native');

    await renderWithTheme(<IndexRoute />);

    await waitFor(() => expect(screen.getByTestId('map-marker-spring-ein-haniya')).toBeDefined());
    fireEvent.press(screen.getByTestId('map-marker-spring-ein-haniya'));
    await waitFor(() => expect(screen.getByTestId('selected-spring-open-details')).toBeDefined());
    fireEvent.press(screen.getByTestId('selected-spring-open-details'));

    expect(__getRouter().push).toHaveBeenCalledWith({
      params: {
        springId: 'spring-ein-haniya',
      },
      pathname: '/springs/[springId]',
    });
  });

  it('renders the detail route from the route param without exposing teaser-only UI', async () => {
    const { screen, waitFor } = await import('@testing-library/react-native');

    __setLocalSearchParams({
      springId: 'spring-ein-haniya',
    });

    await renderWithTheme(<SpringDetailRoute />);

    await waitFor(() => expect(screen.getByTestId('spring-detail-screen')).toBeDefined());
    expect(screen.getByTestId('spring-detail-title')).toBeDefined();
    expect(screen.queryByTestId('selected-spring-teaser')).toBeNull();
  });
});
