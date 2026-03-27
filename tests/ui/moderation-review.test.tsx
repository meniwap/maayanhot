import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithTheme } from './render-with-theme';

const moderationQueueRepositoryMock = {
  applyDecision: vi.fn(),
  getReviewByReportId: vi.fn(),
  listPending: vi.fn(),
};

const springReportRepositoryMock = {
  create: vi.fn(),
  finalizeMediaUpload: vi.fn(),
  getById: vi.fn(),
  listBySpringId: vi.fn(),
  listMediaByReportIds: vi.fn(),
  reserveMediaSlot: vi.fn(),
};

const springStatusProjectionRepositoryMock = {
  getBySpringId: vi.fn(),
  upsert: vi.fn(),
};

vi.mock('react-native', async () => import('../mocks/react-native'));
vi.mock(
  '../../apps/mobile/src/infrastructure/supabase/repositories/moderation-queue-repository',
  () => ({
    moderationQueueRepository: moderationQueueRepositoryMock,
  }),
);
vi.mock(
  '../../apps/mobile/src/infrastructure/supabase/repositories/spring-report-repository',
  () => ({
    springReportRepository: springReportRepositoryMock,
  }),
);
vi.mock(
  '../../apps/mobile/src/infrastructure/supabase/repositories/spring-status-projection-repository',
  () => ({
    springStatusProjectionRepository: springStatusProjectionRepositoryMock,
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
  springReportRepositoryMock.create.mockReset();
  springReportRepositoryMock.finalizeMediaUpload.mockReset();
  springReportRepositoryMock.getById.mockReset();
  springReportRepositoryMock.listBySpringId.mockReset();
  springReportRepositoryMock.listMediaByReportIds.mockReset();
  springReportRepositoryMock.reserveMediaSlot.mockReset();
  springStatusProjectionRepositoryMock.getBySpringId.mockReset();
  springStatusProjectionRepositoryMock.upsert.mockReset();

  moderationQueueRepositoryMock.getReviewByReportId.mockResolvedValue({
    media: [
      {
        byteSize: 1234,
        capturedAt: '2026-03-26T08:00:00.000Z',
        createdAt: '2026-03-26T08:05:00.000Z',
        height: 900,
        id: 'media-1',
        mediaType: 'image',
        reportId: 'report-1',
        sortOrder: 0,
        springId: 'spring-1',
        storageBucket: 'report-media',
        storagePath: 'user-1/report-1/media-1.jpg',
        uploadState: 'uploaded',
        width: 1200,
      },
    ],
    review: {
      accessNotes: 'ירידה קצרה בשביל',
      description: 'מעיין לדוגמה',
      note: 'יש זרימה חלשה',
      observedAt: '2026-03-26T08:00:00.000Z',
      photoCount: 1,
      regionCode: 'jerusalem_hills',
      reportId: 'report-1',
      reporterRoleSnapshot: 'user',
      springId: 'spring-1',
      springSlug: 'ein-karem',
      springTitle: 'עין כרם',
      submittedAt: '2026-03-26T08:10:00.000Z',
      waterPresence: 'water',
    },
  });
  moderationQueueRepositoryMock.applyDecision.mockResolvedValue({
    actedAt: '2026-03-26T09:00:00.000Z',
    actorUserId: 'admin-1',
    decision: 'approve',
    id: 'moderation-1',
    reasonCode: null,
    reasonNote: null,
    reportId: 'report-1',
  });
  springReportRepositoryMock.listBySpringId.mockResolvedValue([
    {
      id: 'report-1',
      locationEvidence: {
        latitude: null,
        longitude: null,
        precisionMeters: null,
      },
      mediaIds: ['media-1'],
      moderationStatus: 'approved',
      note: 'יש זרימה חלשה',
      observedAt: '2026-03-26T08:00:00.000Z',
      reporterRoleSnapshot: 'user',
      reporterUserId: 'user-1',
      springId: 'spring-1',
      submittedAt: '2026-03-26T08:10:00.000Z',
      waterPresence: 'water',
    },
  ]);
  springReportRepositoryMock.listMediaByReportIds.mockResolvedValue({
    'report-1': [
      {
        byteSize: 1234,
        capturedAt: '2026-03-26T08:00:00.000Z',
        createdAt: '2026-03-26T08:05:00.000Z',
        exifStripped: false,
        height: 900,
        id: 'media-1',
        mediaType: 'image',
        publicUrl: null,
        reportId: 'report-1',
        springId: 'spring-1',
        storageBucket: 'report-media',
        storagePath: 'user-1/report-1/media-1.jpg',
        uploadState: 'uploaded',
        width: 1200,
      },
    ],
  });
  springStatusProjectionRepositoryMock.upsert.mockImplementation(async (projection) => ({
    ...projection,
  }));
});

describe('moderation review screen', () => {
  it('shows an unauthorized state for non-staff sessions', async () => {
    const { screen } = await import('@testing-library/react-native');
    const { ModerationReviewScreen } =
      await import('../../apps/mobile/src/features/moderation/ModerationReviewScreen');

    await renderWithTheme(
      <ModerationReviewScreen
        onBack={() => undefined}
        onDecisionComplete={() => undefined}
        reportId="report-1"
      />,
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

    expect(screen.getByTestId('moderation-review-unauthorized')).toBeDefined();
  });

  it('renders the review context and private media previews through the adapter boundary', async () => {
    const { screen, waitFor } = await import('@testing-library/react-native');
    const { ModerationReviewScreen } =
      await import('../../apps/mobile/src/features/moderation/ModerationReviewScreen');

    await renderWithTheme(
      <ModerationReviewScreen
        onBack={() => undefined}
        onDecisionComplete={() => undefined}
        previewAdapter={{
          createSignedPreviewUrl: vi.fn(async () => ({
            expiresInSeconds: 900,
            signedUrl: 'https://example.com/media-1.jpg?token=signed',
            storageBucket: 'report-media',
            storagePath: 'user-1/report-1/media-1.jpg',
          })),
        }}
        reportId="report-1"
      />,
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

    await waitFor(() => expect(screen.getByTestId('moderation-review-screen')).toBeDefined());
    expect(screen.getByText('עין כרם')).toBeDefined();
    await waitFor(() =>
      expect(screen.getByTestId('moderation-review-photo-media-1')).toBeDefined(),
    );
  });

  it('requires a rejection reason code before rejecting', async () => {
    const { fireEvent, screen, waitFor } = await import('@testing-library/react-native');
    const { ModerationReviewScreen } =
      await import('../../apps/mobile/src/features/moderation/ModerationReviewScreen');

    await renderWithTheme(
      <ModerationReviewScreen
        onBack={() => undefined}
        onDecisionComplete={() => undefined}
        previewAdapter={{
          createSignedPreviewUrl: vi.fn(async () => ({
            expiresInSeconds: 900,
            signedUrl: 'https://example.com/media-1.jpg?token=signed',
            storageBucket: 'report-media',
            storagePath: 'user-1/report-1/media-1.jpg',
          })),
        }}
        reportId="report-1"
      />,
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

    await waitFor(() => expect(screen.getByTestId('moderation-review-reject')).toBeDefined());
    fireEvent.press(screen.getByTestId('moderation-review-reject'));

    expect(screen.getByTestId('moderation-review-validation-message')).toBeDefined();
    expect(moderationQueueRepositoryMock.applyDecision).not.toHaveBeenCalled();
  });

  it('approves a report through the flow and returns control to the queue route', async () => {
    const { fireEvent, screen, waitFor } = await import('@testing-library/react-native');
    const { ModerationReviewScreen } =
      await import('../../apps/mobile/src/features/moderation/ModerationReviewScreen');
    const onDecisionComplete = vi.fn();

    await renderWithTheme(
      <ModerationReviewScreen
        onBack={() => undefined}
        onDecisionComplete={onDecisionComplete}
        previewAdapter={{
          createSignedPreviewUrl: vi.fn(async () => ({
            expiresInSeconds: 900,
            signedUrl: 'https://example.com/media-1.jpg?token=signed',
            storageBucket: 'report-media',
            storagePath: 'user-1/report-1/media-1.jpg',
          })),
        }}
        reportId="report-1"
      />,
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

    await waitFor(() => expect(screen.getByTestId('moderation-review-approve')).toBeDefined());
    fireEvent.press(screen.getByTestId('moderation-review-approve'));

    await waitFor(() => expect(onDecisionComplete).toHaveBeenCalledWith('approve'));
    expect(moderationQueueRepositoryMock.applyDecision).toHaveBeenCalledWith({
      decision: 'approve',
      reportId: 'report-1',
    });
    expect(springStatusProjectionRepositoryMock.upsert).toHaveBeenCalledOnce();
  });
});
