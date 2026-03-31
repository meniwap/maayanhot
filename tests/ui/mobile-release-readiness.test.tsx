import IndexRoute from '../../apps/mobile/app/index';
import AboutRoute from '../../apps/mobile/app/about';
import PrivacyPlaceholderRoute from '../../apps/mobile/app/legal/privacy';
import TermsPlaceholderRoute from '../../apps/mobile/app/legal/terms';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { publicSpringCatalogFixture } from '../fixtures/public-spring-data';
import { __resetAsyncStorage } from '../mocks/async-storage';
import { __getRouter, __resetRouterMocks } from '../mocks/expo-router';
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
  __resetAsyncStorage();
  __resetRouterMocks();
});

beforeEach(async () => {
  const fixtures = await import('../fixtures/public-spring-data');

  publicSpringReadRepositoryMock.getCatalog.mockReset();
  publicSpringReadRepositoryMock.getDetailById.mockReset();
  publicSpringReadRepositoryMock.getCatalog.mockResolvedValue(publicSpringCatalogFixture);
  publicSpringReadRepositoryMock.getDetailById.mockImplementation(async (springId: string) =>
    fixtures.getPublicSpringDetailFixtureById(springId),
  );
});

describe('mobile release readiness surfaces', () => {
  it('shows onboarding on first run and keeps it dismissed after persistence', async () => {
    const { fireEvent, screen, waitFor } = await import('@testing-library/react-native');

    await renderWithTheme(<IndexRoute />);

    await waitFor(() => expect(screen.getByTestId('release-onboarding-card')).toBeDefined());
    fireEvent.press(screen.getByTestId('onboarding-dismiss'));

    await waitFor(() => expect(screen.queryByTestId('release-onboarding-card')).toBeNull());

    await renderWithTheme(<IndexRoute />);

    await waitFor(() => expect(screen.getByTestId('map-browse-screen')).toBeDefined());
    expect(screen.queryByTestId('release-onboarding-card')).toBeNull();
  });

  it('routes from the beta info surface to the legal placeholder screens', async () => {
    const { fireEvent, screen } = await import('@testing-library/react-native');
    const router = __getRouter();

    await renderWithTheme(<AboutRoute />);

    expect(screen.getByTestId('about-screen')).toBeDefined();
    fireEvent.press(screen.getByTestId('about-open-privacy'));
    expect(router.push).toHaveBeenCalledWith('/legal/privacy');

    fireEvent.press(screen.getByTestId('about-open-terms'));
    expect(router.push).toHaveBeenCalledWith('/legal/terms');
  });

  it('renders committed privacy and terms placeholder routes', async () => {
    const { screen } = await import('@testing-library/react-native');

    await renderWithTheme(<PrivacyPlaceholderRoute />);
    expect(screen.getByTestId('privacy-placeholder-screen')).toBeDefined();
    expect(screen.getByText(/Placeholder release surface בלבד/)).toBeDefined();

    await renderWithTheme(<TermsPlaceholderRoute />);
    expect(screen.getByTestId('terms-placeholder-screen')).toBeDefined();
    expect(screen.getByText(/Placeholder release surface בלבד/)).toBeDefined();
  });
});
