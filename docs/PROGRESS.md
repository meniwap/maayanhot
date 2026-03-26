# Progress

## Current Phase

Phase 8 — Create spring, report submission, and upload baseline

## Done

- Re-read the control docs before beginning Phase 8 work.
- Claimed the Phase 8 route, infrastructure, repository, migration, test, and documentation files in `docs/ANDI.md`.
- Re-verified the current stable baselines for `@supabase/supabase-js`, `@tanstack/react-query`, `zod`, and `expo-image-picker` from official sources and pinned them in the repo.
- Retrieved the linked public Supabase API key set safely and kept tracked files secret-free.
- Fixed the hosted-safe Phase 5 storage policy migration syntax and successfully applied:
  - `20260326193000_phase5_security.sql`
  - `20260326210000_phase8_public_detail_and_upload.sql`
    to the linked remote project `maayanhot` with `npx supabase db push --linked`.
- Added the first app-local mobile infrastructure layer under `apps/mobile/src/infrastructure/`:
  - public-safe read repositories
  - spring/report write repositories
  - Supabase client bootstrap
  - TanStack Query provider setup
  - create/report flow services
- Replaced fixture-backed product reads with repository-backed public-safe reads for:
  - map browse via `public.public_spring_catalog`
  - spring detail via `public.public_spring_detail`, `public.public_spring_detail_media`, and `public.public_spring_detail_history`
- Added a development-only real-session switcher at `apps/mobile/app/dev/session.tsx` backed by actual Supabase auth sessions.
- Added the admin create spring flow at `apps/mobile/app/admin/springs/new.tsx`.
- Added the user report compose flow at `apps/mobile/app/springs/[springId]/report.tsx`.
- Added the first write-flow shared UI primitives:
  - `TextField`
  - `TextAreaField`
  - `PhotoTile`
- Added Phase 8 contract/domain work:
  - Zod schemas for create/report commands
  - `canSubmitReports`
  - slug normalization and conflict helpers
- Added the first concrete upload pipeline baseline in `packages/upload-core`:
  - slot-aware `PendingUpload`
  - MIME/size validation
  - Supabase storage adapter
  - retry against the same reserved slot
- Added the Phase 8 database surfaces:
  - `public.public_spring_detail`
  - `public.public_spring_detail_media`
  - `public.public_spring_detail_history`
  - `public.admin_create_spring(...)`
  - `public.create_report_media_slot(...)`
  - `public.finalize_report_media_upload(...)`
- Added Phase 8 integration, UI, upload, and database guardrail tests.
- Ran the full suite successfully under Node `24.14.1`.

## In Progress

- None

## Blocked

- GitHub publication remains blocked because the current GitHub OAuth app token still does not have `workflow` scope for `.github/workflows/ci.yml`.

## Just Verified

- The linked remote Supabase project `maayanhot` exists, remains linked locally as `xcjjvundvdpkxnkkkplp`, and now has the Phase 5 + Phase 8 migrations applied.
- The mobile app now reads public browse/detail data through repositories against the approved public-safe surfaces instead of through local product fixtures.
- An authenticated admin can create draft and published springs through the Phase 8 flow.
- An authenticated user can submit a report with optional photo attachments, and failed uploads stay retryable against the same reserved media slot.
- Device permission denial paths for camera and gallery are covered in the current test suite.
- `source ~/.nvm/nvm.sh && nvm use 24.14.1 && pnpm validate` passed, including lint, format, typecheck, and 23 passing test files / 75 passing tests.
- `git push -u origin main` still fails because the current GitHub OAuth token does not include `workflow` scope.

## Remaining In Current Phase

- None. Phase 8 is complete and waiting for explicit Phase 9 authorization.

## Next Smallest Sensible Step

Begin Phase 9 only after approval:

- add moderation queue/read surfaces
- add approve/reject actions
- add audit-linked moderation transitions
- keep public read flows unchanged until approval occurs

GitHub publication follow-up, when auth scope is fixed:

- refresh GitHub auth so the token includes `workflow` scope
- run `git push -u origin main`

## Contracts Changed This Session

- `docs/API_CONTRACT.md` now documents the Phase 8 repository-backed public detail surfaces, write RPCs, upload-slot flow, and development bootstrap expectations.
- `docs/UI_CONTRACT.md` now records the repository-backed map/detail reads, the dev-session route, the admin create spring route, the report compose route, and the newly shipped form/media primitives.
- Shared contract/domain files changed in a bounded way:
  - Zod validation schemas were added in `packages/contracts`
  - slug helpers and `canSubmitReports` were added in `packages/domain`
  - upload slot/finalize repository contracts were added in `packages/domain`

## Versions Changed This Session

- `@supabase/supabase-js` pinned to `2.100.1`
- `@tanstack/react-query` pinned to `5.95.2`
- `zod` pinned to `4.3.6`
- `expo-image-picker` pinned to `~17.0.8`

## Risks Carried Forward

- The first demo admin still requires a one-time SQL bootstrap in the linked Supabase project before the dev-session switcher can exercise the admin flow end to end.
- The MapLibre React Native package must remain on the stable non-beta line unless explicitly re-approved later.
- Native verification for MapLibre still requires a development build and is not covered by Expo Go.
- The future Next.js baseline should still be re-verified again closer to Phase 13 rather than assumed indefinitely.
- The Phase 2 UI test harness still uses `react-test-renderer` under Vitest and should be revisited when the mobile test stack expands.
- GitHub publication still needs refreshed auth with `workflow` scope before the local `main` branch can be pushed.
