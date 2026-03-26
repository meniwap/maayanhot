import { SpringDetailScreen } from '../../apps/mobile/src/features/spring-detail/SpringDetailScreen';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderWithTheme } from './render-with-theme';

vi.mock('react-native', async () => import('../mocks/react-native'));
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
});

describe('spring detail screen', () => {
  it('renders a public-safe detail view with approved images and approved history summary only', async () => {
    const { screen, waitFor } = await import('@testing-library/react-native');

    await renderWithTheme(
      <SpringDetailScreen onBack={() => undefined} springId="spring-ein-haniya" />,
    );

    await waitFor(() => expect(screen.getByTestId('spring-detail-screen')).toBeDefined());
    expect(screen.getByText('עין חניה')).toBeDefined();
    expect(screen.getByText('גלריית תמונות מאושרות')).toBeDefined();
    expect(screen.getByTestId('spring-gallery-image-media-ein-haniya-1')).toBeDefined();
    expect(screen.getByTestId('history-summary-item-report-ein-haniya-2')).toBeDefined();
    expect(screen.getByText('ניווט חיצוני')).toBeDefined();
  });

  it('keeps trust and moderation internals out of the public detail UI', async () => {
    const { screen, waitFor } = await import('@testing-library/react-native');

    await renderWithTheme(
      <SpringDetailScreen onBack={() => undefined} springId="spring-ein-haniya" />,
    );

    await waitFor(() => expect(screen.getByTestId('spring-detail-screen')).toBeDefined());
    expect(screen.queryByText('trusted contributor')).toBeNull();
    expect(screen.queryByText('moderation')).toBeNull();
    expect(screen.queryByText('audit')).toBeNull();
    expect(screen.queryByText('reviewer')).toBeNull();
  });

  it('opens external navigation through the adapter abstraction only', async () => {
    const { fireEvent, screen, waitFor } = await import('@testing-library/react-native');
    const navigationAdapter = {
      canOpen: vi.fn(async () => true),
      open: vi.fn(async () => undefined),
    };

    await renderWithTheme(
      <SpringDetailScreen
        navigationAdapter={navigationAdapter}
        onBack={() => undefined}
        springId="spring-ein-haniya"
      />,
    );

    await waitFor(() => expect(screen.getByTestId('navigate-google_maps')).toBeDefined());
    fireEvent.press(screen.getByTestId('navigate-google_maps'));

    expect(navigationAdapter.open).toHaveBeenCalledWith({
      app: 'google_maps',
      destination: {
        coordinate: {
          latitude: 31.7454,
          longitude: 35.1691,
        },
        label: 'עין חניה',
        springId: 'spring-ein-haniya',
      },
      sourceLabel: 'spring_detail',
      travelMode: 'driving',
    });
  });

  it('shows a safe not-found state for an unknown spring id', async () => {
    const { fireEvent, screen, waitFor } = await import('@testing-library/react-native');
    const onBack = vi.fn();

    await renderWithTheme(<SpringDetailScreen onBack={onBack} springId="missing-spring" />);

    await waitFor(() => expect(screen.getByTestId('spring-detail-not-found')).toBeDefined());
    fireEvent.press(screen.getByTestId('spring-detail-not-found-back'));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
