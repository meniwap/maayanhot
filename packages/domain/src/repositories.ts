import type {
  AuditedEntityType,
  BrowseSpringsQuery,
  CreateSpringCommand,
  IsoTimestampString,
  MediaId,
  GetSpringDetailQuery,
  ModerateReportCommand,
  ReportId,
  SpringId,
  UploadLifecycleState,
  SubmitSpringReportCommand,
  UserId,
} from '@maayanhot/contracts';

import type {
  AuditEntry,
  ModerationAction,
  ModerationQueueItem,
  ModerationReviewAggregate,
  Spring,
  SpringMedia,
  SpringReport,
  SpringStatusProjection,
  UserProfile,
} from './entities';

export type CursorPage<TItem> = {
  items: TItem[];
  nextCursor: string | null;
};

export type SpringBrowseItem = {
  spring: Spring;
  projection: SpringStatusProjection | null;
  coverMedia: SpringMedia | null;
};

export type SpringDetailAggregate = {
  spring: Spring;
  projection: SpringStatusProjection | null;
  approvedReports: SpringReport[];
  approvedMedia: SpringMedia[];
};

export type MediaSlotReservation = {
  capturedAt: IsoTimestampString | null;
  mediaId: MediaId;
  reportId: ReportId;
  springId: SpringId;
  storageBucket: string;
  storagePath: string;
  uploadState: UploadLifecycleState;
};

export type FinalizeReportMediaUploadCommand = {
  byteSize: number | null;
  capturedAt: IsoTimestampString | null;
  exifStripped: boolean;
  height: number | null;
  mediaId: MediaId;
  width: number | null;
};

export type UpsertSpringStatusProjectionCommand = {
  approvedReportCountConsidered: number;
  confidence: SpringStatusProjection['confidence'];
  derivedFromReportIds: ReportId[];
  freshness: SpringStatusProjection['freshness'];
  latestApprovedReportAt: IsoTimestampString | null;
  recalculatedAt: IsoTimestampString;
  springId: SpringId;
  waterPresence: SpringStatusProjection['waterPresence'];
};

export interface UserProfileRepository {
  getById(userId: UserId): Promise<UserProfile | null>;
  listByIds(userIds: UserId[]): Promise<UserProfile[]>;
}

export interface SpringRepository {
  browse(query: BrowseSpringsQuery): Promise<CursorPage<SpringBrowseItem>>;
  getDetail(query: GetSpringDetailQuery): Promise<SpringDetailAggregate | null>;
  create(command: CreateSpringCommand): Promise<Spring>;
  findExistingSlugs(baseSlug: string): Promise<string[]>;
}

export interface SpringReportRepository {
  getById(reportId: ReportId): Promise<SpringReport | null>;
  listBySpringId(springId: SpringId): Promise<SpringReport[]>;
  create(command: SubmitSpringReportCommand): Promise<SpringReport>;
  listMediaByReportIds(reportIds: ReportId[]): Promise<Record<ReportId, SpringMedia[]>>;
  reserveMediaSlot(input: {
    reportId: ReportId;
    clientMediaDraftId: string;
    fileExtension: string | null;
    capturedAt: IsoTimestampString | null;
  }): Promise<MediaSlotReservation>;
  finalizeMediaUpload(command: FinalizeReportMediaUploadCommand): Promise<SpringMedia>;
}

export interface ModerationQueueRepository {
  listPending(cursor?: string | null, limit?: number): Promise<CursorPage<ModerationQueueItem>>;
  getReviewByReportId(reportId: ReportId): Promise<ModerationReviewAggregate | null>;
  applyDecision(command: ModerateReportCommand): Promise<ModerationAction>;
}

export interface AuditLogRepository {
  append(entry: AuditEntry): Promise<AuditEntry>;
  listByEntity(entityType: AuditedEntityType, entityId: string): Promise<AuditEntry[]>;
}

export interface SpringStatusProjectionRepository {
  getBySpringId(springId: SpringId): Promise<SpringStatusProjection | null>;
  upsert(projection: UpsertSpringStatusProjectionCommand): Promise<SpringStatusProjection>;
}
