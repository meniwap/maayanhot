import { z } from 'zod';

export type UserId = string;
export type SpringId = string;
export type ReportId = string;
export type MediaId = string;
export type ModerationActionId = string;
export type AuditEntryId = string;
export type IsoTimestampString = string;

export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type BoundingBox = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type UserRole = 'user' | 'trusted_contributor' | 'moderator' | 'admin';
export type ReportModerationStatus = 'pending' | 'approved' | 'rejected';
export type ModerationDecision = 'approve' | 'reject';
export type ModerationReasonCode =
  | 'insufficient_evidence'
  | 'duplicate_submission'
  | 'abusive_or_invalid'
  | 'other';
export type WaterPresence = 'water' | 'no_water' | 'unknown';
export type ProjectionFreshness = 'recent' | 'stale' | 'none';
export type ProjectionConfidence = 'low' | 'medium' | 'high';
export type NavigationApp = 'apple_maps' | 'google_maps' | 'waze';
export type UploadAssetKind = 'image';
export type UploadLifecycleState = 'pending' | 'uploaded' | 'failed';
export type AuditedEntityType = 'spring' | 'report' | 'moderation_action' | 'role_assignment';

export type TrustSnapshotRecord = {
  approvedReportCount: number;
  rejectedReportCount: number;
  pendingReportCount: number;
  trustScore: number | null;
};

export type UserProfileRecord = {
  id: UserId;
  displayName: string | null;
  avatarUrl: string | null;
  primaryRole: UserRole;
  roleSet: UserRole[];
  createdAt: IsoTimestampString;
  lastActiveAt: IsoTimestampString | null;
  trustSnapshot: TrustSnapshotRecord;
};

export type SpringLocationRecord = GeoPoint & {
  precisionMeters: number | null;
};

export type SpringRecord = {
  id: SpringId;
  slug: string;
  title: string;
  alternateNames: string[];
  location: SpringLocationRecord;
  regionCode: string | null;
  accessNotes: string | null;
  description: string | null;
  createdByUserId: UserId;
  createdAt: IsoTimestampString;
  updatedAt: IsoTimestampString;
  isPublished: boolean;
};

export type SpringMediaRecord = {
  id: MediaId;
  springId: SpringId;
  reportId: ReportId;
  storageBucket: string;
  storagePath: string;
  publicUrl: string | null;
  width: number | null;
  height: number | null;
  byteSize: number | null;
  mediaType: UploadAssetKind;
  exifStripped: boolean;
  uploadState: UploadLifecycleState;
  createdAt: IsoTimestampString;
  capturedAt: IsoTimestampString | null;
};

export type ReportLocationEvidenceRecord = {
  latitude: number | null;
  longitude: number | null;
  precisionMeters: number | null;
};

export type SpringReportRecord = {
  id: ReportId;
  springId: SpringId;
  reporterUserId: UserId;
  observedAt: IsoTimestampString;
  submittedAt: IsoTimestampString;
  waterPresence: WaterPresence;
  note: string | null;
  locationEvidence: ReportLocationEvidenceRecord;
  moderationStatus: ReportModerationStatus;
  mediaIds: MediaId[];
  reporterRoleSnapshot: UserRole | null;
};

export type ModerationActionRecord = {
  id: ModerationActionId;
  reportId: ReportId;
  actorUserId: UserId;
  decision: ModerationDecision;
  reasonCode: ModerationReasonCode | null;
  reasonNote: string | null;
  actedAt: IsoTimestampString;
};

export type ModerationQueueItemRecord = {
  reportId: ReportId;
  springId: SpringId;
  springSlug: string;
  springTitle: string;
  regionCode: string | null;
  observedAt: IsoTimestampString;
  submittedAt: IsoTimestampString;
  waterPresence: WaterPresence;
  note: string | null;
  reporterRoleSnapshot: UserRole | null;
  photoCount: number;
};

export type ModerationReviewRecord = ModerationQueueItemRecord & {
  accessNotes: string | null;
  description: string | null;
};

export type ModerationReviewMediaRecord = {
  id: MediaId;
  springId: SpringId;
  reportId: ReportId;
  storageBucket: string;
  storagePath: string;
  mediaType: UploadAssetKind;
  width: number | null;
  height: number | null;
  byteSize: number | null;
  capturedAt: IsoTimestampString | null;
  createdAt: IsoTimestampString;
  sortOrder: number;
  uploadState: UploadLifecycleState;
};

export type SpringStatusProjectionRecord = {
  springId: SpringId;
  waterPresence: WaterPresence;
  freshness: ProjectionFreshness;
  confidence: ProjectionConfidence;
  latestApprovedReportAt: IsoTimestampString | null;
  derivedFromReportIds: ReportId[];
  approvedReportCountConsidered: number;
  recalculatedAt: IsoTimestampString;
};

export type AuditEntryRecord = {
  id: AuditEntryId;
  actorUserId: UserId;
  entityType: AuditedEntityType;
  entityId: string;
  action: string;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestampString;
};

export type BrowseSpringsQuery = {
  viewport?: BoundingBox;
  filters?: {
    waterPresence?: WaterPresence[];
    freshness?: Array<Exclude<ProjectionFreshness, 'none'>>;
    regionCodes?: string[];
  };
  cursor?: string | null;
  limit: number;
};

export type GetSpringDetailQuery = {
  springId: SpringId;
  includePendingForModerator?: boolean;
};

export type CreateSpringCommand = {
  slug: string;
  title: string;
  alternateNames: string[];
  location: SpringLocationRecord;
  regionCode?: string | null;
  accessNotes?: string | null;
  description?: string | null;
  isPublished?: boolean;
};

export type UpdateSpringCommand = {
  springId: SpringId;
  slug: string;
  title: string;
  alternateNames: string[];
  location: SpringLocationRecord;
  regionCode?: string | null;
  accessNotes?: string | null;
  description?: string | null;
  isPublished?: boolean;
};

export type SubmitSpringReportCommand = {
  clientSubmissionId: string;
  springId: SpringId;
  observedAt: IsoTimestampString;
  waterPresence: WaterPresence;
  note?: string | null;
  locationEvidence?: ReportLocationEvidenceRecord;
  localMediaDraftIds?: string[];
};

export type ModerateReportCommand = {
  reportId: ReportId;
  decision: ModerationDecision;
  reasonCode?: ModerationReasonCode | null;
  reasonNote?: string | null;
};

export const isoTimestampStringSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Expected an ISO-compatible timestamp');

export const geoPointSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const springLocationRecordSchema = geoPointSchema.extend({
  precisionMeters: z.number().int().positive().nullable(),
});

export const reportLocationEvidenceRecordSchema = z.object({
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  precisionMeters: z.number().int().positive().nullable(),
});

const springSlugSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const moderationReasonCodeSchema = z.enum([
  'insufficient_evidence',
  'duplicate_submission',
  'abusive_or_invalid',
  'other',
]);

export const createSpringCommandSchema = z.object({
  accessNotes: z.string().trim().max(500).nullable().optional(),
  alternateNames: z.array(z.string().trim().min(1).max(120)).max(12),
  description: z.string().trim().max(3000).nullable().optional(),
  isPublished: z.boolean().optional(),
  location: springLocationRecordSchema,
  regionCode: z.string().trim().max(64).nullable().optional(),
  slug: springSlugSchema,
  title: z.string().trim().min(1).max(120),
});

export const updateSpringCommandSchema = createSpringCommandSchema.extend({
  springId: z.string().trim().min(1),
});

export const submitSpringReportCommandSchema = z.object({
  clientSubmissionId: z.string().trim().uuid(),
  localMediaDraftIds: z.array(z.string().trim().min(1)).max(8).optional(),
  locationEvidence: reportLocationEvidenceRecordSchema.optional(),
  note: z.string().trim().max(2000).nullable().optional(),
  observedAt: isoTimestampStringSchema,
  springId: z.string().trim().min(1),
  waterPresence: z.enum(['water', 'no_water', 'unknown']),
});

export const moderateReportCommandSchema = z
  .object({
    decision: z.enum(['approve', 'reject']),
    reasonCode: moderationReasonCodeSchema.nullable().optional(),
    reasonNote: z.string().trim().max(1000).nullable().optional(),
    reportId: z.string().trim().min(1),
  })
  .superRefine((value, ctx) => {
    if (value.decision === 'reject' && !value.reasonCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A rejection reason code is required when rejecting a report.',
        path: ['reasonCode'],
      });
    }

    if (value.decision === 'approve' && value.reasonCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Approve actions must not include a rejection reason code.',
        path: ['reasonCode'],
      });
    }
  });
