import type {
  AuditEntryRecord,
  ModerationActionRecord,
  ModerationQueueItemRecord,
  ModerationReviewMediaRecord,
  ModerationReviewRecord,
  SpringLocationRecord,
  SpringMediaRecord,
  SpringRecord,
  SpringReportRecord,
  SpringStatusProjectionRecord,
  UserProfileRecord,
} from '@maayanhot/contracts';

export type UserProfile = Readonly<UserProfileRecord>;
export type SpringLocation = Readonly<SpringLocationRecord>;
export type Spring = Readonly<SpringRecord>;
export type SpringMedia = Readonly<SpringMediaRecord>;
export type SpringReport = Readonly<SpringReportRecord>;
export type ModerationAction = Readonly<ModerationActionRecord>;
export type ModerationQueueItem = Readonly<ModerationQueueItemRecord>;
export type ModerationReviewMedia = Readonly<ModerationReviewMediaRecord>;
export type ModerationReview = Readonly<ModerationReviewRecord>;
export type ModerationReviewAggregate = Readonly<{
  media: ModerationReviewMedia[];
  review: ModerationReview;
}>;
export type SpringStatusProjection = Readonly<SpringStatusProjectionRecord>;
export type AuditEntry = Readonly<AuditEntryRecord>;
