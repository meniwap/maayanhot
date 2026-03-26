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

| Screen              | Purpose                                              | Container responsibilities                                                       | Presenter responsibilities                                          |
| ------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Map Browse          | Browse springs on a map and select one               | fetch viewport data, handle filters, marker selection, loading/errors            | render map chrome, chips, marker legend, and selected spring teaser |
| Spring Detail       | Show canonical spring information and current status | fetch detail view, prepare status view model, handle external navigation action  | render hero/gallery/status/evidence summary and action affordances  |
| Report Compose      | Submit a field report for a spring                   | validate draft, manage permission prompts, orchestrate uploads and submit action | render form fields, photo picker state, validation messaging        |
| Photo Preview       | Inspect an image attached to a spring or draft       | supply media source and dismissal behavior                                       | render zoomable or full-screen media presentation                   |
| Profile / Auth      | Show user identity, role, contribution state         | load current profile and capability flags                                        | render profile cards, contribution summaries, settings rows         |
| Admin Spring Editor | Create or edit a spring as an authorized role        | load/save spring form, gate unauthorized access                                  | render structured spring form UI                                    |
| Moderation Queue    | Review pending reports                               | fetch queue, trigger approve/reject mutations, surface audit context             | render report cards, moderation actions, decision reasons           |

## Container / Presenter Boundary

Containers may:

- call repositories and services
- transform domain entities into UI view models
- own `TanStack Query` hooks and mutation orchestration
- own platform permission flows
- own navigation decisions

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

### `SpringDetailVM`

```ts
type SpringDetailVM = {
  id: string;
  slug: string;
  title: string;
  alternateNames: string[];
  locationLabel: string | null;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  accessNotes: string | null;
  description: string | null;
  status: {
    waterState: 'water' | 'no_water' | 'unknown';
    freshness: 'recent' | 'stale' | 'none';
    confidenceLabel: string;
    lastApprovedObservationAt: string | null;
    sourceReportCount: number;
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
    reporterTrustLabel: string;
  }>;
  availableActions: {
    canSubmitReport: boolean;
    canOpenExternalNavigation: boolean;
    canEditSpring: boolean;
  };
};
```

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

### `ModerationQueueItemVM`

```ts
type ModerationQueueItemVM = {
  reportId: string;
  springTitle: string;
  submittedAt: string;
  observedAt: string;
  reporterLabel: string;
  reporterTrustLabel: string;
  proposedWaterState: 'water' | 'no_water' | 'unknown';
  photoCount: number;
  notePreview: string | null;
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

Deferred beyond Phase 2:

- `IconButton`
- `TextField`
- `TextAreaField`
- `PhotoTile`
- `EmptyState`
- `ErrorState`
- `LoadingState`

Deferred components stay planned, but they are not implemented in code yet and must not be assumed available by feature work.

## Shell Proof Surface

- `apps/mobile/app/index.tsx` is a shell-only foundation showcase.
- It exists only to prove theme swapping, RTL-aware composition, typography, spacing, and primitive usage.
- It is not a product feature screen and must not gain repositories, backend calls, domain logic, map logic, upload logic, or moderation behavior in Phase 2.

## State Ownership Rules

- Server-backed canonical data belongs in repositories and query caches.
- Local cross-screen UI state belongs in scoped Zustand stores only when it is not domain truth.
- Form drafts belong to feature-local state or draft abstractions, not global domain stores.
- Status derivation and role/trust calculations belong in the domain/application layer, not UI stores.

## UI-Only Agent Permissions

UI-focused agents may:

- change tokens, fonts, spacing, colors, radii, elevation, and animation decisions
- change layout composition and shared component APIs that remain backward compatible
- add or improve purely presentational components
- improve empty/error/loading states
- improve RTL handling and responsive behavior

UI-focused agents must not, without updating contracts first:

- change the shape or meaning of `SpringSummaryVM`, `SpringDetailVM`, `ReportDraftVM`, or moderation view models
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
