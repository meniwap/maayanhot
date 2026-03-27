# maayanhot

Production-oriented mobile-first product baseline for discovering, reporting on, and moderating information about springs in Israel.

## Current Status

Phase 13 is complete.

- The monorepo/tooling scaffold exists.
- The UI foundation exists as a token-driven shell and shared presentational primitives.
- The contract/domain layer now exists as pure TypeScript packages with no backend or provider implementations.
- The initial Supabase/Postgres/PostGIS schema foundation now exists locally under `supabase/`.
- The Phase 5 RLS, storage-policy, and role-bound security foundation now exists locally under `supabase/`.
- The mobile app now has a first real map-browse foundation behind `packages/map-core`.
- The mobile app now has a dedicated read-only spring-detail flow behind the Phase 6 teaser.
- The real remote Supabase project `maayanhot` has been created and linked locally.
- The mobile app now has repository-backed public-safe reads, a development-only session switcher, an admin create-spring flow, a user report flow, and the first upload pipeline baseline.
- The local Supabase DB start/reset/test path now runs on this Mac through the pinned local CLI plus Docker Desktop.
- The local Maestro iOS smoke path now runs on this Mac against the real native bundle id `com.meniwap.maayanhot`.
- The mobile app now has bounded offline-lite support for cached public reads and queued report submission replay.
- The mobile app now has bounded client-side discovery with shared list/map coordination.
- A real `apps/admin-web` Next.js App Router surface now exists for admin spring management and staff moderation workflows.
- Phase 14 is not started and requires explicit authorization.

## Product Intent

This is a springs app, not a navigation app.

Core goals:

- browse springs on a map
- inspect spring details
- derive current spring status from approved report history
- collect field reports and photos
- support moderation, trusted contributors, and admins
- hand off routing to external navigation apps
- support offline-lite behavior without overbuilding full offline navigation

## Architectural Baseline

- Mobile client: React Native with Expo and TypeScript
- Mobile navigation: `expo-router`
- Backend platform: Supabase
- Database: PostgreSQL with PostGIS
- Auth: Supabase Auth
- Storage: Supabase Storage
- Server state: TanStack Query
- Local UI state: Zustand
- Validation: Zod
- Map layer: adapter-first, with the first MapLibre implementation now behind `packages/map-core`
- External navigation handoff: adapter-first, behind `packages/navigation-core`
- Upload pipeline: adapter-first, behind `packages/upload-core`
- Admin web: Next.js App Router in `apps/admin-web`

## Repository Shape

The repository now follows the planned monorepo scaffold:

```text
apps/
  mobile/
  admin-web/

packages/
  design-tokens/
  ui/
  domain/
  contracts/
  map-core/
  navigation-core/
  upload-core/
  shared-utils/

supabase/
  migrations/
  seed/
  functions/

docs/
  MASTER_PLAN.md
  ANDI.md
  PROGRESS.md
  TEST_MATRIX.md
  DECISIONS.md
  UI_CONTRACT.md
  API_CONTRACT.md
  THEMING.md
  VERSIONS.md
```

Currently active workspaces:

- `@maayanhot/admin-web`
- `@maayanhot/mobile`
- `@maayanhot/contracts`
- `@maayanhot/design-tokens`
- `@maayanhot/domain`
- `@maayanhot/map-core`
- `@maayanhot/navigation-core`
- `@maayanhot/shared-utils`
- `@maayanhot/ui`
- `@maayanhot/upload-core`
- `@maayanhot/use-cases`

These packages are still intentionally narrow by phase. `@maayanhot/map-core` now contains the first concrete provider-backed map surface, `@maayanhot/use-cases` now holds shared create/update/moderation orchestration, and `apps/admin-web` is now a real internal surface instead of a reserved placeholder.

## Supabase Foundation

Phase 4 and Phase 5 add:

- `supabase/config.toml` with local project id `maayanhot`
- the initial schema migration
- seed strategy scaffolding
- pgTAP-ready database tests
- the Phase 5 security migration with RLS, admin RPCs, and storage policies

Phase 6 adds:

- the real remote Supabase project named exactly `maayanhot`
- local link to project ref `xcjjvundvdpkxnkkkplp`

Phase 8 adds:

- the public-safe detail/upload migration
- repository-backed public browse and detail reads
- admin create-spring RPC usage
- report submission plus media-slot reservation/finalization
- the first concrete Supabase storage adapter behind `@maayanhot/upload-core`
- `apps/mobile/.env.example` for the public/runtime development variables

The repo is linked to the remote project ref `xcjjvundvdpkxnkkkplp`, and `npx supabase db push --linked` has been applied successfully.

## Map And Read Foundation

Phase 6 adds:

- a default mobile map-browse route
- a first concrete MapLibre-backed adapter behind `@maayanhot/map-core`
- marker selection with a small teaser card

Phase 8 updates the browse/read foundation to use repository-backed public-safe reads against the linked Supabase project instead of local product fixtures.

Current scope limits:

- no clustering yet
- no internal navigation directions
- no direct MapLibre imports in screens
- no raw report or moderation data in the browse shell

Phase 7 adds:

- a dedicated `/springs/[springId]` detail route
- a public-safe read-only detail surface with current status, approved gallery, and approved history summary
- external navigation handoff through `@maayanhot/navigation-core`

Current scope limits:

- the detail route remains public-safe and read-only
- no moderation UI yet
- no raw report browser or trust-signal exposure in the detail screen

## Phase 8 Write Flow

Phase 8 adds:

- `/dev/session`
  - development-only sign-in switcher backed by real Supabase auth sessions
- `/admin/springs/new`
  - admin-only create-spring flow
- `/springs/[springId]/report`
  - authenticated report-compose flow

Current write-flow rules:

- newly submitted reports stay pending and do not affect the public read model automatically
- photo attachment goes through `@maayanhot/upload-core` only
- screens do not call Supabase or storage providers directly
- public browse/detail routes still expose public-safe approved data only

One-time demo admin bootstrap:

1. Create the demo auth users in the linked Supabase project.
2. Promote the chosen demo admin once in the Supabase SQL editor:

```sql
insert into public.user_role_assignments (
  user_id,
  role,
  granted_by_user_id,
  grant_source,
  note
)
values (
  '<demo-admin-user-id>'::uuid,
  'admin'::public.user_role,
  '<demo-admin-user-id>'::uuid,
  'phase8_bootstrap',
  'Initial demo admin bootstrap'
);
```

Passwords and keys stay in local env only and must not be committed.

Native note:

- MapLibre requires a development build/native runtime and is not an Expo Go feature

## Phase 13 Admin Web

Phase 13 adds:

- `apps/admin-web`
  - `/login`
  - `/admin`
  - `/admin/springs`
  - `/admin/springs/new`
  - `/admin/springs/[springId]/edit`
  - `/admin/moderation`
  - `/admin/moderation/[reportId]`

Current rules:

- spring management is admin-only
- moderation is staff-only (`moderator` or `admin`)
- create/update/moderation orchestration now lives in `@maayanhot/use-cases`
- admin-web remains online-only in this phase
- no delete flow, contributor management, analytics, or public-surface widening landed in Phase 13

## Local Tooling

Local Supabase DB path:

- `pnpm db:local:start`
- `pnpm db:local:reset`
- `pnpm db:test:local`
- `pnpm db:local:stop`

Local Maestro smoke path:

1. Boot an iOS simulator, for example `iPhone 17`.
2. Build and install the native app:

```bash
cd /Users/meniwap/mayyanhot/apps/mobile
npx expo run:ios --device "iPhone 17"
```

3. Run the smoke flow from the repo root:

```bash
maestro --device 93441B3A-3AE2-4F4B-988E-70156F016902 test /Users/meniwap/mayyanhot/.maestro/smoke-dev-session.yaml
```

Local tooling assumptions:

- Docker Desktop is the repo-standard local container runtime on this Mac.
- The native technical app identifier is `com.meniwap.maayanhot`.
- Generated native output under `apps/mobile/ios` is treated as a local tooling artifact and is ignored from source-control and formatting checks.

## Tooling Baseline

- Package manager: `pnpm`
- TypeScript baseline: root `tsconfig.base.json`
- Linting: ESLint flat config
- Formatting: Prettier
- Test runner: Vitest
- CI: GitHub Actions

Root commands:

- `pnpm install`
- `pnpm lint`
- `pnpm format`
- `pnpm format:write`
- `pnpm typecheck`
- `pnpm test`
- `pnpm validate`

## Operating Rules

Every agent must read these files before editing code or contracts:

1. `/Users/meniwap/mayyanhot/docs/ANDI.md`
2. `/Users/meniwap/mayyanhot/docs/DECISIONS.md`
3. `/Users/meniwap/mayyanhot/docs/UI_CONTRACT.md`
4. `/Users/meniwap/mayyanhot/docs/API_CONTRACT.md`
5. `/Users/meniwap/mayyanhot/docs/THEMING.md`
6. `/Users/meniwap/mayyanhot/docs/VERSIONS.md`
7. `/Users/meniwap/mayyanhot/docs/PROGRESS.md`

## Phase 0 Deliverables In This Repo

- `/Users/meniwap/mayyanhot/docs/MASTER_PLAN.md`
- `/Users/meniwap/mayyanhot/docs/ANDI.md`
- `/Users/meniwap/mayyanhot/docs/PROGRESS.md`
- `/Users/meniwap/mayyanhot/docs/TEST_MATRIX.md`
- `/Users/meniwap/mayyanhot/docs/DECISIONS.md`
- `/Users/meniwap/mayyanhot/docs/UI_CONTRACT.md`
- `/Users/meniwap/mayyanhot/docs/API_CONTRACT.md`
- `/Users/meniwap/mayyanhot/docs/THEMING.md`
- `/Users/meniwap/mayyanhot/docs/VERSIONS.md`

## Phase Boundary

No Phase 10 work has started.

Still out of scope at the current state:

- moderation queue and approve/reject flows
- trusted-contributor privilege expansion
- offline queueing/sync
- community-management and trust UI
