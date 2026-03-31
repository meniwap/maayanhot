# Progress

## Current Phase

Phase 15

## Done

- Re-read the control docs and claimed only the Phase 15 files needed for release readiness, onboarding polish, release metadata, smoke coverage, and roadmap closure.
- Added bounded first-run onboarding on the mobile map entry flow with persisted dismissal and beta framing.
- Added release-facing in-app support routes:
  - `/about`
  - `/legal/privacy`
  - `/legal/terms`
- Added release placeholder icon, splash, and Android adaptive icon assets under `apps/mobile/assets/release`.
- Finalized release-facing mobile config in `apps/mobile/app.json`:
  - app name `Springs Israel Beta`
  - version `0.15.0`
  - iOS build number `15`
  - Android version code `15`
  - release-facing permission strings
- Added `eas.json` with internal beta build profiles for iOS and Android.
- Added repo command paths for:
  - `pnpm build:beta:ios`
  - `pnpm build:beta:android`
  - `pnpm admin-web:build`
- Formalized the only release-documented public deep link:
  - `springs-israel://springs/:springId`
- Added Phase 15 release smoke coverage:
  - mobile public browse/detail + deep-link Maestro flow
  - mobile internal-auth report-submit Maestro flow
  - admin-web release smoke Playwright flow
- Added release-readiness artifacts:
  - `docs/RELEASE_CHECKLIST.md`
  - `docs/RELEASE_READINESS.md`
- Closed the original Phase 0-15 roadmap honestly in `docs/MASTER_PLAN.md` without inventing a new major feature phase.

## In Progress

- None

## Blocked

- None

## Just Verified

- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm exec vitest run tests/ui/mobile-release-readiness.test.tsx tests/ui/map-browse.test.tsx` passed with `2` files and `14` tests.
- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm typecheck` passed.
- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm admin-web:build` passed and produced a clean Next.js 16 production build for the admin-web surface.
- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm test:e2e:release-web` passed with `2` Playwright release-smoke tests.
- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm test:e2e:admin-web` passed with `2` moderator/admin journey tests.
- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && cd apps/mobile && npx expo run:ios --device "iPhone 17 Pro"` passed with a successful native install on the iOS simulator.
- `MAESTRO_DRIVER_STARTUP_TIMEOUT=120000 maestro --device 20913F04-B3F2-440A-B361-56D1D5A01D7B test .maestro/release-public-browse-detail.yaml` passed on iOS.
- `MAESTRO_DRIVER_STARTUP_TIMEOUT=120000 maestro --device 20913F04-B3F2-440A-B361-56D1D5A01D7B test .maestro/release-report-submit.yaml` passed on iOS.
- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && cd apps/mobile && npx expo run:android -d Pixel_9` passed with a successful native install on the Android emulator.
- `maestro --device emulator-5554 test .maestro/release-public-browse-detail.yaml` passed on Android.
- `maestro --device emulator-5554 test .maestro/release-report-submit.yaml` passed on Android.
- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm format:write` succeeded after the final Phase 15 docs updates.
- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm validate` passed, including lint, format, typecheck, and the full Vitest suite with `46` passing test files and `170` passing tests.

## Remaining In Current Phase

- None

## Next Smallest Sensible Step

- Wait for explicit authorization before opening any post-roadmap work.

## Contracts Changed This Session

- No backend schema or public API contract changed in Phase 15.
- The documented release-facing contract changes are bounded to:
  - the public deep-link declaration `springs-israel://springs/:springId`
  - release-facing mobile metadata/config
  - in-app onboarding and legal placeholder routes

## Versions Changed This Session

- Phase 15 adds `expo-system-ui@~55.0.11` through the Expo-managed install path so Android beta/release configuration can honor the app-level `userInterfaceStyle` setting.

## Risks Carried Forward

- Privacy and Terms remain placeholder-level screens and still require final legal review plus hosted public URLs before real store submission.
- App icon, splash, and adaptive icon are beta-appropriate placeholders, not final brand assets.
- Internal beta readiness is now validated on both platforms, but Android Maestro/device-state showed flakiness on later repeated reruns after successful smoke passes; a fresh-device rerun is still recommended before a real beta handoff.
- Admin web remains intentionally online-only and internal-only.
- The React Native Vitest harness still emits upstream `react-test-renderer` deprecation warnings and some `act(...)` warnings in older tests even though the suite passes.
