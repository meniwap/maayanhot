# Progress

## Current Phase

Phase 3 — Domain contracts and abstractions

## Done

- Re-read the control docs before beginning Phase 3 work.
- Claimed the Phase 3 docs, package manifests, source files, and new test files in `docs/ANDI.md`.
- Renamed the internal technical baseline from `mayyanhot` / `@mayyanhot/*` to `maayanhot` / `@maayanhot/*` across workspace packages, aliases, imports, and repo metadata.
- Added `packages/contracts` as the shared serializable contract layer.
- Added `packages/domain` with read-only domain entities, pure permission guards, configurable status derivation, and repository ports only.
- Activated `packages/map-core`, `packages/navigation-core`, and `packages/upload-core` as interface-only adapter packages with no provider implementations.
- Documented the package ownership and boundary rules in `docs/API_CONTRACT.md`.
- Added Phase 3 runtime tests for status derivation and permission guards.
- Added Phase 3 interface-conformance tests for repository ports and provider-neutral adapter ports.
- Kept UI packages UI-only and kept backend/provider logic out of Phase 3 entirely.

## In Progress

- None

## Blocked

- GitHub publication is partially complete:
  - the public repository `meniwap/maayanhot` exists
  - local `origin` points to `https://github.com/meniwap/maayanhot.git`
  - the first `git push -u origin main` was rejected because the current GitHub OAuth app token does not have `workflow` scope for `.github/workflows/ci.yml`

## Just Verified

- `pnpm typecheck` passed after adding the contract/domain packages and the workspace rename.
- `pnpm install` completed successfully under Node `24.14.1` after the workspace rename and package additions.
- `pnpm validate` passed end to end under Node `24.14.1`.
- `pnpm test` passed with the new Phase 3 domain and interface-conformance tests added.
- The new status derivation remains pure and UI-agnostic.
- The new repository, map, navigation, and upload contracts remain implementation-free.
- The mobile app still contains no domain, backend, or provider implementation logic.
- GitHub repository creation succeeded for public `meniwap/maayanhot`, and `origin` is now configured locally.
- The initial local commit was created as `5b1f61d` on `main`.
- The first `git push -u origin main` attempt failed with:
  - `refusing to allow an OAuth App to create or update workflow .github/workflows/ci.yml without workflow scope`

## Remaining In Current Phase

- Nothing. Phase 3 is complete.

## Next Smallest Sensible Step

Begin Phase 4 only after approval:

- create Supabase project structure using the exact project name `maayanhot`
- add Postgres/PostGIS schema design and migrations
- add reproducible migration and schema integrity tests
- keep all backend work behind the Phase 3 contracts and ports

GitHub publication follow-up, when auth is fixed:

- refresh GitHub auth with `workflow` scope or use a token that has it
- rerun `git push -u origin main`

## Contracts Changed This Session

- `docs/API_CONTRACT.md` now reflects the implemented `packages/contracts`, `packages/domain`, `packages/map-core`, `packages/navigation-core`, and `packages/upload-core` ownership boundaries.
- The domain layer now uses `waterPresence` terminology internally, while the UI contract still exposes `waterState` in presenter-facing view models.
- Repository ports and adapter ports are now implemented as code, not just planned docs.

## Versions Changed This Session

- None.

## Risks Carried Forward

- Supabase-hosted PostgreSQL/PostGIS patch levels must still be confirmed when Phase 4 provisions infrastructure.
- The MapLibre React Native package must remain on the stable non-beta line unless explicitly re-approved later.
- The future Next.js baseline should still be re-verified again closer to Phase 13 rather than assumed indefinitely.
- The Phase 2 UI test harness still uses `react-test-renderer` under Vitest and should be revisited when the mobile test stack expands.
