# ANDI

## Current Phase

Phase 13

## Current Objective

Build the admin-web foundation, admin spring-management UI, and admin moderation workflow on web without widening public read exposure or bypassing the existing moderation and security model.

## Active Workstream

Complete. Phase 13 now provides a real Next.js admin surface with web auth/session guards, admin spring create/list/edit flows, moderator/admin review flows, shared use-cases, and browser-level E2E coverage.

## Files Currently Being Modified / Claimed

- `/Users/meniwap/mayyanhot/.gitignore`
- `/Users/meniwap/mayyanhot/docs/ANDI.md`
- `/Users/meniwap/mayyanhot/docs/PROGRESS.md`
- `/Users/meniwap/mayyanhot/docs/DECISIONS.md`
- `/Users/meniwap/mayyanhot/docs/API_CONTRACT.md`
- `/Users/meniwap/mayyanhot/docs/UI_CONTRACT.md`
- `/Users/meniwap/mayyanhot/docs/TEST_MATRIX.md`
- `/Users/meniwap/mayyanhot/docs/VERSIONS.md`
- `/Users/meniwap/mayyanhot/README.md`
- `/Users/meniwap/mayyanhot/apps/admin-web/README.md`
- `/Users/meniwap/mayyanhot/apps/admin-web/app/**`
- `/Users/meniwap/mayyanhot/apps/admin-web/src/**`
- `/Users/meniwap/mayyanhot/apps/admin-web/package.json`
- `/Users/meniwap/mayyanhot/apps/admin-web/next.config.ts`
- `/Users/meniwap/mayyanhot/apps/admin-web/.env.example`
- `/Users/meniwap/mayyanhot/apps/mobile/src/features/admin-spring-create/AdminSpringCreateScreen.tsx`
- `/Users/meniwap/mayyanhot/apps/mobile/src/features/moderation/ModerationReviewScreen.tsx`
- `/Users/meniwap/mayyanhot/apps/mobile/src/infrastructure/services/create-spring-flow.ts`
- `/Users/meniwap/mayyanhot/apps/mobile/src/infrastructure/services/moderate-report-flow.ts`
- `/Users/meniwap/mayyanhot/apps/mobile/src/infrastructure/supabase/repositories/spring-repository.ts`
- `/Users/meniwap/mayyanhot/apps/mobile/tsconfig.json`
- `/Users/meniwap/mayyanhot/packages/contracts/src/index.ts`
- `/Users/meniwap/mayyanhot/packages/domain/src/repositories.ts`
- `/Users/meniwap/mayyanhot/packages/use-cases/**`
- `/Users/meniwap/mayyanhot/supabase/migrations/20260327183000_phase13_admin_web.sql`
- `/Users/meniwap/mayyanhot/supabase/tests/database/phase13_admin_web.test.sql`
- `/Users/meniwap/mayyanhot/tests/web/**`
- `/Users/meniwap/mayyanhot/tests/e2e/admin-web.spec.ts`
- `/Users/meniwap/mayyanhot/tests/database/phase13-admin-web.test.ts`
- `/Users/meniwap/mayyanhot/tests/database/schema-files.test.ts`
- `/Users/meniwap/mayyanhot/tests/integration/moderation-flow.test.ts`
- `/Users/meniwap/mayyanhot/tests/domain/contracts-conformance.test.ts`
- `/Users/meniwap/mayyanhot/playwright.config.ts`
- `/Users/meniwap/mayyanhot/package.json`
- `/Users/meniwap/mayyanhot/tsconfig.base.json`
- `/Users/meniwap/mayyanhot/tsconfig.json`
- `/Users/meniwap/mayyanhot/vitest.config.ts`

## Next Required Action

- Wait for explicit authorization before Phase 14.

## Blockers

- No Phase 13 blocker is currently open.

## Recent Decision Summary

- Admin web is a real separate Next.js App Router app, not an Expo-web extension of the mobile app.
- Shared create/update/moderation orchestration now lives in `@maayanhot/use-cases` so mobile and web stay aligned.
- Admin spring-management surfaces and RPCs are admin-only and remain separate from public read surfaces.
- Web moderation continues to use the same staff views, RPC-only decision writes, and derived projection path that mobile already uses.

## Last Successful Validation Run

- 2026-03-27: `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm exec vitest run tests/web/admin-auth-guard.test.tsx tests/web/admin-spring-management.test.tsx tests/web/admin-moderation.test.tsx` passed.
- 2026-03-27: `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm test:e2e:admin-web` passed.
- 2026-03-27: `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm db:local:start && pnpm db:local:reset && pnpm db:test:local` passed locally, including the new Phase 13 pgTAP file.
- 2026-03-27: `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && npx supabase db push --linked` applied the Phase 13 admin-web migration to the linked remote project.
- 2026-03-27: `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm validate` passed after the Phase 13 implementation and docs updates.

## What Every Agent Must Read Before Editing Anything

1. `/Users/meniwap/mayyanhot/docs/ANDI.md`
2. `/Users/meniwap/mayyanhot/docs/DECISIONS.md`
3. `/Users/meniwap/mayyanhot/docs/UI_CONTRACT.md`
4. `/Users/meniwap/mayyanhot/docs/API_CONTRACT.md`
5. `/Users/meniwap/mayyanhot/docs/THEMING.md`
6. `/Users/meniwap/mayyanhot/docs/VERSIONS.md`
7. `/Users/meniwap/mayyanhot/docs/PROGRESS.md`
