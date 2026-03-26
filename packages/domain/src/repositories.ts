import type {
  AuditedEntityType,
  BrowseSpringsQuery,
  CreateSpringCommand,
  GetSpringDetailQuery,
  ModerateReportCommand,
  ReportId,
  SpringId,
  SubmitSpringReportCommand,
  UserId,
} from '@maayanhot/contracts';

import type {
  AuditEntry,
  ModerationAction,
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

export interface UserProfileRepository {
  getById(userId: UserId): Promise<UserProfile | null>;
  listByIds(userIds: UserId[]): Promise<UserProfile[]>;
}

export interface SpringRepository {
  browse(query: BrowseSpringsQuery): Promise<CursorPage<SpringBrowseItem>>;
  getDetail(query: GetSpringDetailQuery): Promise<SpringDetailAggregate | null>;
  create(command: CreateSpringCommand): Promise<Spring>;
}

export interface SpringReportRepository {
  getById(reportId: ReportId): Promise<SpringReport | null>;
  listBySpringId(springId: SpringId): Promise<SpringReport[]>;
  create(command: SubmitSpringReportCommand): Promise<SpringReport>;
  listMediaByReportIds(reportIds: ReportId[]): Promise<Record<ReportId, SpringMedia[]>>;
}

export interface ModerationQueueRepository {
  listPending(cursor?: string | null, limit?: number): Promise<CursorPage<SpringReport>>;
  applyDecision(command: ModerateReportCommand): Promise<ModerationAction>;
}

export interface AuditLogRepository {
  append(entry: AuditEntry): Promise<AuditEntry>;
  listByEntity(entityType: AuditedEntityType, entityId: string): Promise<AuditEntry[]>;
}

export interface SpringStatusProjectionRepository {
  getBySpringId(springId: SpringId): Promise<SpringStatusProjection | null>;
  upsert(projection: SpringStatusProjection): Promise<SpringStatusProjection>;
}
