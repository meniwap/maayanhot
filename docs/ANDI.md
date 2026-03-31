# ANDI

## Current Phase

Phase 15

## Current Objective

Complete release-readiness work: beta/store checklists, bounded onboarding polish, legal/privacy placeholders, release-facing mobile config, and final smoke/journey verification without widening public data exposure or opening a new product phase.

## Active Workstream

Phase 15 focuses on release readiness only: internal-beta preparation for iOS and Android, a truthful readiness matrix, bounded first-run polish, release-facing metadata/config, legal/privacy placeholders, and final smoke verification for end-user and moderator/admin journeys.

## Files Currently Being Modified / Claimed

- `/Users/meniwap/mayyanhot/docs/ANDI.md`
- `/Users/meniwap/mayyanhot/docs/PROGRESS.md`
- `/Users/meniwap/mayyanhot/docs/DECISIONS.md`
- `/Users/meniwap/mayyanhot/docs/API_CONTRACT.md`
- `/Users/meniwap/mayyanhot/docs/UI_CONTRACT.md`
- `/Users/meniwap/mayyanhot/docs/TEST_MATRIX.md`
- `/Users/meniwap/mayyanhot/docs/VERSIONS.md`
- `/Users/meniwap/mayyanhot/docs/MASTER_PLAN.md`
- `/Users/meniwap/mayyanhot/docs/RELEASE_CHECKLIST.md`
- `/Users/meniwap/mayyanhot/docs/RELEASE_READINESS.md`
- `/Users/meniwap/mayyanhot/README.md`
- `/Users/meniwap/mayyanhot/eas.json`
- `/Users/meniwap/mayyanhot/package.json`
- `/Users/meniwap/mayyanhot/apps/mobile/app.json`
- `/Users/meniwap/mayyanhot/apps/mobile/app/**`
- `/Users/meniwap/mayyanhot/apps/mobile/assets/**`
- `/Users/meniwap/mayyanhot/apps/mobile/src/features/map-browse/**`
- `/Users/meniwap/mayyanhot/apps/mobile/src/features/about/**`
- `/Users/meniwap/mayyanhot/apps/mobile/src/features/onboarding/**`
- `/Users/meniwap/mayyanhot/.maestro/**`
- `/Users/meniwap/mayyanhot/tests/ui/**`
- `/Users/meniwap/mayyanhot/tests/e2e/**`
- `/Users/meniwap/mayyanhot/tests/integration/**`
- `/Users/meniwap/mayyanhot/vitest.config.ts`
- `/Users/meniwap/mayyanhot/playwright.config.ts`

## Next Required Action

- Wait for explicit authorization before opening any post-roadmap work.

## Blockers

- No Phase 15 blocker is currently open.

## Recent Decision Summary

- Phase 15 targets internal/private beta readiness on both iOS and Android, but it does not claim full dual-store launch readiness.
- Deep-link work remains bounded to the existing public scheme route for spring detail; universal links and Android App Links stay deferred.
- Release readiness must be reported truthfully as a matrix of done, beta-ready, manual external steps, placeholders, and deferred work.

## Last Successful Validation Run

- 2026-04-01: `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm exec vitest run tests/ui/mobile-release-readiness.test.tsx tests/ui/map-browse.test.tsx` passed with `2` files and `14` tests.
- 2026-04-01: `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm typecheck` passed.
- 2026-04-01: `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm admin-web:build` passed.
- 2026-04-01: `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm test:e2e:release-web` passed with `2` release-smoke browser tests.
- 2026-04-01: `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm test:e2e:admin-web` passed with `2` moderator/admin browser tests.
- 2026-04-01: `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && cd apps/mobile && npx expo run:ios --device "iPhone 17 Pro"` passed.
- 2026-04-01: `MAESTRO_DRIVER_STARTUP_TIMEOUT=120000 maestro --device 20913F04-B3F2-440A-B361-56D1D5A01D7B test .maestro/release-public-browse-detail.yaml` passed.
- 2026-04-01: `MAESTRO_DRIVER_STARTUP_TIMEOUT=120000 maestro --device 20913F04-B3F2-440A-B361-56D1D5A01D7B test .maestro/release-report-submit.yaml` passed.
- 2026-04-01: `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && cd apps/mobile && npx expo run:android -d Pixel_9` passed.
- 2026-04-01: `maestro --device emulator-5554 test .maestro/release-public-browse-detail.yaml` passed.
- 2026-04-01: `maestro --device emulator-5554 test .maestro/release-report-submit.yaml` passed.
- 2026-04-01: `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm format:write` succeeded after the final Phase 15 docs updates.
- 2026-04-01: `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm validate` passed with `46` test files and `170` tests.

## What Every Agent Must Read Before Editing Anything

1. `/Users/meniwap/mayyanhot/docs/ANDI.md`
2. `/Users/meniwap/mayyanhot/docs/DECISIONS.md`
3. `/Users/meniwap/mayyanhot/docs/UI_CONTRACT.md`
4. `/Users/meniwap/mayyanhot/docs/API_CONTRACT.md`
5. `/Users/meniwap/mayyanhot/docs/THEMING.md`
6. `/Users/meniwap/mayyanhot/docs/VERSIONS.md`
7. `/Users/meniwap/mayyanhot/docs/PROGRESS.md`
