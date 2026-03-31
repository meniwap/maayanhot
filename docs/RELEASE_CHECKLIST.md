# Release Checklist

Phase 15 targets internal/private beta readiness on iOS and Android. This checklist separates what is already configured in the repo from what is still manual, placeholder-only, or intentionally deferred.

## Repo-Configured

- Mobile app metadata is now release-facing in [app.json](/Users/meniwap/mayyanhot/apps/mobile/app.json):
  - app name `Springs Israel Beta`
  - version `0.15.0`
  - iOS build number `15`
  - Android version code `15`
  - release icon, splash, and adaptive icon paths
  - release permission copy for camera and photo-library flows
- Internal beta EAS profiles exist in [eas.json](/Users/meniwap/mayyanhot/eas.json):
  - `beta-ios`
  - `beta-android`
- Explicit beta build command paths exist in [package.json](/Users/meniwap/mayyanhot/package.json):
  - `pnpm build:beta:ios`
  - `pnpm build:beta:android`
  - `pnpm admin-web:build`
- First-run onboarding exists and is locally dismissible:
  - explains moderated reports
  - explains offline-lite boundaries
  - explains external navigation handoff
  - explains beta framing
- Release-facing in-app support routes exist:
  - `/about`
  - `/legal/privacy`
  - `/legal/terms`
- Privacy and Terms screens are explicitly labeled as placeholders and not legal advice.
- The only release-documented public deep link is:
  - `springs-israel://springs/:springId`
- Release smoke assets exist under [apps/mobile/assets/release](/Users/meniwap/mayyanhot/apps/mobile/assets/release).

## Locally Validated

- `pnpm exec vitest run tests/ui/mobile-release-readiness.test.tsx tests/ui/map-browse.test.tsx`
  - passed with `2` files and `14` tests
- `pnpm typecheck`
  - passed
- `pnpm admin-web:build`
  - passed after wrapping the two `useSearchParams()` admin routes in `Suspense` for the current Next 16 requirement
- `pnpm test:e2e:release-web`
  - passed with `2` Playwright release-smoke tests
- `pnpm test:e2e:admin-web`
  - passed with `2` Playwright moderator/admin journey tests
- `npx expo run:ios --device "iPhone 17 Pro"`
  - passed with a successful native install on the iOS simulator
- `npx expo run:android -d Pixel_9`
  - passed with a successful native install on the Android emulator
- `maestro --device 20913F04-B3F2-440A-B361-56D1D5A01D7B test .maestro/release-public-browse-detail.yaml`
  - passed on iOS
- `maestro --device 20913F04-B3F2-440A-B361-56D1D5A01D7B test .maestro/release-report-submit.yaml`
  - passed on iOS
- `maestro --device emulator-5554 test .maestro/release-public-browse-detail.yaml`
  - passed on Android
- `maestro --device emulator-5554 test .maestro/release-report-submit.yaml`
  - passed on Android

Android note:

- The committed Android smoke flows were locally validated in this phase.
- Later repeated reruns hit Maestro/device-state instability after multiple consecutive runs, so the repo treats Android as locally validated for beta readiness but still recommends a cold-boot rerun before a real distribution handoff.

See [RELEASE_READINESS.md](/Users/meniwap/mayyanhot/docs/RELEASE_READINESS.md) for the exact outcome of each item above.

## Manual External Setup

- Create and configure the EAS project if not already linked for hosted builds.
- Create Apple App Store Connect app record.
- Create Google Play Console app record.
- Upload final store listing metadata, screenshots, and merchandising copy.
- Replace placeholder privacy and terms content with hosted, counsel-reviewed documents.
- Complete Apple App Privacy answers.
- Complete Google Play Data Safety answers.
- Choose internal beta audience and distribution groups.
- Run real internal beta submission steps:
  - iOS TestFlight upload and tester assignment
  - Android internal testing track upload and tester assignment

## Placeholder-Only

- App icon, splash, and adaptive icon are placeholder-level release assets, not final brand assets.
- Privacy policy screen is placeholder copy only.
- Terms screen is placeholder copy only.
- Beta framing copy is production-suitable for internal testing, but not final consumer-store merchandising copy.

## Deferred

- Universal Links
- Android App Links
- share-sheet driven inbound linking
- external/public beta auth strategy beyond the current internal test path
- final store screenshots and localized listing copy
- final legal review and hosted policy URLs
