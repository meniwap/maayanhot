# ANDI

## Current Phase

Phase 11

## Current Objective

Complete a bounded offline-lite slice for persisted public-safe reads and queued report replay without starting Phase 12, widening public exposure, or turning the app into a generalized sync engine.

## Active Workstream

Complete. Phase 11 now has persisted public-safe catalog/detail reads, a same-user scoped local report queue with retry/backoff and reconnect replay, and forward-only server idempotency for safe replays.

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
- `/Users/meniwap/mayyanhot/apps/mobile/src/infrastructure/query/query-client.ts`
- `/Users/meniwap/mayyanhot/apps/mobile/src/infrastructure/offline/offline-report-queue.ts`
- `/Users/meniwap/mayyanhot/apps/mobile/src/infrastructure/offline/OfflineReportQueueProvider.tsx`
- `/Users/meniwap/mayyanhot/apps/mobile/src/infrastructure/supabase/repositories/spring-report-repository.ts`
- `/Users/meniwap/mayyanhot/apps/mobile/src/infrastructure/services/submit-report-flow.ts`
- `/Users/meniwap/mayyanhot/apps/mobile/src/features/report-compose/ReportComposeScreen.tsx`
- `/Users/meniwap/mayyanhot/apps/mobile/src/features/spring-detail/SpringDetailScreen.tsx`
- `/Users/meniwap/mayyanhot/apps/mobile/src/features/spring-detail/SpringDetailView.tsx`
- `/Users/meniwap/mayyanhot/apps/mobile/src/features/map-browse/MapBrowseScreen.tsx`
- `/Users/meniwap/mayyanhot/apps/mobile/src/features/admin-spring-create/AdminSpringCreateScreen.tsx`
- `/Users/meniwap/mayyanhot/packages/contracts/src/index.ts`
- `/Users/meniwap/mayyanhot/packages/domain/src/repositories.ts`
- `/Users/meniwap/mayyanhot/supabase/migrations/20260327120000_phase11_offline_queue.sql`
- `/Users/meniwap/mayyanhot/supabase/tests/database/phase10_trust_and_projection.test.sql`
- `/Users/meniwap/mayyanhot/supabase/tests/database/phase11_offline_queue.test.sql`
- `/Users/meniwap/mayyanhot/tests/database/phase11-offline-queue.test.ts`
- `/Users/meniwap/mayyanhot/tests/database/schema-files.test.ts`
- `/Users/meniwap/mayyanhot/tests/integration/create-spring-flow.test.tsx`
- `/Users/meniwap/mayyanhot/tests/integration/offline-report-queue.test.ts`
- `/Users/meniwap/mayyanhot/tests/integration/report-submit-flow.test.tsx`
- `/Users/meniwap/mayyanhot/tests/ui/map-browse.test.tsx`
- `/Users/meniwap/mayyanhot/tests/ui/moderation-review.test.tsx`
- `/Users/meniwap/mayyanhot/tests/ui/render-with-theme.tsx`
- `/Users/meniwap/mayyanhot/tests/ui/report-compose.test.tsx`
- `/Users/meniwap/mayyanhot/tests/ui/spring-detail.test.tsx`
- `/Users/meniwap/mayyanhot/tests/mocks/async-storage.ts`
- `/Users/meniwap/mayyanhot/tests/mocks/expo-file-system-legacy.ts`
- `/Users/meniwap/mayyanhot/tests/mocks/expo-network.ts`
- `/Users/meniwap/mayyanhot/tests/mocks/react-native.ts`
- `/Users/meniwap/mayyanhot/tests/mocks/testing-library-react-native.ts`
- `/Users/meniwap/mayyanhot/vitest.config.ts`

## Next Required Action

- Commit the validated Phase 11 work, push it to GitHub, and wait for explicit authorization before Phase 12.

## Blockers

- No Phase 11 blocker remains.

## Recent Decision Summary

- Phase 11 offline-lite stays report-centered: queue only user report submissions, never admin spring creation.
- Persisted offline support applies only to previously loaded public-safe catalog/detail reads and the local report queue.
- Replay safety now depends on forward-only server idempotency keys for both report creation and media-slot reservation.

## Last Successful Validation Run

- 2026-03-27: `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm validate` passed with `32` Vitest files and `120` tests passing.
- 2026-03-27: `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm db:local:start` succeeded.
- 2026-03-27: `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm db:local:reset` succeeded through `20260327120000_phase11_offline_queue.sql`.
- 2026-03-27: `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm db:test:local` passed with `Files=6` and `Tests=87`.
- 2026-03-27: `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && npx supabase db push --linked` succeeded, applying the Phase 11 migration to the linked remote project `maayanhot`.

## What Every Agent Must Read Before Editing Anything

1. `/Users/meniwap/mayyanhot/docs/ANDI.md`
2. `/Users/meniwap/mayyanhot/docs/DECISIONS.md`
3. `/Users/meniwap/mayyanhot/docs/UI_CONTRACT.md`
4. `/Users/meniwap/mayyanhot/docs/API_CONTRACT.md`
5. `/Users/meniwap/mayyanhot/docs/THEMING.md`
6. `/Users/meniwap/mayyanhot/docs/VERSIONS.md`
7. `/Users/meniwap/mayyanhot/docs/PROGRESS.md`
