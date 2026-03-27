import { SpringDetailScreen } from '../../apps/mobile/src/features/spring-detail/SpringDetailScreen';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithTheme } from './render-with-theme';

const { publicSpringReadRepositoryMock } = vi.hoisted(() => ({
  publicSpringReadRepositoryMock: {
    getCatalog: vi.fn(),
    getDetailById: vi.fn(),
  },
}));

vi.mock('react-native', async () => import('../mocks/react-native'));
vi.mock(
  '../../apps/mobile/src/infrastructure/supabase/repositories/public-spring-read-repository',
  async () => ({
    publicSpringReadRepository: publicSpringReadRepositoryMock,
  }),
);

afterEach(async () => {
  const { cleanup } = await import('@testing-library/react-native');

  cleanup();
});

describe('spring detail screen', () => {
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

  it('renders cached public data with an offline notice when the current fetch fails', async () => {
    const { screen, waitFor } = await import('@testing-library/react-native');
    const fixtures = await import('../fixtures/public-spring-data');

    publicSpringReadRepositoryMock.getDetailById.mockRejectedValueOnce(new Error('network down'));

    await renderWithTheme(
      <SpringDetailScreen onBack={() => undefined} springId="spring-ein-haniya" />,
      {
        seedQueryData: [
          {
            data: fixtures.getPublicSpringDetailFixtureById('spring-ein-haniya'),
            queryKey: ['public-spring-detail', 'spring-ein-haniya'],
          },
        ],
      },
    );

    await waitFor(() => expect(screen.getByTestId('spring-detail-screen')).toBeDefined());
    await waitFor(() => expect(screen.getByTestId('spring-detail-offline-cache')).toBeDefined());
    expect(screen.getByText('עין חניה')).toBeDefined();
  });

  it('shows local queue state without leaking it into the public history summary', async () => {
    const { screen, waitFor } = await import('@testing-library/react-native');

    await renderWithTheme(
      <SpringDetailScreen onBack={() => undefined} springId="spring-ein-haniya" />,
      {
        offlineQueueSnapshot: {
          activeUserId: 'user-1',
          items: [
            {
              attemptCount: 1,
              attachments: [],
              clientSubmissionId: '11111111-1111-4111-a111-111111111111',
              createdAt: '2026-03-27T09:30:00.000Z',
              lastErrorCode: 'upload_failed',
              nextAttemptAt: '2026-03-27T09:32:00.000Z',
              note: 'local note',
              observedAt: '2026-03-27T09:20:00.000Z',
              ownerUserId: 'user-1',
              queueId: 'queue-1',
              remoteReportId: null,
              springId: 'spring-ein-haniya',
              status: 'retry_scheduled',
              updatedAt: '2026-03-27T09:31:00.000Z',
              waterPresence: 'water',
            },
          ],
          recentDeliveries: [
            {
              deliveredAt: '2026-03-27T09:40:00.000Z',
              ownerUserId: 'user-1',
              queueId: 'queue-2',
              reportId: 'report-queued',
              springId: 'spring-ein-haniya',
            },
          ],
        },
        sessionSnapshot: {
          email: 'user@example.com',
          primaryRole: 'user',
          roleSet: ['user'],
          status: 'authenticated',
          userId: 'user-1',
        },
      },
    );

    await waitFor(() => expect(screen.getByTestId('spring-detail-local-delivery')).toBeDefined());
    expect(screen.getByTestId('spring-local-queue-queue-1')).toBeDefined();
    expect(screen.getByTestId('spring-local-delivery-queue-2')).toBeDefined();
    expect(screen.queryByText('local note')).toBeNull();
  });
});
