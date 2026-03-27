import type {
  ModerationQueueRepository,
  SpringReportRepository,
  SpringStatusProjectionRepository,
} from '@maayanhot/domain';
import { ModerateReportFlow } from '@maayanhot/use-cases';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type QueryInvalidator = {
  invalidate: (queryKey: readonly unknown[]) => Promise<void>;
};

const makeReviewAggregate = () => ({
  media: [
    {
      byteSize: 1234,
      capturedAt: '2026-03-26T08:00:00.000Z',
      createdAt: '2026-03-26T08:05:00.000Z',
      height: 900,
      id: 'media-2',
      mediaType: 'image' as const,
      reportId: 'report-2',
      sortOrder: 0,
      springId: 'spring-1',
      storageBucket: 'report-media',
      storagePath: 'user-1/report-2/media-2.jpg',
      uploadState: 'uploaded' as const,
      width: 1200,
    },
  ],
  review: {
    accessNotes: 'ירידה קצרה בשביל',
    description: 'מעיין בדיקה',
    note: 'יש זרימה ברורה',
    observedAt: '2026-03-26T08:00:00.000Z',
    photoCount: 1,
    regionCode: 'jerusalem_hills',
    reportId: 'report-2',
    reporterRoleSnapshot: 'user' as const,
    springId: 'spring-1',
    springSlug: 'ein-test',
    springTitle: 'עין בדיקה',
    submittedAt: '2026-03-26T08:10:00.000Z',
    waterPresence: 'water' as const,
  },
});

const approvedReport = {
  id: 'report-1',
  locationEvidence: {
    latitude: null,
    longitude: null,
    precisionMeters: null,
  },
  mediaIds: [],
  moderationStatus: 'approved' as const,
  note: 'אין מים כרגע',
  observedAt: '2026-03-22T08:00:00.000Z',
  reporterRoleSnapshot: 'user' as const,
  reporterUserId: 'user-2',
  springId: 'spring-1',
  submittedAt: '2026-03-22T08:10:00.000Z',
  waterPresence: 'no_water' as const,
};

const approvedTargetReport = {
  id: 'report-2',
  locationEvidence: {
    latitude: null,
    longitude: null,
    precisionMeters: 30,
  },
  mediaIds: ['media-2'],
  moderationStatus: 'approved' as const,
  note: 'יש זרימה ברורה',
  observedAt: '2026-03-26T08:00:00.000Z',
  reporterRoleSnapshot: 'user' as const,
  reporterUserId: 'user-1',
  springId: 'spring-1',
  submittedAt: '2026-03-26T08:10:00.000Z',
  waterPresence: 'water' as const,
};

const rejectedTargetReport = {
  ...approvedTargetReport,
  moderationStatus: 'rejected' as const,
};

describe('phase 9 moderation flow', () => {
  let moderationQueueRepository: ModerationQueueRepository;
  let springReportRepository: SpringReportRepository;
  let springStatusProjectionRepository: SpringStatusProjectionRepository;
  let queryInvalidator: QueryInvalidator;
  let invalidateSpy: ReturnType<typeof vi.fn<(queryKey: readonly unknown[]) => Promise<void>>>;

  beforeEach(() => {
    moderationQueueRepository = {
      applyDecision: vi.fn(),
      getReviewByReportId: vi.fn(),
      listPending: vi.fn(),
    };
    springReportRepository = {
      create: vi.fn(),
      finalizeMediaUpload: vi.fn(),
      getById: vi.fn(),
      listBySpringId: vi.fn(),
      listMediaByReportIds: vi.fn(),
      reserveMediaSlot: vi.fn(),
    };
    springStatusProjectionRepository = {
      getBySpringId: vi.fn(),
      upsert: vi.fn(),
    };
    invalidateSpy = vi
      .fn<(queryKey: readonly unknown[]) => Promise<void>>()
      .mockResolvedValue(undefined);
    queryInvalidator = {
      invalidate: (queryKey: readonly unknown[]) => invalidateSpy(queryKey),
    };
  });

  it('approves a pending report through the moderation action path and persists the derived projection', async () => {
    vi.mocked(moderationQueueRepository.getReviewByReportId).mockResolvedValue(
      makeReviewAggregate(),
    );
    vi.mocked(moderationQueueRepository.applyDecision).mockResolvedValue({
      actedAt: '2026-03-26T09:00:00.000Z',
      actorUserId: 'admin-1',
      decision: 'approve',
      id: 'moderation-1',
      reasonCode: null,
      reasonNote: null,
      reportId: 'report-2',
    });
    vi.mocked(springReportRepository.listBySpringId).mockResolvedValue([
      approvedTargetReport,
      approvedReport,
    ]);
    vi.mocked(springStatusProjectionRepository.getBySpringId).mockResolvedValue(null);
    vi.mocked(springReportRepository.listMediaByReportIds).mockResolvedValue({
      'report-2': [
        {
          byteSize: 1234,
          capturedAt: '2026-03-26T08:00:00.000Z',
          createdAt: '2026-03-26T08:05:00.000Z',
          exifStripped: true,
          height: 900,
          id: 'media-2',
          mediaType: 'image',
          publicUrl: null,
          reportId: 'report-2',
          springId: 'spring-1',
          storageBucket: 'report-media',
          storagePath: 'user-1/report-2/media-2.jpg',
          uploadState: 'uploaded',
          width: 1200,
        },
      ],
    });
    vi.mocked(springStatusProjectionRepository.upsert).mockImplementation(async (command) => ({
      ...command,
    }));

    const flow = new ModerateReportFlow(
      moderationQueueRepository,
      springReportRepository,
      springStatusProjectionRepository,
      queryInvalidator,
    );

    const result = await flow.submit({
      decision: 'approve',
      reportId: 'report-2',
    });

    expect(moderationQueueRepository.applyDecision).toHaveBeenCalledWith({
      decision: 'approve',
      reportId: 'report-2',
    });
    expect(springStatusProjectionRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        approvedReportCountConsidered: 2,
        derivedFromReportIds: ['report-2', 'report-1'],
        freshness: 'recent',
        latestApprovedReportAt: '2026-03-26T08:00:00.000Z',
        springId: 'spring-1',
        waterPresence: 'water',
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        decision: 'approve',
        reportId: 'report-2',
        springId: 'spring-1',
      }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(['public-spring-catalog']);
    expect(invalidateSpy).toHaveBeenCalledWith(['public-spring-detail', 'spring-1']);
    expect(invalidateSpy).toHaveBeenCalledWith(['staff-moderation-queue']);
    expect(invalidateSpy).toHaveBeenCalledWith(['staff-moderation-report-detail', 'report-2']);
    expect(invalidateSpy).toHaveBeenCalledWith(['staff-moderation-report-media', 'report-2']);
  });

  it('rejects a report and keeps the projection based only on previously approved reports', async () => {
    vi.mocked(moderationQueueRepository.getReviewByReportId).mockResolvedValue(
      makeReviewAggregate(),
    );
    vi.mocked(moderationQueueRepository.applyDecision).mockResolvedValue({
      actedAt: '2026-03-26T09:05:00.000Z',
      actorUserId: 'moderator-1',
      decision: 'reject',
      id: 'moderation-2',
      reasonCode: 'insufficient_evidence',
      reasonNote: 'אין תיעוד מספק',
      reportId: 'report-2',
    });
    vi.mocked(springReportRepository.listBySpringId).mockResolvedValue([
      rejectedTargetReport,
      approvedReport,
    ]);
    vi.mocked(springStatusProjectionRepository.getBySpringId).mockResolvedValue(null);
    vi.mocked(springReportRepository.listMediaByReportIds).mockResolvedValue({
      'report-2': [
        {
          byteSize: 1234,
          capturedAt: '2026-03-26T08:00:00.000Z',
          createdAt: '2026-03-26T08:05:00.000Z',
          exifStripped: true,
          height: 900,
          id: 'media-2',
          mediaType: 'image',
          publicUrl: null,
          reportId: 'report-2',
          springId: 'spring-1',
          storageBucket: 'report-media',
          storagePath: 'user-1/report-2/media-2.jpg',
          uploadState: 'uploaded',
          width: 1200,
        },
      ],
    });
    vi.mocked(springStatusProjectionRepository.upsert).mockImplementation(async (command) => ({
      ...command,
    }));

    const flow = new ModerateReportFlow(
      moderationQueueRepository,
      springReportRepository,
      springStatusProjectionRepository,
      queryInvalidator,
    );

    const result = await flow.submit({
      decision: 'reject',
      reasonCode: 'insufficient_evidence',
      reasonNote: 'אין תיעוד מספק',
      reportId: 'report-2',
    });

    expect(moderationQueueRepository.applyDecision).toHaveBeenCalledWith({
      decision: 'reject',
      reasonCode: 'insufficient_evidence',
      reasonNote: 'אין תיעוד מספק',
      reportId: 'report-2',
    });
    expect(springStatusProjectionRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        approvedReportCountConsidered: 1,
        derivedFromReportIds: ['report-1'],
        springId: 'spring-1',
        waterPresence: 'no_water',
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        decision: 'reject',
        reportId: 'report-2',
        springId: 'spring-1',
      }),
    );
  });

  it('keeps a newer cached projection instead of persisting a stale recomputation', async () => {
    vi.mocked(moderationQueueRepository.getReviewByReportId).mockResolvedValue(
      makeReviewAggregate(),
    );
    vi.mocked(moderationQueueRepository.applyDecision).mockResolvedValue({
      actedAt: '2026-03-26T09:00:00.000Z',
      actorUserId: 'admin-1',
      decision: 'approve',
      id: 'moderation-3',
      reasonCode: null,
      reasonNote: null,
      reportId: 'report-2',
    });
    vi.mocked(springReportRepository.listBySpringId).mockResolvedValue([
      approvedTargetReport,
      approvedReport,
    ]);
    vi.mocked(springReportRepository.listMediaByReportIds).mockResolvedValue({
      'report-2': [
        {
          byteSize: 1234,
          capturedAt: '2026-03-26T08:00:00.000Z',
          createdAt: '2026-03-26T08:05:00.000Z',
          exifStripped: true,
          height: 900,
          id: 'media-2',
          mediaType: 'image',
          publicUrl: null,
          reportId: 'report-2',
          springId: 'spring-1',
          storageBucket: 'report-media',
          storagePath: 'user-1/report-2/media-2.jpg',
          uploadState: 'uploaded',
          width: 1200,
        },
      ],
    });
    vi.mocked(springStatusProjectionRepository.getBySpringId).mockResolvedValue({
      approvedReportCountConsidered: 3,
      confidence: 'high',
      derivedFromReportIds: ['report-3', 'report-2', 'report-1'],
      freshness: 'recent',
      latestApprovedReportAt: '2026-03-26T09:30:00.000Z',
      recalculatedAt: '2026-03-26T09:30:00.000Z',
      springId: 'spring-1',
      waterPresence: 'water',
    });

    const flow = new ModerateReportFlow(
      moderationQueueRepository,
      springReportRepository,
      springStatusProjectionRepository,
      queryInvalidator,
    );

    const result = await flow.submit({
      decision: 'approve',
      reportId: 'report-2',
    });

    expect(springStatusProjectionRepository.upsert).not.toHaveBeenCalled();
    expect(result.projection.recalculatedAt).toBe('2026-03-26T09:30:00.000Z');
    expect(result.projection.derivedFromReportIds).toEqual(['report-3', 'report-2', 'report-1']);
  });
});
