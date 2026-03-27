import IndexRoute from '../../apps/mobile/app/index';
import { __getRouter, __resetRouterMocks } from '../mocks/expo-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { publicSpringCatalogFixture } from '../fixtures/public-spring-data';

import { renderWithTheme } from '../ui/render-with-theme';

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

beforeEach(() => {
  publicSpringReadRepositoryMock.getCatalog.mockReset();
  publicSpringReadRepositoryMock.getDetailById.mockReset();
  publicSpringReadRepositoryMock.getCatalog.mockResolvedValue(publicSpringCatalogFixture);
});

describe('phase 12 discovery flow integration', () => {
  it('routes to spring detail from the shared list results after search and filters', async () => {
    const { fireEvent, screen, waitFor } = await import('@testing-library/react-native');

    await renderWithTheme(<IndexRoute />);

    fireEvent.changeText(screen.getByTestId('discovery-search-input'), 'ein');
    await fireEvent.press(screen.getByTestId('discovery-water-water'));
    await fireEvent.press(screen.getByTestId('discovery-view-list'));

    await waitFor(() => expect(screen.getByTestId('discovery-list')).toBeDefined());
    expect(screen.getByTestId('discovery-list-item-spring-ein-tina')).toBeDefined();
    expect(screen.getByTestId('discovery-list-item-spring-ein-haniya')).toBeDefined();
    expect(screen.queryByTestId('discovery-list-item-spring-ein-fara')).toBeNull();

    await fireEvent.press(screen.getByTestId('discovery-list-open-details-spring-ein-tina'));

    expect(__getRouter().push).toHaveBeenCalledWith({
      params: {
        springId: 'spring-ein-tina',
      },
      pathname: '/springs/[springId]',
    });
  });
});
