# ANDI

## Current Phase

Phase 8 — Create spring, report submission, and upload baseline

## Current Objective

Phase 8 is complete. The repo now has the first real write flows, repository-backed public-safe mobile reads, a development session switcher, and the initial upload pipeline baseline without weakening the public-safe read boundary.

## Active Workstream

Awaiting explicit authorization for Phase 9

## Files Currently Being Modified / Claimed

- None. Phase 8 claims are released.

## Last Successful Validation Run

- 2026-03-26: Official web-based version verification pass completed against official documentation, release notes, and project pages.
- 2026-03-26: Local workspace inspected; repository is documentation-only and not yet initialized as a git repository.
- 2026-03-26: Required files and key headings validated via local file and content checks.
- 2026-03-26: Phase 1 preflight confirmed local availability of `node`, `pnpm`, `python3`, and `git`.
- 2026-03-26: `pnpm install` completed successfully.
- 2026-03-26: `pnpm validate` passed, covering lint, format, typecheck, and tests.
- 2026-03-26: Repository initialized with `git init -b main`.
- 2026-03-26: Node `22.22.2` installed and used for correction validation.
- 2026-03-26: `pnpm install --frozen-lockfile` and `pnpm validate` passed under Node `22.22.2`.
- 2026-03-26: Node `24.14.1` installed and used for the Latest LTS policy correction validation.
- 2026-03-26: `pnpm install --frozen-lockfile` and `pnpm validate` passed under Node `24.14.1`.
- 2026-03-26: Official version verification pass completed for `expo-font`, `@testing-library/react-native`, `react-test-renderer`, and the supporting React type baseline.
- 2026-03-26: Phase 2 packages `@maayanhot/design-tokens` and `@maayanhot/ui` were added, along with a shell-only mobile showcase and bundled local `Heebo`.
- 2026-03-26: `pnpm install`, `pnpm format:write`, and `pnpm validate` passed under Node `24.14.1` after the Phase 2 implementation landed.
- 2026-03-26: Phase 3 packages `@maayanhot/contracts`, `@maayanhot/domain`, `@maayanhot/map-core`, `@maayanhot/navigation-core`, and `@maayanhot/upload-core` were added with pure contracts and interface-only abstractions.
- 2026-03-26: `pnpm install` and `pnpm validate` passed under Node `24.14.1` after the Phase 3 implementation and workspace rename to `@maayanhot/*`.
- 2026-03-26: Public GitHub repository `meniwap/maayanhot` was created and configured as the local `origin` remote.
- 2026-03-26: Local `main` now contains unpublished Phase 3 commits, with `origin` configured and the first remote push still blocked by missing GitHub `workflow` scope.
- 2026-03-26: Phase 4 added the local Supabase config, the initial Postgres/PostGIS migration, seed strategy scaffolding, and executable schema-integrity tests aligned to the Phase 3 contracts/domain layer.
- 2026-03-26: `pnpm install`, `pnpm format:write`, and `pnpm validate` passed under Node `24.14.1` after the Phase 4 database foundation landed.
- 2026-03-26: Retried `git push -u origin main`; the push is still blocked because the current GitHub OAuth app token lacks `workflow` scope for `.github/workflows/ci.yml`.
- 2026-03-26: Phase 5 added the security migration, public-safe browse view, admin role-management RPCs, RLS/storage policies, pgTAP policy suites, and executable Vitest policy guardrails.
- 2026-03-26: `pnpm validate` passed under Node `24.14.1` after the Phase 5 security foundation and close-out doc updates landed.
- 2026-03-26: Phase 6 retried GitHub publication, but `git push -u origin main` is still blocked because the active GitHub token lacks `workflow` scope.
- 2026-03-26: The real remote Supabase project `maayanhot` was created and linked locally as project ref `xcjjvundvdpkxnkkkplp`.
- 2026-03-26: Phase 6 added the first concrete map provider implementation behind `packages/map-core`, a default mobile map browse shell, local public-safe browse fixtures, and marker-selection teaser behavior.
- 2026-03-26: `pnpm typecheck` and `pnpm test` passed under Node `24.14.1` after the Phase 6 map foundation landed.
- 2026-03-26: `pnpm format:write` and `pnpm validate` passed under Node `24.14.1` after the Phase 6 doc close-out updates.
- 2026-03-26: Phase 7 added a dedicated spring-detail route, a public-safe detail fixture/view-model layer, approved gallery/history summary UI, and external navigation handoff through `packages/navigation-core`.
- 2026-03-26: `pnpm install`, `pnpm format:write`, and `pnpm validate` passed under Node `24.14.1` after the Phase 7 read-flow implementation and doc updates landed.
- 2026-03-26: Retried `gh auth status` and `git push -u origin main`; the push is still blocked because the active GitHub token still lacks `workflow` scope for `.github/workflows/ci.yml`.
- 2026-03-26: Official version verification pass completed for `@supabase/supabase-js@2.100.1`, `@tanstack/react-query@5.95.2`, `zod@4.3.6`, and `expo-image-picker@~17.0.8`.
- 2026-03-26: `npx supabase projects api-keys --project-ref xcjjvundvdpkxnkkkplp` succeeded for the linked `maayanhot` project, and tracked files remained secret-free.
- 2026-03-26: `npx supabase db push --linked` succeeded under Node `24.14.1`, applying the committed Phase 5 and Phase 8 migrations to the linked remote project.
- 2026-03-26: Phase 8 added repository-backed public browse/detail reads, the dev-session switcher, the admin create-spring flow, the report compose flow, the Phase 8 public detail/upload migration, and the first concrete upload adapter in `packages/upload-core`.
- 2026-03-26: `pnpm test` passed under Node `24.14.1` with 23 test files and 75 tests after the Phase 8 implementation landed.
- 2026-03-26: `pnpm validate` passed under Node `24.14.1` after the Phase 8 close-out doc and cleanup pass.
- 2026-03-26: Retried `git push -u origin main`; the push is still blocked because the active GitHub token still lacks `workflow` scope for `.github/workflows/ci.yml`.

## Next Required Action

Wait for explicit authorization before starting Phase 9 moderation work.

## Blockers

- Current GitHub OAuth app auth still lacks `workflow` scope, so `git push -u origin main` remains blocked by `.github/workflows/ci.yml`.

## Recent Decision Summary

- Phase 2 is complete.
- Treat the spring's current status as a derived projection of approved report history, not a mutable boolean flag.
- Use a monorepo with explicit package boundaries and plain `pnpm` workspaces as the initial orchestration baseline.
- Lock the root tooling baseline to ESLint 10.1.0, `typescript-eslint` 8.57.2, Prettier 3.8.1, Vitest 4.0.16, and TypeScript 5.9.3.
- Keep the mobile package on the Expo 55 compatibility matrix through `expo install` rather than hand-managed drift.
- Keep the future admin-web Next.js baseline at `16.2.1` unless the official docs show a newer stable version during this pass.
- Replace the older Node `22.22.2` pin with the current official Latest LTS baseline, Node `24.14.1`.
- Keep Phase 2 light-only, load Heebo locally, defer Assistant, keep Vitest as the only runner, and rely on Expo SDK 55 monorepo support without custom Metro config unless blocked.
- Treat the Phase 2 showcase as a non-feature proof surface only.
- Keep the first UI tests on Vitest, but note that the current node-only baseline uses a local `react-test-renderer` compatibility harness instead of the full `@testing-library/react-native` runtime import path.
- Align internal technical naming to `maayanhot`, including the workspace scope `@maayanhot/*`, the public GitHub repo name `maayanhot`, and the future Supabase project name `maayanhot`.
- Keep shared serializable contracts in `packages/contracts`, pure domain rules and repository ports in `packages/domain`, and provider-neutral map/navigation/upload ports in separate interface-only packages.
- Keep the local filesystem path unchanged for now; only technical identifiers and remote naming were aligned in Phase 3.
- Keep the Phase 4 backend foundation report-centered: `spring_reports` plus moderation state remain the source of truth, while `spring_status_projections` and trust counters stay explicitly derived caches.
- Use a local Supabase structure named `maayanhot`, PostgreSQL 17, and PostGIS geography columns with focused history, moderation, and geospatial indexes as the initial infrastructure baseline.
- Keep anonymous reads minimal through `public.public_spring_catalog` and keep raw reports, moderation data, audit data, and report media non-public in Phase 5.
- Keep RLS role decisions DB-backed through `user_role_assignments`, keep `trusted_contributor` policy-equivalent to `user` in Phase 5, and restrict role management to admin RPCs with audit logging.
- Keep the first concrete map provider inside `packages/map-core`, keep the default route teaser-only in Phase 6, and defer clustering.
- Keep the Phase 6 browse shell on a local fixture that mirrors `public.public_spring_catalog` until repository-backed browse integration is explicitly authorized later.
- The real remote Supabase project now exists under the exact required name `maayanhot` and is linked locally as `xcjjvundvdpkxnkkkplp`.
- Keep Phase 7 read-only and public-safe: the dedicated detail route now consumes a local fixture that mirrors the intended public-safe detail read model, exposes approved gallery/history summary data only, and routes external navigation through `packages/navigation-core`.
- Phase 8 uses repository-backed public-safe mobile reads, app-local Supabase repositories, TanStack Query providers, and a development-only real-session switcher.
- Phase 8 keeps uploads sequential and slot-based behind `packages/upload-core`, with a manual one-time SQL bootstrap still required for the first demo admin.

## What Every Agent Must Read Before Editing Anything

1. `/Users/meniwap/mayyanhot/docs/ANDI.md`
2. `/Users/meniwap/mayyanhot/docs/DECISIONS.md`
3. `/Users/meniwap/mayyanhot/docs/UI_CONTRACT.md`
4. `/Users/meniwap/mayyanhot/docs/API_CONTRACT.md`
5. `/Users/meniwap/mayyanhot/docs/THEMING.md`
6. `/Users/meniwap/mayyanhot/docs/VERSIONS.md`
7. `/Users/meniwap/mayyanhot/docs/PROGRESS.md`
