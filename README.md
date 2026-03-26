# maayanhot

Production-oriented mobile-first product baseline for discovering, reporting on, and moderating information about springs in Israel.

## Current Status

Phase 3 is complete.

- The monorepo/tooling scaffold exists.
- The UI foundation exists as a token-driven shell and shared presentational primitives.
- The contract/domain layer now exists as pure TypeScript packages with no backend or provider implementations.
- Phase 4 is not started and requires explicit authorization.

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
- Map layer: adapter-first, with MapLibre planned behind `packages/map-core`
- External navigation handoff: adapter-first, behind `packages/navigation-core`
- Upload pipeline: adapter-first, behind `packages/upload-core`
- Future admin web: Next.js, planned but not started

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

Currently active workspace packages:

- `@maayanhot/mobile`
- `@maayanhot/contracts`
- `@maayanhot/design-tokens`
- `@maayanhot/domain`
- `@maayanhot/map-core`
- `@maayanhot/navigation-core`
- `@maayanhot/shared-utils`
- `@maayanhot/ui`
- `@maayanhot/upload-core`

These packages are still implementation-light by design. Phase 3 adds only contracts, pure rules, and interface boundaries.

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

No Phase 4 work has started.

Still out of scope at the current state:

- Supabase wiring
- schema and migrations
- backend adapter implementations
- map provider integrations
- external navigation provider integrations
- upload provider implementations
