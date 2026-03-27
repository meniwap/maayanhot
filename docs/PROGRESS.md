# Progress

## Current Phase

Phase 12

## Done

- Re-read the control docs and claimed only the Phase 12 files needed for discovery, tests, and documentation.
- Kept Phase 12 fully client-side on top of the existing `public.public_spring_catalog` read surface and the Phase 11 persisted catalog cache.
- Expanded the app-local public catalog mapping to include `alternateNames` from the already-approved public browse view.
- Added feature-local discovery logic in the map-browse feature for:
  - normalized text search
  - bounded filters for water state and freshness
  - justified sorting by recent public activity or title
- Refactored the browse screen around one shared discovery state object covering:
  - map/list view mode
  - search text
  - filters
  - sort mode
  - selected spring
- Added explicit map/list coordination:
  - both views derive from the same filtered/sorted result set
  - selecting a list result switches back to map mode with the same spring selected
  - switching views preserves the discovery context
  - reset clears refinements without forcing a view-mode jump
- Added phase-appropriate discovery presenters:
  - discovery controls
  - list results
  - empty state
- Upgraded the shared `Chip` primitive so it can be used as an interactive discovery control instead of a static badge only.
- Kept offline-lite boundaries intact:
  - no new persisted private/staff query families
  - no offline map tiles
  - no new offline write behavior
  - cached catalog discovery still works when public data was previously loaded

## In Progress

- None

## Blocked

- None

## Just Verified

- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm test -- --run tests/ui/map-browse-discovery.test.ts tests/ui/map-browse.test.tsx tests/integration/discovery-flow.test.tsx tests/integration/spring-read-flow.test.tsx` passed.
- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm format:write` succeeded after the Phase 12 implementation and docs updates.
- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm validate` passes, including lint, format, typecheck, and the full Vitest suite.

## Remaining In Current Phase

- Commit the validated Phase 12 work, push it to the existing public GitHub repo, and stop for explicit authorization before Phase 13.

## Next Smallest Sensible Step

- Push the validated Phase 12 branch state to `origin/main` and wait for explicit authorization before starting Phase 13.

## Contracts Changed This Session

- No shared contract or domain port changed in Phase 12.
- The app-local `PublicSpringCatalogRow` mapping now includes `alternateNames`, matching the already-approved `public.public_spring_catalog` view.
- Discovery uses only public-safe browse fields and remains client-side in this phase.

## Versions Changed This Session

- None

## Risks Carried Forward

- Discovery remains substring-based and client-side; Phase 12 intentionally does not add remote ranking, fuzzy matching, or viewport-specific backend requery.
- The Phase 11 React Native Vitest harness still emits upstream `react-test-renderer` deprecation warnings and some `act(...)` warnings in older tests even though the suite passes.
