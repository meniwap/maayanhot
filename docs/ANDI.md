# ANDI

## Current Phase

Phase 12

## Current Objective

Implement bounded discovery behavior on top of the existing public-safe catalog: client-side search, filters, justified sorting, and explicit map/list coordination without widening public data exposure or breaking Phase 11 offline-lite guarantees.

## Active Workstream

Complete. Phase 12 now provides client-side search, filters, lightweight sorting, and explicit map/list coordination on top of the existing public-safe catalog and the persisted Phase 11 browse cache.

## Files Currently Being Modified / Claimed

- `/Users/meniwap/mayyanhot/docs/ANDI.md`
- `/Users/meniwap/mayyanhot/docs/PROGRESS.md`
- `/Users/meniwap/mayyanhot/docs/DECISIONS.md`
- `/Users/meniwap/mayyanhot/docs/API_CONTRACT.md`
- `/Users/meniwap/mayyanhot/docs/UI_CONTRACT.md`
- `/Users/meniwap/mayyanhot/docs/TEST_MATRIX.md`
- `/Users/meniwap/mayyanhot/apps/mobile/src/features/map-browse/MapBrowseScreen.tsx`
- `/Users/meniwap/mayyanhot/apps/mobile/src/features/map-browse/DiscoveryControls.tsx`
- `/Users/meniwap/mayyanhot/apps/mobile/src/features/map-browse/SpringDiscoveryList.tsx`
- `/Users/meniwap/mayyanhot/apps/mobile/src/features/map-browse/discovery.ts`
- `/Users/meniwap/mayyanhot/apps/mobile/src/features/map-browse/public-spring-catalog.ts`
- `/Users/meniwap/mayyanhot/apps/mobile/src/infrastructure/supabase/repositories/public-spring-read-repository.ts`
- `/Users/meniwap/mayyanhot/packages/ui/src/components/Chip.tsx`
- `/Users/meniwap/mayyanhot/tests/fixtures/public-spring-data.ts`
- `/Users/meniwap/mayyanhot/tests/integration/discovery-flow.test.tsx`
- `/Users/meniwap/mayyanhot/tests/ui/map-browse-discovery.test.ts`
- `/Users/meniwap/mayyanhot/tests/ui/map-browse.test.tsx`

## Next Required Action

- Commit the validated Phase 12 work, push it to GitHub, and wait for explicit authorization before Phase 13.

## Blockers

- No Phase 12 blocker is known yet.

## Recent Decision Summary

- Phase 12 discovery stays entirely client-side on top of `public.public_spring_catalog`; no new search RPC or migration is planned.
- Map and list views will share one search/filter/sort state instead of keeping parallel browse state.
- Offline-lite remains bounded to previously loaded public catalog/detail data; discovery must work on cached catalog rows without expanding private/staff persistence.

## Last Successful Validation Run

- 2026-03-27: `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm test -- --run tests/ui/map-browse-discovery.test.ts tests/ui/map-browse.test.tsx tests/integration/discovery-flow.test.tsx tests/integration/spring-read-flow.test.tsx` passed.
- 2026-03-27: `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm format:write` succeeded after the Phase 12 implementation and docs updates.
- 2026-03-27: `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm validate` passed with `34` Vitest files and `132` tests passing.

## What Every Agent Must Read Before Editing Anything

1. `/Users/meniwap/mayyanhot/docs/ANDI.md`
2. `/Users/meniwap/mayyanhot/docs/DECISIONS.md`
3. `/Users/meniwap/mayyanhot/docs/UI_CONTRACT.md`
4. `/Users/meniwap/mayyanhot/docs/API_CONTRACT.md`
5. `/Users/meniwap/mayyanhot/docs/THEMING.md`
6. `/Users/meniwap/mayyanhot/docs/VERSIONS.md`
7. `/Users/meniwap/mayyanhot/docs/PROGRESS.md`
