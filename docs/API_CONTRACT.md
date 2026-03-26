# API Contract

## Purpose

This file defines the contract boundary between shared serializable data, pure domain logic, and future infrastructure adapters.

Non-negotiable rule:

- `SpringReport` history is the source of truth
- public spring status is a derived projection
- moderation status, timestamps, and trust signals affect what becomes visible

## Package Ownership

- `packages/contracts`
  - shared serializable records, IDs, commands, and queries
  - safe to share across mobile, future admin-web, and future infrastructure
  - no React, React Native, Expo, Supabase, or provider imports
- `packages/domain`
  - read-only domain entities
  - pure business rules and permission guards
  - repository interfaces only, with no backend implementation
- `packages/map-core`
  - provider-neutral map contracts only
- `packages/navigation-core`
  - external navigation handoff contracts only
- `packages/upload-core`
  - upload pipeline contracts only

## Shared Contracts In `@maayanhot/contracts`

### Identifiers and primitives

- `UserId`
- `SpringId`
- `ReportId`
- `MediaId`
- `ModerationActionId`
- `AuditEntryId`
- `IsoTimestampString`
- `GeoPoint`
- `BoundingBox`

### Core unions

- `UserRole = 'user' | 'trusted_contributor' | 'moderator' | 'admin'`
- `ReportModerationStatus = 'pending' | 'approved' | 'rejected'`
- `ModerationDecision = 'approve' | 'reject'`
- `WaterPresence = 'water' | 'no_water' | 'unknown'`
- `ProjectionFreshness = 'recent' | 'stale' | 'none'`
- `ProjectionConfidence = 'low' | 'medium' | 'high'`
- `NavigationApp = 'apple_maps' | 'google_maps' | 'waze'`
- `UploadAssetKind = 'image'`

### Shared records

Key record groups now implemented:

- `UserProfileRecord`
- `SpringLocationRecord`
- `SpringRecord`
- `SpringMediaRecord`
- `SpringReportRecord`
- `ModerationActionRecord`
- `SpringStatusProjectionRecord`
- `AuditEntryRecord`

Important modeling notes:

- `SpringRecord` stores canonical spring metadata and location
- `SpringReportRecord` stores append-only evidence, not a mutable status flag
- `SpringReportRecord.reporterRoleSnapshot` is allowed so later infrastructure can preserve trust context at submission time
- `SpringStatusProjectionRecord` stores derived public status only; it is not the source of truth

### Query and command contracts

Implemented command/query shapes:

```ts
type BrowseSpringsQuery = {
  viewport?: BoundingBox;
  filters?: {
    waterPresence?: WaterPresence[];
    freshness?: Array<'recent' | 'stale'>;
    regionCodes?: string[];
  };
  cursor?: string | null;
  limit: number;
};

type GetSpringDetailQuery = {
  springId: SpringId;
  includePendingForModerator?: boolean;
};

type CreateSpringCommand = {
  slug: string;
  title: string;
  alternateNames: string[];
  location: SpringLocationRecord;
  regionCode?: string | null;
  accessNotes?: string | null;
  description?: string | null;
  isPublished?: boolean;
};

type SubmitSpringReportCommand = {
  springId: SpringId;
  observedAt: IsoTimestampString;
  waterPresence: WaterPresence;
  note?: string | null;
  locationEvidence?: ReportLocationEvidenceRecord;
  localMediaDraftIds?: string[];
};

type ModerateReportCommand = {
  reportId: ReportId;
  decision: ModerationDecision;
  reasonCode?: string | null;
  reasonNote?: string | null;
};
```

## Domain Layer In `@maayanhot/domain`

### Domain entities

The domain package exposes read-only entity aliases for:

- `UserProfile`
- `SpringLocation`
- `Spring`
- `SpringMedia`
- `SpringReport`
- `ModerationAction`
- `SpringStatusProjection`
- `AuditEntry`

### Pure rules and guards

Phase 3 ships these pure helpers:

- `filterApprovedReportsForPublicStatus`
- `deriveSpringStatusProjection`
- `defaultStatusDerivationPolicy`
- `canCreateSpring`
- `canModerateReports`

### Status derivation contract

The implemented baseline rule set is:

- only approved reports affect the public projection
- approved reports are sorted by `observedAt` descending before evaluation
- recency influences evidence weight through policy thresholds
- reporter role influences evidence weight through policy weights
- media, precise location evidence, and notes can increase evidence weight
- when there is no approved evidence, the result is:
  - `waterPresence = 'unknown'`
  - `freshness = 'none'`
  - `confidence = 'low'`
- the output includes:
  - `waterPresence`
  - `freshness`
  - `confidence`
  - `derivedFromReportIds`
  - `latestApprovedReportAt`
  - `approvedReportCountConsidered`
  - `recalculatedAt`

This is intentionally a configurable baseline policy, not the final production trust model from Phase 10.

### Repository ports

Implemented repository interfaces:

```ts
interface UserProfileRepository {
  getById(userId: UserId): Promise<UserProfile | null>;
  listByIds(userIds: UserId[]): Promise<UserProfile[]>;
}

interface SpringRepository {
  browse(query: BrowseSpringsQuery): Promise<CursorPage<SpringBrowseItem>>;
  getDetail(query: GetSpringDetailQuery): Promise<SpringDetailAggregate | null>;
  create(command: CreateSpringCommand): Promise<Spring>;
}

interface SpringReportRepository {
  getById(reportId: ReportId): Promise<SpringReport | null>;
  listBySpringId(springId: SpringId): Promise<SpringReport[]>;
  create(command: SubmitSpringReportCommand): Promise<SpringReport>;
  listMediaByReportIds(reportIds: ReportId[]): Promise<Record<ReportId, SpringMedia[]>>;
}

interface ModerationQueueRepository {
  listPending(cursor?: string | null, limit?: number): Promise<CursorPage<SpringReport>>;
  applyDecision(command: ModerateReportCommand): Promise<ModerationAction>;
}

interface AuditLogRepository {
  append(entry: AuditEntry): Promise<AuditEntry>;
  listByEntity(entityType: AuditedEntityType, entityId: string): Promise<AuditEntry[]>;
}

interface SpringStatusProjectionRepository {
  getBySpringId(springId: SpringId): Promise<SpringStatusProjection | null>;
  upsert(projection: SpringStatusProjection): Promise<SpringStatusProjection>;
}
```

Repository rules:

- interfaces are pure ports only
- no repository implementation may leak provider SDK objects through these boundaries
- UI must consume application-layer view models, not these repository ports directly

## Adapter Contracts

### `@maayanhot/map-core`

- `MapViewport`
- `MapMarkerDescriptor`
- `MapCameraRequest`
- `MapClusterDescriptor`
- `MapAdapter`

Rules:

- no MapLibre or Google-specific fields
- no React Native map view implementation in the contract package

### `@maayanhot/navigation-core`

- `NavigationDestination`
- `NavigationHandoffRequest`
- `ExternalNavigationAdapter`

Rules:

- app selection is explicit through `NavigationApp`
- no Apple/Google/Waze SDK logic exists in Phase 3

### `@maayanhot/upload-core`

- `UploadAssetDescriptor`
- `PendingUpload`
- `UploadResult`
- `UploadPolicy`
- `UploadAdapter`

Rules:

- no storage implementation
- no compression engine implementation
- no file-system or network provider logic

## UI Boundary Reminder

The domain and contract layer now use `waterPresence` terminology. The UI contract in `docs/UI_CONTRACT.md` still exposes `status.waterState` in view models for presenter ergonomics.

That mapping belongs in the future application/container layer.

UI must not:

- recalculate the projection
- infer moderation outcomes
- bypass repository or adapter contracts

## Naming And Future Infrastructure

- GitHub repository name: `maayanhot`
- Intended GitHub visibility: public
- Intended GitHub owner for this repo: `meniwap`
- Future Supabase project name: `maayanhot`

Phase 3 does not create or wire Supabase. It only locks the naming and boundary contract so later infrastructure can plug in without rewriting the domain layer.
