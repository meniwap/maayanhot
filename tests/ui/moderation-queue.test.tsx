import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithTheme } from './render-with-theme';

const moderationQueueRepositoryMock = {
  applyDecision: vi.fn(),
  getReviewByReportId: vi.fn(),
  listPending: vi.fn(),
};

vi.mock('react-native', async () => import('../mocks/react-native'));
vi.mock(
  '../../apps/mobile/src/infrastructure/supabase/repositories/moderation-queue-repository',
  () => ({
    moderationQueueRepository: moderationQueueRepositoryMock,
  }),
);

afterEach(async () => {
  const { cleanup } = await import('@testing-library/react-native');

  cleanup();
});

beforeEach(() => {
  moderationQueueRepositoryMock.applyDecision.mockReset();
  moderationQueueRepositoryMock.getReviewByReportId.mockReset();
  moderationQueueRepositoryMock.listPending.mockReset();
});

describe('moderation queue screen', () => {
  it('shows an unauthorized state for non-staff sessions', async () => {
    const { screen } = await import('@testing-library/react-native');
    const { ModerationQueueScreen } =
      await import('../../apps/mobile/src/features/moderation/ModerationQueueScreen');

    await renderWithTheme(
      <ModerationQueueScreen onBack={() => undefined} onOpenReport={() => undefined} />,
      {
        sessionSnapshot: {
          email: 'user@example.com',
          primaryRole: 'user',
          roleSet: ['user'],
          status: 'authenticated',
          userId: 'user-1',
        },
      },
    );

    expect(screen.getByTestId('moderation-queue-unauthorized')).toBeDefined();
  });

  it('shows an empty state when there are no pending moderation items', async () => {
    const { screen, waitFor } = await import('@testing-library/react-native');
    const { ModerationQueueScreen } =
      await import('../../apps/mobile/src/features/moderation/ModerationQueueScreen');

    moderationQueueRepositoryMock.listPending.mockResolvedValue({
      items: [],
      nextCursor: null,
    });

    await renderWithTheme(
      <ModerationQueueScreen onBack={() => undefined} onOpenReport={() => undefined} />,
      {
        sessionSnapshot: {
          email: 'admin@example.com',
          primaryRole: 'admin',
          roleSet: ['admin'],
          status: 'authenticated',
          userId: 'admin-1',
        },
      },
    );

    await waitFor(() => expect(screen.getByTestId('moderation-queue-empty')).toBeDefined());
  });

  it('renders pending queue items with the minimum review context and opens the review route', async () => {
    const { fireEvent, screen, waitFor } = await import('@testing-library/react-native');
    const { ModerationQueueScreen } =
      await import('../../apps/mobile/src/features/moderation/ModerationQueueScreen');
    const onOpenReport = vi.fn();

    moderationQueueRepositoryMock.listPending.mockResolvedValue({
      items: [
        {
          note: 'הבריכה קטנה אבל יש זרימה.',
          observedAt: '2026-03-26T08:00:00.000Z',
          photoCount: 2,
          regionCode: 'jerusalem_hills',
          reportId: 'report-1',
          reporterRoleSnapshot: 'user',
          springId: 'spring-1',
          springSlug: 'ein-karem',
          springTitle: 'עין כרם',
          submittedAt: '2026-03-26T08:10:00.000Z',
          waterPresence: 'water',
        },
      ],
      nextCursor: null,
    });

    await renderWithTheme(
      <ModerationQueueScreen onBack={() => undefined} onOpenReport={onOpenReport} />,
      {
        sessionSnapshot: {
          email: 'admin@example.com',
          primaryRole: 'admin',
          roleSet: ['admin'],
          status: 'authenticated',
          userId: 'admin-1',
        },
      },
    );

    await waitFor(() => expect(screen.getByTestId('moderation-queue-item-report-1')).toBeDefined());
    expect(screen.getByText('עין כרם')).toBeDefined();
    expect(screen.getByText('הבריכה קטנה אבל יש זרימה.')).toBeDefined();
    fireEvent.press(screen.getByTestId('open-moderation-review-report-1'));
    expect(onOpenReport).toHaveBeenCalledWith('report-1');
  });
});
