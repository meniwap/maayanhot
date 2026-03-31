# UI Contract

## Purpose

This file defines the UI surface area, screen responsibilities, and the stable data shapes that the mobile app should consume. It exists so UI-focused work can move quickly without silently breaking domain or backend contracts.

## UI Design Rules

- Screens stay thin.
- Presentational components do not call Supabase, storage APIs, map providers, or platform APIs directly.
- Feature containers orchestrate data loading, mutations, navigation, permissions, and error handling.
- Shared components accept view-model data, not raw backend rows.
- Styling must flow through tokens and component variants from `docs/THEMING.md`.

## Planned Mobile Navigation Structure

The route structure below is planned for `expo-router`. Exact filenames belong to Phase 1+, but the contract should not change casually.

- Root app shell
  - map browse screen
  - spring detail screen
  - report compose flow
  - photo preview modal
  - auth and profile area
- Role-gated areas
  - admin create/edit spring flow
  - moderator review queue
  - contributor history/profile area

## Planned Screen Inventory

| Screen              | Purpose                                              | Container responsibilities                                                       | Presenter responsibilities                                                               |
| ------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Map Browse          | Browse springs on a map and select one               | fetch viewport data, handle filters, marker selection, loading/errors            | render map chrome, chips, marker legend, and selected spring teaser                      |
| Spring Detail       | Show canonical spring information and current status | fetch detail view, prepare status view model, handle external navigation action  | render hero/gallery/status summary, approved-photo gallery, and approved-history summary |
| Report Compose      | Submit a field report for a spring                   | validate draft, manage permission prompts, orchestrate uploads and submit action | render form fields, photo picker state, validation messaging                             |
| Photo Preview       | Inspect an image attached to a spring or draft       | supply media source and dismissal behavior                                       | render zoomable or full-screen media presentation                                        |
| Profile / Auth      | Show user identity, role, contribution state         | load current profile and capability flags                                        | render profile cards, contribution summaries, settings rows                              |
| Admin Spring Editor | Create or edit a spring as an authorized role        | load/save spring form, gate unauthorized access                                  | render structured spring form UI                                                         |
| Moderation Queue    | Review pending reports                               | fetch queue, trigger approve/reject mutations, surface audit context             | render report cards, moderation actions, decision reasons                                |
| Moderation Review   | Review one pending report in detail                  | load review aggregate, generate private previews, submit approve/reject actions  | render staff-only review context, photo previews, and decision controls                  |

## Current Route Baseline

- `apps/mobile/app/index.tsx` is now the Phase 6 default map-browse route.
- `apps/mobile/app/foundation-showcase.tsx` keeps the old token/theme proof surface available as an internal non-product route.
- `apps/mobile/app/springs/[springId].tsx` is now the dedicated Phase 7 spring-detail route.
- `apps/mobile/app/dev/session.tsx` is now the development-only real-session switcher route.
- `apps/mobile/app/admin/springs/new.tsx` is now the admin create-spring route.
- `apps/mobile/app/springs/[springId]/report.tsx` is now the authenticated report-compose route.
- `apps/mobile/app/moderation/queue.tsx` is now the staff-only moderation queue route.
- `apps/mobile/app/moderation/reports/[reportId].tsx` is now the staff-only moderation review route.
- `apps/mobile/app/about.tsx` is now the release-facing beta information route.
- `apps/mobile/app/legal/privacy.tsx` and `apps/mobile/app/legal/terms.tsx` are now placeholder legal routes for beta/store readiness.
- The default map-browse route renders:
  - shared discovery controls
  - a map/list view toggle
  - marker selection state
  - a lightweight selected-spring teaser card in map mode
  - a public-safe results list in list mode
- The teaser may route into the dedicated detail screen, but it must not expand into full detail content in-place.
- Phase 12 list/map coordination rules:
  - search, filters, and sort state are shared across both views
  - selecting a list result returns the user to map mode with the same spring selected
  - switching views must not reset the current discovery context
- The Phase 7 spring-detail route renders:
  - read-only public-safe spring metadata
  - current derived public status
  - approved/public-safe image gallery
  - approved/public-safe report history summary
  - external navigation handoff actions only
- The Phase 7 read flow does not render:
  - report compose UI
  - moderation UI
  - upload UI
  - write/edit capabilities
  - raw report or moderation data
- The Phase 8 write flow renders:
  - development-only session switching
  - admin-gated create-spring form
  - authenticated report-compose form
  - photo attachment state
  - pending-moderation feedback only
- The Phase 8 write flow must not render:
  - moderation queue UI
  - approve/reject controls
  - trust-management UI
  - raw storage/provider internals
- Phase 11 offline-lite adds:
  - cached rendering for previously loaded public browse/detail data
  - inline local delivery state for queued report submissions
  - offline save semantics for the report-compose route
- Phase 11 offline-lite must not add:
  - offline tiles
  - queued admin spring creation
  - background sync UX
  - public exposure of queued, pending, or rejected content
- Phase 14 hardening adds:
  - explicit attachment outcomes in report compose:
    - accepted unchanged
    - optimized once before upload
    - rejected after one-pass optimization if still too large
  - clearer local-only delivery messaging in spring detail for:
    - retry scheduled
    - finalize pending
    - permanent failure
    - too-large-after-optimization
- Phase 15 release polish adds:
  - a first-run onboarding card on the map browse shell
  - a release-facing about / beta-info route reachable from the browse shell
  - privacy and terms placeholder routes with explicit placeholder labeling
  - no new public/mobile exposure of moderation, trust, or internal admin data

## Admin Web Baseline

Phase 13 adds a separate Next.js App Router admin surface under `apps/admin-web`.

Current admin-web routes:

- `/login`
- `/admin`
- `/admin/springs`
- `/admin/springs/new`
- `/admin/springs/[springId]/edit`
- `/admin/moderation`
- `/admin/moderation/[reportId]`

Role gating rules:

- unauthenticated users are redirected to `/login`
- only `admin` may access spring-management routes
- `moderator` and `admin` may access moderation routes
- unauthorized users must see an explicit restricted state rather than a silent redirect loop

Phase 13 admin spring-management scope:

- bounded list of canonical springs for management
- create spring
- edit spring
- publish / unpublish through the canonical admin RPC path

Phase 13 admin spring-management must not add:

- delete flow
- bulk actions
- contributor management
- analytics / ops dashboards

Phase 13 moderation-web scope:

- queue list of pending reports only
- single-report review page
- private media previews for staff review
- approve / reject actions through the shared moderation use-case path

Phase 13 moderation-web must not add:

- ad hoc direct moderation writes
- raw table browsing outside the authorized workflow
- public/mobile exposure of staff-only review data
- vendor-specific analytics or crash SDK logic in presentational components

## Container / Presenter Boundary

Containers may:

- call repositories and services
- transform domain entities into UI view models
- own `TanStack Query` hooks and mutation orchestration
- own platform permission flows
- own navigation decisions
- emit observability hooks through app-local abstractions

Presenters may:

- render a provided view model
- emit user intents through callbacks
- use theme tokens and variants
- handle local ephemeral UI details such as controlled input focus or accordion state

Presenters may not:

- import repository implementations
- import Supabase clients
- make network requests
- open external apps directly
- compute business rules like trust progression or spring status derivation
- call observability vendors directly

Phase 13 web note:

- admin-web presentational components are web-local and token-driven
- admin-web does not import the React Native `packages/ui` primitives directly
- provider and Supabase details stay inside app-local admin-web infrastructure and feature containers

## Stable UI View Models

These shapes are the contract between domain/application layers and UI. They may expand, but breaking changes require documentation updates first.

### `SpringSummaryVM`

```ts
type SpringSummaryVM = {
  id: string;
  slug: string;
  title: string;
  regionLabel: string | null;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  status: {
    waterState: 'water' | 'no_water' | 'unknown';
    freshness: 'recent' | 'stale' | 'none';
    label: string;
    lastApprovedObservationAt: string | null;
  };
  coverImageUrl: string | null;
  distanceMeters?: number | null;
  isAccessibleByCurrentUser: boolean;
};
```

Phase 6 note:

- the current map-browse shell now derives `SpringSummaryVM` from repository-backed rows that mirror `public.public_spring_catalog`
- the browse screen still must not import raw report, moderation, or storage rows directly

### `SpringDetailVM`

```ts
type SpringDetailVM = {
  id: string;
  slug: string;
  title: string;
  alternateNames: string[];
  locationLabel: string | null;
  regionLabel: string | null;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  accessNotes: string | null;
  description: string | null;
  status: {
    waterState: 'water' | 'no_water' | 'unknown';
    freshness: 'recent' | 'stale' | 'none';
    label: string;
    freshnessLabel: string;
    confidenceLabel: string;
    lastApprovedObservationAt: string | null;
    approvedHistoryCount: number;
  };
  gallery: Array<{
    id: string;
    url: string;
    alt: string | null;
    capturedAt: string | null;
  }>;
  historySummary: Array<{
    reportId: string;
    observedAt: string;
    waterState: 'water' | 'no_water' | 'unknown';
    label: string;
    photoCount: number;
  }>;
};
```

Phase 7 detail note:

- `SpringDetailVM` is public-safe and read-only in this phase
- it must not expose moderator identities, reviewer notes, trust labels, audit metadata, or raw moderation states
- external navigation providers are triggered through callbacks and `packages/navigation-core`, not by embedding provider URLs or SDK calls in presenters
- the current detail screen now receives repository-backed public-safe data rather than local product fixtures

### `ReportDraftVM`

```ts
type ReportDraftVM = {
  springId: string;
  observedAt: string;
  waterState: 'water' | 'no_water' | 'unknown';
  note: string;
  selectedMedia: Array<{
    localId: string;
    uri: string;
    width?: number;
    height?: number;
    fileSizeBytes?: number;
  }>;
};
```

Phase 11 delivery note:

- the compose flow still renders `ReportDraftVM`, but delivery state is now queue-aware
- offline submit becomes a local queue save rather than a hard error
- attachment removal and retry/discard actions remain local-delivery concerns, not public history data

## Phase 11 Offline-Lite Screen Rules

Map Browse:

- may render previously loaded public catalog data while offline
- must clearly signal that the data is cached/stale
- must not imply offline map-tile support
- may keep client-side discovery working on the cached catalog rows only
- must not persist or expose private/staff browse data just to support discovery

Spring Detail:

- may render previously loaded public detail data while offline
- may render an inline local-only queue/delivery card for the current user and spring
- must keep queued local note text and local delivery state out of the approved public history summary

Report Compose:

- may save a validated report draft locally when offline
- must use the shared queue-aware flow service rather than screen-local retry logic
- must treat attachments as copied local files owned by the queue until replay succeeds or the draft is discarded

Admin Spring Editor:

- remains online-only in Phase 11
- must show an explicit connection-required state when offline
- must not enqueue admin writes locally

### `ModerationQueueItemVM`

```ts
type ModerationQueueItemVM = {
  reportId: string;
  springId: string;
  springSlug: string;
  springTitle: string;
  regionLabel: string | null;
  submittedAt: string;
  observedAt: string;
  reporterRoleSnapshot: 'user' | 'trusted_contributor' | 'moderator' | 'admin' | null;
  waterState: 'water' | 'no_water' | 'unknown';
  photoCount: number;
  note: string | null;
};
```

### `ModerationReviewVM`

```ts
type ModerationReviewVM = {
  reportId: string;
  springId: string;
  springSlug: string;
  springTitle: string;
  regionLabel: string | null;
  accessNotes: string | null;
  description: string | null;
  submittedAt: string;
  observedAt: string;
  reporterRoleSnapshot: 'user' | 'trusted_contributor' | 'moderator' | 'admin' | null;
  waterState: 'water' | 'no_water' | 'unknown';
  note: string | null;
  photoCount: number;
  media: Array<{
    id: string;
    storageBucket: string;
    storagePath: string;
    previewUrl: string | null;
    capturedAt: string | null;
  }>;
};
```

## Shared Component Expectations

Phase 2 shipped reusable presentational components:

- `Screen`
- `AppText`
- `Stack` / `Inline`
- `Card`
- `Button`
- `Chip`
- `StatusBadge`

These components are design-token driven and business-logic free.

Shipped in Phase 8 for write flows:

- `TextField`
- `TextAreaField`
- `PhotoTile`

Still deferred:

- `IconButton`
- `EmptyState`
- `ErrorState`
- `LoadingState`

Shipped form/media primitives remain presentational only. They must not gain direct repository, Supabase, storage, or platform side effects.

## Shell Proof Surface

- `apps/mobile/app/foundation-showcase.tsx` is now the shell-only foundation showcase.
- It still exists only to prove theme swapping, RTL-aware composition, typography, spacing, and primitive usage.
- It is not a product feature screen and must not gain repositories, backend calls, domain logic, map logic, upload logic, or moderation behavior.

## Phase 6 And Phase 7 Browse/Read Notes

- The selected marker interaction is intentionally teaser-only in Phase 6.
- The teaser may show:
  - spring title
  - region label
  - public-safe derived status label
  - last approved observation date if available
- The teaser must not show:
  - raw reports
  - moderation internals
  - uploader identity
  - admin or moderation actions
- The dedicated Phase 7 detail route may show:
  - canonical public-safe spring fields
  - current derived public status
  - approved/public-safe gallery items
  - approved/public-safe history summary rows
  - external navigation buttons that emit app ids through callbacks
  - an authenticated report-entry button that routes into the Phase 8 report compose flow
- The dedicated Phase 7 detail route must not show:
  - raw unapproved report notes
  - reviewer identity
  - trust labels
  - audit metadata
  - moderation controls
- The route must consume `packages/navigation-core` and other abstractions only, not direct provider SDK imports.
- Clustering is intentionally not enabled in Phase 6.

## State Ownership Rules

- Server-backed canonical data belongs in repositories and query caches.
- Local cross-screen UI state belongs in scoped Zustand stores only when it is not domain truth.
- Form drafts belong to feature-local state or draft abstractions, not global domain stores.
- Status derivation and role/trust calculations belong in the domain/application layer, not UI stores.

## Phase 8 And Phase 9 Write-Flow Notes

- The development session switcher is development-only and env-gated.
- The admin create screen may use:
  - title
  - editable slug
  - alternate names
  - region code
  - access notes
  - description
  - coordinate picker plus numeric refinement
  - draft/published toggle
- The admin create screen must not:
  - call Supabase directly
  - compute role authorization in presenters
  - expose moderation or audit controls
- The report compose screen may use:
  - observed time
  - water state
  - note
  - photo-attachment state
  - retry messaging for failed uploads
- The report compose screen must not:
  - expose raw moderation state
  - publish report content immediately
  - call storage providers directly from the presenter
- The moderation queue screen may use:
  - pending-only staff review items
  - spring title/region
  - submitted/observed timestamps
  - water state
  - note text
  - reporter role snapshot
  - photo count
- The moderation queue screen must not:
  - expose audit rows directly
  - expose trust calculations
  - expose public detail data as if it were moderation state
- The moderation review screen may use:
  - one pending report aggregate
  - private preview URLs created through `packages/upload-core`
  - approve/reject actions through callbacks and flow services
  - rejection reason selection plus optional staff note
- The moderation review screen must not:
  - call storage providers directly
  - call Supabase RPCs directly from the presenter
  - expose audit metadata in the presenter
  - expose pending/rejected content in public-facing routes

## Phase 15 Release Notes

- The first-run onboarding layer must stay bounded:
  - explain what the app does
  - explain that new reports are moderated before affecting public truth
  - explain offline-lite and external-navigation limits
  - remain dismissible and persisted locally
- The release-facing about route may describe:
  - internal beta scope
  - supported deep-link path
  - links to privacy/terms placeholders
- The only release-documented deep link is:
  - `springs-israel://springs/:springId`
- Phase 15 must not add:
  - universal links
  - Android App Links
  - public/internal deep links for admin-only or moderation-only routes
  - a full onboarding redesign

## UI-Only Agent Permissions

UI-focused agents may:

- change tokens, fonts, spacing, colors, radii, elevation, and animation decisions
- change layout composition and shared component APIs that remain backward compatible
- add or improve purely presentational components
- improve empty/error/loading states
- improve RTL handling and responsive behavior

UI-focused agents must not, without updating contracts first:

- change the shape or meaning of `SpringSummaryVM`, `SpringDetailVM`, `ReportDraftVM`, `ModerationQueueItemVM`, or `ModerationReviewVM`
- add direct backend logic to presenters
- compute spring status in components
- bypass navigation, upload, or repository abstractions

## Contract Change Procedure

If a UI change requires a data-shape change:

1. Update this file first.
2. Update `docs/API_CONTRACT.md` if the change crosses the boundary.
3. Update code.
4. Update tests.
5. Update `docs/ANDI.md` and `docs/PROGRESS.md`.
