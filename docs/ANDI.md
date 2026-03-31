# ANDI

## Current Phase

Phase 14

## Current Objective

Harden abuse handling, upload resilience, large-image behavior, observability boundaries, and performance smoke coverage without widening public read exposure or bypassing the existing contracts, moderation flow, or offline-lite model.

## Active Workstream

Phase 14 focuses on resilience and instrumentation only: bounded abuse-path hardening, one-pass image preprocessing before upload, replay-safe finalize behavior, swappable observability hooks, and the matching abuse/resilience/performance test coverage.

## Files Currently Being Modified / Claimed

- `/Users/meniwap/mayyanhot/docs/ANDI.md`
- `/Users/meniwap/mayyanhot/docs/PROGRESS.md`
- `/Users/meniwap/mayyanhot/docs/DECISIONS.md`
- `/Users/meniwap/mayyanhot/docs/API_CONTRACT.md`
- `/Users/meniwap/mayyanhot/docs/UI_CONTRACT.md`
- `/Users/meniwap/mayyanhot/docs/TEST_MATRIX.md`
- `/Users/meniwap/mayyanhot/docs/VERSIONS.md`
- `/Users/meniwap/mayyanhot/apps/mobile/package.json`
- `/Users/meniwap/mayyanhot/apps/mobile/src/infrastructure/providers/AppProviders.tsx`
- `/Users/meniwap/mayyanhot/apps/mobile/src/infrastructure/offline/**`
- `/Users/meniwap/mayyanhot/apps/mobile/src/infrastructure/services/submit-report-flow.ts`
- `/Users/meniwap/mayyanhot/apps/mobile/src/features/report-compose/ReportComposeScreen.tsx`
- `/Users/meniwap/mayyanhot/apps/mobile/src/features/spring-detail/**`
- `/Users/meniwap/mayyanhot/apps/admin-web/app/**`
- `/Users/meniwap/mayyanhot/apps/admin-web/src/**`
- `/Users/meniwap/mayyanhot/apps/admin-web/package.json`
- `/Users/meniwap/mayyanhot/package.json`
- `/Users/meniwap/mayyanhot/packages/upload-core/**`
- `/Users/meniwap/mayyanhot/packages/observability-core/**`
- `/Users/meniwap/mayyanhot/supabase/migrations/20260328*_phase14_hardening.sql`
- `/Users/meniwap/mayyanhot/supabase/tests/database/phase14_hardening.test.sql`
- `/Users/meniwap/mayyanhot/tests/upload/**`
- `/Users/meniwap/mayyanhot/tests/integration/offline-report-queue.test.ts`
- `/Users/meniwap/mayyanhot/tests/integration/report-submit-flow.test.tsx`
- `/Users/meniwap/mayyanhot/tests/web/**`
- `/Users/meniwap/mayyanhot/tests/database/phase14-hardening.test.ts`
- `/Users/meniwap/mayyanhot/tests/performance/**`
- `/Users/meniwap/mayyanhot/tests/database/schema-files.test.ts`
- `/Users/meniwap/mayyanhot/vitest.config.ts`

## Next Required Action

- Finish the Phase 14 git push, report the exact validation results, and stop without starting Phase 15.

## Blockers

- No Phase 14 blocker is currently open.

## Recent Decision Summary

- Phase 14 observability must stay abstraction-only and swappable; no real analytics or crash vendor is introduced.
- Large-image handling is hybrid: one-pass resize plus JPEG re-encode on device, followed by the existing authoritative storage boundary.
- Upload resilience work remains bounded to report-submit and replay flows; no generalized sync engine or new product surface lands in this phase.

## Last Successful Validation Run

- 2026-03-31: `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm format:write` succeeded after the Phase 14 hardening changes.
- 2026-03-31: `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm validate` passed with `45` test files and `167` tests.
- 2026-03-31: `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm db:local:start` succeeded once Docker Desktop was running.
- 2026-03-31: `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm db:local:reset && pnpm db:test:local` passed locally, including the new Phase 14 pgTAP file, with `Files=8` and `Tests=99`.
- 2026-03-31: `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && npx supabase db push --linked` applied `20260331120000_phase14_hardening.sql` to the linked remote project.
- 2026-03-31: `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm test:e2e:admin-web` passed with `2` browser tests.

## What Every Agent Must Read Before Editing Anything

1. `/Users/meniwap/mayyanhot/docs/ANDI.md`
2. `/Users/meniwap/mayyanhot/docs/DECISIONS.md`
3. `/Users/meniwap/mayyanhot/docs/UI_CONTRACT.md`
4. `/Users/meniwap/mayyanhot/docs/API_CONTRACT.md`
5. `/Users/meniwap/mayyanhot/docs/THEMING.md`
6. `/Users/meniwap/mayyanhot/docs/VERSIONS.md`
7. `/Users/meniwap/mayyanhot/docs/PROGRESS.md`
