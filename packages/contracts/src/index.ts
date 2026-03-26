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
  reasonCode: string | null;
  reasonNote: string | null;
  actedAt: IsoTimestampString;
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

export type SubmitSpringReportCommand = {
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
  reasonCode?: string | null;
  reasonNote?: string | null;
};
