import type {
  AuditEntryRecord,
  BrowseSpringsQuery,
  CreateSpringCommand,
  GetSpringDetailQuery,
  ModerateReportCommand,
  ModerationQueueItemRecord,
  ModerationReviewRecord,
  SpringReportRecord,
  SubmitSpringReportCommand,
  UserProfileRecord,
} from '@maayanhot/contracts';
import type {
  AuditLogRepository,
  CursorPage,
  ModerationQueueItem,
  ModerationReviewAggregate,
  SpringBrowseItem,
  SpringDetailAggregate,
  SpringReportRepository,
  SpringRepository,
  SpringStatusProjection,
  SpringStatusProjectionRepository,
  UserProfileRepository,
  ModerationQueueRepository,
  Spring,
  SpringMedia,
  SpringReport,
  UserProfile,
} from '@maayanhot/domain';
import type { MapAdapter } from '@maayanhot/map-core';
import type { ExternalNavigationAdapter } from '@maayanhot/navigation-core';
import type { PrivateMediaPreviewAdapter, UploadAdapter } from '@maayanhot/upload-core';
import { describe, expect, expectTypeOf, it } from 'vitest';

const sampleProfile: UserProfile = {
  id: 'user-1',
  displayName: 'נועה',
  avatarUrl: null,
  primaryRole: 'moderator',
  roleSet: ['moderator'],
  createdAt: '2026-03-01T08:00:00.000Z',
  lastActiveAt: '2026-03-26T08:00:00.000Z',
  trustSnapshot: {
    approvedReportCount: 12,
    rejectedReportCount: 1,
    pendingReportCount: 2,
    trustScore: 0.92,
  },
};

const sampleSpring: Spring = {
  id: 'spring-1',
  slug: 'ein-karem',
  title: 'עין כרם',
  alternateNames: ['Ein Karem'],
  location: {
    latitude: 31.771959,
    longitude: 35.219734,
    precisionMeters: 8,
  },
  regionCode: 'jerusalem',
  accessNotes: 'ירידה קצרה בשביל',
  description: 'מעיין לדוגמה עבור בדיקות חוזה.',
  createdByUserId: 'user-1',
  createdAt: '2026-03-01T08:00:00.000Z',
  updatedAt: '2026-03-26T08:00:00.000Z',
  isPublished: true,
};

const sampleReport: SpringReport = {
  id: 'report-1',
  springId: 'spring-1',
  reporterUserId: 'user-1',
  observedAt: '2026-03-24T08:00:00.000Z',
  submittedAt: '2026-03-24T08:30:00.000Z',
  waterPresence: 'water',
  note: 'יש זרימה חלשה.',
  locationEvidence: {
    latitude: 31.771959,
    longitude: 35.219734,
    precisionMeters: 15,
  },
  moderationStatus: 'approved',
  mediaIds: ['media-1'],
  reporterRoleSnapshot: 'moderator',
};

const sampleMedia: SpringMedia = {
  id: 'media-1',
  springId: 'spring-1',
  reportId: 'report-1',
  storageBucket: 'report-media',
  storagePath: 'reports/report-1/cover.jpg',
  publicUrl: 'https://example.com/report-1.jpg',
  width: 1200,
  height: 900,
  byteSize: 210000,
  mediaType: 'image',
  exifStripped: true,
  uploadState: 'uploaded',
  createdAt: '2026-03-24T08:31:00.000Z',
  capturedAt: '2026-03-24T08:00:00.000Z',
};

const sampleProjection: SpringStatusProjection = {
  springId: 'spring-1',
  waterPresence: 'water',
  freshness: 'recent',
  confidence: 'high',
  latestApprovedReportAt: '2026-03-24T08:00:00.000Z',
  derivedFromReportIds: ['report-1'],
  approvedReportCountConsidered: 1,
  recalculatedAt: '2026-03-26T08:45:00.000Z',
};

const sampleAuditEntry: AuditEntryRecord = {
  id: 'audit-1',
  actorUserId: 'user-1',
  entityType: 'report',
  entityId: 'report-1',
  action: 'moderation.approved',
  metadata: {
    reasonCode: null,
  },
  createdAt: '2026-03-24T08:40:00.000Z',
};

const sampleBrowsePage: CursorPage<SpringBrowseItem> = {
  items: [
    {
      spring: sampleSpring,
      projection: sampleProjection,
      coverMedia: sampleMedia,
    },
  ],
  nextCursor: null,
};

const sampleDetailAggregate: SpringDetailAggregate = {
  spring: sampleSpring,
  projection: sampleProjection,
  approvedReports: [sampleReport],
  approvedMedia: [sampleMedia],
};

const userProfileRepository = {
  getById: async () => sampleProfile,
  listByIds: async () => [sampleProfile],
} satisfies UserProfileRepository;

const springRepository = {
  browse: async (query: BrowseSpringsQuery) => {
    void query;

    return sampleBrowsePage;
  },
  getDetail: async (query: GetSpringDetailQuery) => {
    void query;

    return sampleDetailAggregate;
  },
  create: async (command: CreateSpringCommand) => {
    void command;

    return sampleSpring;
  },
  getManagedById: async (springId: string) => {
    void springId;

    return sampleBrowsePage.items[0] ?? null;
  },
  listManaged: async () => sampleBrowsePage,
  update: async (command) => {
    void command;

    return sampleSpring;
  },
  findExistingSlugs: async (baseSlug: string, excludeSpringId?: string | null) => {
    void baseSlug;
    void excludeSpringId;

    return ['ein-karem'];
  },
} satisfies SpringRepository;

const springReportRepository = {
  getById: async (reportId: string) => {
    void reportId;

    return sampleReport;
  },
  listBySpringId: async (springId: string) => {
    void springId;

    return [sampleReport];
  },
  create: async (command: SubmitSpringReportCommand) => {
    void command;

    return sampleReport;
  },
  listMediaByReportIds: async () => ({
    'report-1': [sampleMedia],
  }),
  reserveMediaSlot: async (input: Parameters<SpringReportRepository['reserveMediaSlot']>[0]) => {
    void input;

    return {
      capturedAt: sampleMedia.capturedAt,
      mediaId: sampleMedia.id,
      reportId: sampleMedia.reportId,
      springId: sampleMedia.springId,
      storageBucket: sampleMedia.storageBucket,
      storagePath: sampleMedia.storagePath,
      uploadState: 'pending',
    };
  },
  finalizeMediaUpload: async (
    command: Parameters<SpringReportRepository['finalizeMediaUpload']>[0],
  ) => {
    void command;

    return sampleMedia;
  },
} satisfies SpringReportRepository;

const moderationQueueRepository = {
  listPending: async () => ({
    items: [
      {
        reportId: 'report-1',
        springId: 'spring-1',
        springSlug: 'ein-karem',
        springTitle: 'עין כרם',
        regionCode: 'jerusalem',
        observedAt: '2026-03-24T08:00:00.000Z',
        submittedAt: '2026-03-24T08:30:00.000Z',
        waterPresence: 'water',
        note: 'יש זרימה חלשה.',
        reporterRoleSnapshot: 'moderator',
        photoCount: 1,
      },
    ],
    nextCursor: null,
  }),
  getReviewByReportId: async () => ({
    media: [
      {
        id: 'media-1',
        springId: 'spring-1',
        reportId: 'report-1',
        storageBucket: 'report-media',
        storagePath: 'reports/report-1/cover.jpg',
        mediaType: 'image',
        width: 1200,
        height: 900,
        byteSize: 210000,
        capturedAt: '2026-03-24T08:00:00.000Z',
        createdAt: '2026-03-24T08:31:00.000Z',
        sortOrder: 0,
        uploadState: 'uploaded',
      },
    ],
    review: {
      reportId: 'report-1',
      springId: 'spring-1',
      springSlug: 'ein-karem',
      springTitle: 'עין כרם',
      regionCode: 'jerusalem',
      observedAt: '2026-03-24T08:00:00.000Z',
      submittedAt: '2026-03-24T08:30:00.000Z',
      waterPresence: 'water',
      note: 'יש זרימה חלשה.',
      reporterRoleSnapshot: 'moderator',
      photoCount: 1,
      accessNotes: 'ירידה קצרה בשביל',
      description: 'מעיין לדוגמה עבור בדיקות חוזה.',
    },
  }),
  applyDecision: async (command: ModerateReportCommand) => {
    void command;

    return {
      id: 'moderation-1',
      reportId: 'report-1',
      actorUserId: 'user-1',
      decision: 'approve',
      reasonCode: null,
      reasonNote: null,
      actedAt: '2026-03-24T08:35:00.000Z',
    };
  },
} satisfies ModerationQueueRepository;

const auditLogRepository = {
  append: async (entry: AuditEntryRecord) => entry,
  listByEntity: async () => [sampleAuditEntry],
} satisfies AuditLogRepository;

const springStatusProjectionRepository = {
  getBySpringId: async () => sampleProjection,
  upsert: async (projection: Parameters<SpringStatusProjectionRepository['upsert']>[0]) => ({
    ...sampleProjection,
    ...projection,
  }),
} satisfies SpringStatusProjectionRepository;

const mapAdapter = {
  CoordinatePickerSurface: (() => null) as MapAdapter['CoordinatePickerSurface'],
  Surface: (() => null) as MapAdapter['Surface'],
} satisfies MapAdapter;

const navigationAdapter = {
  canOpen: async () => true,
  open: async () => undefined,
} satisfies ExternalNavigationAdapter;

const uploadAdapter = {
  validate: () => undefined,
  upload: async () => ({
    mediaId: 'media-1',
    kind: 'image',
    storagePath: 'reports/report-1/cover.jpg',
    publicUrl: 'https://example.com/report-1.jpg',
    byteSize: 210000,
    width: 1200,
    height: 900,
    exifStripped: true,
  }),
  retry: async () => ({
    mediaId: 'media-1',
    kind: 'image',
    storagePath: 'reports/report-1/cover.jpg',
    publicUrl: 'https://example.com/report-1.jpg',
    byteSize: 210000,
    width: 1200,
    height: 900,
    exifStripped: true,
  }),
} satisfies UploadAdapter;

const privateMediaPreviewAdapter = {
  createSignedPreviewUrl: async () => ({
    expiresInSeconds: 900,
    signedUrl: 'https://example.com/report-1.jpg?token=signed',
    storageBucket: 'report-media',
    storagePath: 'reports/report-1/cover.jpg',
  }),
} satisfies PrivateMediaPreviewAdapter;

describe('contract and adapter port conformance', () => {
  it('keeps repository interfaces aligned to the shared contract layer', () => {
    expectTypeOf(userProfileRepository).toMatchTypeOf<UserProfileRepository>();
    expectTypeOf(springRepository).toMatchTypeOf<SpringRepository>();
    expectTypeOf(springReportRepository).toMatchTypeOf<SpringReportRepository>();
    expectTypeOf(moderationQueueRepository).toMatchTypeOf<ModerationQueueRepository>();
    expectTypeOf(auditLogRepository).toMatchTypeOf<AuditLogRepository>();
    expectTypeOf(
      springStatusProjectionRepository,
    ).toMatchTypeOf<SpringStatusProjectionRepository>();
    expectTypeOf(sampleBrowsePage).toMatchTypeOf<CursorPage<SpringBrowseItem>>();
    expectTypeOf(sampleDetailAggregate).toMatchTypeOf<
      Exclude<Awaited<ReturnType<typeof springRepository.getDetail>>, null>
    >();
    expect(true).toBe(true);
  });

  it('keeps provider-neutral adapter ports aligned', () => {
    expectTypeOf(mapAdapter).toMatchTypeOf<MapAdapter>();
    expectTypeOf(navigationAdapter).toMatchTypeOf<ExternalNavigationAdapter>();
    expectTypeOf(uploadAdapter).toMatchTypeOf<UploadAdapter>();
    expectTypeOf(privateMediaPreviewAdapter).toMatchTypeOf<PrivateMediaPreviewAdapter>();
    expect(true).toBe(true);
  });

  it('keeps domain aliases structurally compatible with the shared records', () => {
    expectTypeOf<UserProfile>().toEqualTypeOf<Readonly<UserProfileRecord>>();
    expectTypeOf<SpringReport>().toEqualTypeOf<Readonly<SpringReportRecord>>();
    expectTypeOf<ModerationQueueItem>().toEqualTypeOf<Readonly<ModerationQueueItemRecord>>();
    expectTypeOf<ModerationReviewAggregate['review']>().toEqualTypeOf<
      Readonly<ModerationReviewRecord>
    >();
    expectTypeOf(sampleAuditEntry).toMatchTypeOf<AuditEntryRecord>();
    expect(true).toBe(true);
  });
});
