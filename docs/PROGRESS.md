# Progress

## Current Phase

Phase 13

## Done

- Re-read the control docs and claimed only the Phase 13 files needed for admin-web, shared use-cases, migration, tests, and documentation.
- Added the new shared `@maayanhot/use-cases` package and moved the spring-create and moderation flows behind UI-agnostic shared use-case classes.
- Added `UpdateSpringCommand` plus the matching `SpringRepository` management methods needed for admin web create/list/edit work.
- Added the Phase 13 forward-only migration:
  - `public.admin_spring_management_catalog`
  - `public.admin_spring_management_detail`
  - `public.admin_update_spring(...)`
- Built `apps/admin-web` as a real Next.js App Router surface with:
  - `/login`
  - `/admin`
  - `/admin/springs`
  - `/admin/springs/new`
  - `/admin/springs/[springId]/edit`
  - `/admin/moderation`
  - `/admin/moderation/[reportId]`
- Added real Supabase-backed web auth/session handling and explicit route gating:
  - anonymous users are redirected to login
  - moderators can access moderation but not spring management
  - admins can access both
  - unauthorized states render explicit restricted messaging
- Built the admin spring-management web workflow for:
  - bounded list view
  - create draft flow
  - edit existing spring flow
  - publish-state updates through the admin RPC path
- Built the admin moderation web workflow for:
  - pending queue list
  - single-report review page
  - approve / reject actions through the shared `ModerateReportFlow`
  - private media previews through `@maayanhot/upload-core`
- Added admin-web integration coverage and Playwright E2E coverage for create/edit/publish and moderation approval.
- Applied the Phase 13 migration to the linked remote Supabase project and verified the new admin surfaces through both repository tests and browser flows.

## In Progress

- None

## Blocked

- None

## Just Verified

- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm exec vitest run tests/web/admin-auth-guard.test.tsx tests/web/admin-spring-management.test.tsx tests/web/admin-moderation.test.tsx` passed.
- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm test:e2e:admin-web` passed.
- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm db:local:start` succeeded.
- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm db:local:reset` succeeded and applied the Phase 13 migration locally.
- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm db:test:local` passed with `Files=7` and `Tests=95`.
- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && npx supabase db push --linked` applied `20260327183000_phase13_admin_web.sql` to the linked remote project.
- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm format:write` succeeded after the Phase 13 implementation and docs updates.
- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm validate` passes, including lint, format, typecheck, and the full Vitest suite.

## Remaining In Current Phase

- None

## Next Smallest Sensible Step

- Wait for explicit authorization before starting Phase 14.

## Contracts Changed This Session

- Added `UpdateSpringCommand` and `updateSpringCommandSchema` in `packages/contracts`.
- Extended `SpringRepository` with admin-management methods for:
  - `listManaged(...)`
  - `getManagedById(...)`
  - `update(...)`
  - `findExistingSlugs(...)`
- Added the shared `@maayanhot/use-cases` package so mobile and admin-web now call the same create and moderation orchestration logic.
- Added the admin-only database surfaces `public.admin_spring_management_catalog`, `public.admin_spring_management_detail`, and `public.admin_update_spring(...)`.

## Versions Changed This Session

- The previously deferred admin-web baseline is now implemented on `next@16.2.1`.
- Admin web E2E coverage now uses `@playwright/test@1.58.2`.

## Risks Carried Forward

- Admin web is intentionally online-only in Phase 13; there is no offline admin support and no broader internal ops surface yet.
- Spring management stays bounded to create/list/edit only; delete flows, bulk actions, and contributor management remain later work.
- The Phase 11 React Native Vitest harness still emits upstream `react-test-renderer` deprecation warnings and some `act(...)` warnings in older tests even though the suite passes.
