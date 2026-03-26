# ANDI

## Current Phase

Phase 3 — Domain contracts and abstractions

## Current Objective

Phase 3 is complete. Hold the contract/domain baseline, keep the repo/docs in sync, and wait for explicit authorization before any Phase 4 work begins.

## Active Workstream

Phase 3 close-out

## Files Currently Being Modified / Claimed

- None. All Phase 3 claims have been released.

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
- 2026-03-26: Local root commit `5b1f61d` was created on `main`.

## Next Required Action

Wait for explicit authorization before beginning Phase 4.

If GitHub publication needs to be completed before the next phase, refresh auth with `workflow` scope and rerun:

- `git push -u origin main`

## Blockers

- Current GitHub OAuth app auth does not have `workflow` scope, so the first push of `main` to `origin` was rejected because the repo contains `.github/workflows/ci.yml`.

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

## What Every Agent Must Read Before Editing Anything

1. `/Users/meniwap/mayyanhot/docs/ANDI.md`
2. `/Users/meniwap/mayyanhot/docs/DECISIONS.md`
3. `/Users/meniwap/mayyanhot/docs/UI_CONTRACT.md`
4. `/Users/meniwap/mayyanhot/docs/API_CONTRACT.md`
5. `/Users/meniwap/mayyanhot/docs/THEMING.md`
6. `/Users/meniwap/mayyanhot/docs/VERSIONS.md`
7. `/Users/meniwap/mayyanhot/docs/PROGRESS.md`
