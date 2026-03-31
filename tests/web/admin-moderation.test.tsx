// @vitest-environment jsdom

import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { createMemoryObservability } from '@maayanhot/observability-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AdminModerationPage from '../../apps/admin-web/app/admin/moderation/page';
import { AdminModerationReviewScreen } from '../../apps/admin-web/src/features/moderation/AdminModerationReviewScreen';
import { __resetNextNavigationMock, __setSearchParams } from '../mocks/next-navigation';
import { createAuthenticatedSnapshot, renderAdmin } from './render-admin';

const moderationQueueRepositoryModule = vi.hoisted(() => ({
  moderationQueueRepository: {
    applyDecision: vi.fn(),
    getReviewByReportId: vi.fn(),
    listPending: vi.fn(),
  },
}));

const springReportRepositoryModule = vi.hoisted(() => ({
  springReportRepository: {
    create: vi.fn(),
    finalizeMediaUpload: vi.fn(),
    getById: vi.fn(),
    listBySpringId: vi.fn(),
    listMediaByReportIds: vi.fn(),
    reserveMediaSlot: vi.fn(),
  },
}));

const springStatusProjectionRepositoryModule = vi.hoisted(() => ({
  springStatusProjectionRepository: {
    getBySpringId: vi.fn(),
    upsert: vi.fn(),
  },
}));

vi.mock(
  '../../apps/admin-web/src/infrastructure/supabase/repositories/moderation-queue-repository',
  () => moderationQueueRepositoryModule,
);
vi.mock(
  '../../apps/admin-web/src/infrastructure/supabase/repositories/spring-report-repository',
  () => springReportRepositoryModule,
);
vi.mock(
  '../../apps/admin-web/src/infrastructure/supabase/repositories/spring-status-projection-repository',
  () => springStatusProjectionRepositoryModule,
);

const queueItem = {
  note: 'זרימה חלשה אבל קיימת',
  observedAt: '2026-03-27T08:00:00.000Z',
  photoCount: 1,
  regionCode: 'jerusalem_hills',
  reportId: 'report-2',
  reporterRoleSnapshot: 'user' as const,
  springId: 'spring-1',
  springSlug: 'ein-test',
  springTitle: 'עין בדיקה',
  submittedAt: '2026-03-27T08:10:00.000Z',
  waterPresence: 'water' as const,
};

const reviewAggregate = {
  media: [
    {
      byteSize: 1400,
      capturedAt: '2026-03-27T08:00:00.000Z',
      createdAt: '2026-03-27T08:05:00.000Z',
      height: 800,
      id: 'media-1',
      mediaType: 'image' as const,
      reportId: 'report-2',
      sortOrder: 0,
      springId: 'spring-1',
      storageBucket: 'report-media',
      storagePath: 'user-1/report-2/media-1.jpg',
      uploadState: 'uploaded' as const,
      width: 1200,
    },
  ],
  review: {
    ...queueItem,
    accessNotes: 'ירידה קצרה מהחניה',
    description: 'תיאור לבדיקה',
  },
};

describe('admin moderation web flows', () => {
  beforeEach(() => {
    __resetNextNavigationMock();
    __setSearchParams({});
    vi.clearAllMocks();

    moderationQueueRepositoryModule.moderationQueueRepository.listPending.mockResolvedValue({
      items: [queueItem],
      nextCursor: null,
    });
    moderationQueueRepositoryModule.moderationQueueRepository.getReviewByReportId.mockResolvedValue(
      reviewAggregate,
    );
    moderationQueueRepositoryModule.moderationQueueRepository.applyDecision.mockResolvedValue({
      actedAt: '2026-03-27T08:30:00.000Z',
      actorUserId: 'admin-1',
      decision: 'approve',
      id: 'moderation-1',
      reasonCode: null,
      reasonNote: null,
      reportId: 'report-2',
    });
    springReportRepositoryModule.springReportRepository.listBySpringId.mockResolvedValue([
      {
        id: 'report-2',
        locationEvidence: {
          latitude: null,
          longitude: null,
          precisionMeters: 20,
        },
        mediaIds: ['media-1'],
        moderationStatus: 'approved',
        note: queueItem.note,
        observedAt: queueItem.observedAt,
        reporterRoleSnapshot: 'user',
        reporterUserId: 'user-1',
        springId: queueItem.springId,
        submittedAt: queueItem.submittedAt,
        waterPresence: queueItem.waterPresence,
      },
    ]);
    springReportRepositoryModule.springReportRepository.listMediaByReportIds.mockResolvedValue({
      'report-2': [
        {
          byteSize: 1400,
          capturedAt: '2026-03-27T08:00:00.000Z',
          createdAt: '2026-03-27T08:05:00.000Z',
          exifStripped: true,
          height: 800,
          id: 'media-1',
          mediaType: 'image',
          publicUrl: null,
          reportId: 'report-2',
          springId: 'spring-1',
          storageBucket: 'report-media',
          storagePath: 'user-1/report-2/media-1.jpg',
          uploadState: 'uploaded',
          width: 1200,
        },
      ],
    });
    springStatusProjectionRepositoryModule.springStatusProjectionRepository.getBySpringId.mockResolvedValue(
      null,
    );
    springStatusProjectionRepositoryModule.springStatusProjectionRepository.upsert.mockImplementation(
      async (command: unknown) => command,
    );
  });

  afterEach(() => {
    cleanup();
  });

  it('renders pending moderation items for staff routes', async () => {
    __setSearchParams({ feedback: 'הדיווח אושר.' });

    renderAdmin(<AdminModerationPage />, {
      snapshot: createAuthenticatedSnapshot('moderator'),
    });

    expect((await screen.findByTestId('admin-moderation-item-report-2')).textContent).toContain(
      'עין בדיקה',
    );
    expect(screen.getByTestId('admin-moderation-feedback').textContent).toContain('הדיווח אושר.');
  });

  it('requires a rejection reason before rejecting', async () => {
    const onDecisionComplete = vi.fn();

    renderAdmin(
      <AdminModerationReviewScreen
        onBack={() => undefined}
        onDecisionComplete={onDecisionComplete}
        previewAdapter={{
          createSignedPreviewUrl: vi.fn().mockResolvedValue({
            expiresAt: '2026-03-27T09:00:00.000Z',
            signedUrl: 'https://example.com/private-preview.jpg',
          }),
        }}
        reportId="report-2"
      />,
      {
        snapshot: createAuthenticatedSnapshot('admin'),
      },
    );

    expect(await screen.findByTestId('admin-review-screen')).toBeTruthy();
    fireEvent.click(screen.getByTestId('admin-review-reject'));

    expect((await screen.findByTestId('admin-review-validation')).textContent).toContain(
      'יש לבחור סיבת דחייה לפני דחיית הדיווח.',
    );
    expect(onDecisionComplete).not.toHaveBeenCalled();
  });

  it('approves a report through the shared moderation flow and resolves private previews', async () => {
    const onDecisionComplete = vi.fn();
    const createSignedPreviewUrl = vi.fn().mockResolvedValue({
      expiresAt: '2026-03-27T09:00:00.000Z',
      signedUrl: 'https://example.com/private-preview.jpg',
    });
    const memoryObservability = createMemoryObservability();

    renderAdmin(
      <AdminModerationReviewScreen
        onBack={() => undefined}
        onDecisionComplete={onDecisionComplete}
        previewAdapter={{ createSignedPreviewUrl }}
        reportId="report-2"
      />,
      {
        observability: memoryObservability.observability,
        snapshot: createAuthenticatedSnapshot('admin'),
      },
    );

    expect(await screen.findByTestId('admin-review-photo-media-1')).toBeTruthy();

    fireEvent.click(screen.getByTestId('admin-review-approve'));

    await waitFor(() => {
      expect(
        moderationQueueRepositoryModule.moderationQueueRepository.applyDecision,
      ).toHaveBeenCalledWith({
        decision: 'approve',
        reportId: 'report-2',
      });
    });
    expect(createSignedPreviewUrl).toHaveBeenCalledWith({
      storageBucket: 'report-media',
      storagePath: 'user-1/report-2/media-1.jpg',
    });
    expect(onDecisionComplete).toHaveBeenCalledWith('approve');
    expect(memoryObservability.analytics.map((entry) => entry.name)).toContain(
      'moderation_decision_submitted',
    );
  });
});
