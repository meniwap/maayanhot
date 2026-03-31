# Release Readiness

This matrix is intentionally strict. "Beta ready" means the repo is configured for internal beta distribution and the relevant local verification path was exercised. "Store submission" remains a separate bar with external/manual requirements.

## Done

- Release checklist exists in [RELEASE_CHECKLIST.md](/Users/meniwap/mayyanhot/docs/RELEASE_CHECKLIST.md).
- Mobile app metadata is prepared for internal beta use in [app.json](/Users/meniwap/mayyanhot/apps/mobile/app.json).
- Internal beta EAS profiles exist in [eas.json](/Users/meniwap/mayyanhot/eas.json).
- In-app onboarding, About/Beta info, and legal placeholder routes exist.
- Admin-web production build smoke exists and is part of the release verification path.
- A narrow deep-link contract is documented:
  - `springs-israel://springs/:springId`
- Release smoke artifacts exist for:
  - mobile public browse/detail
  - mobile internal-auth report submit
  - admin-web release smoke

## Beta Ready On iOS

- Native iOS development build compiles and installs locally through `npx expo run:ios --device "iPhone 17 Pro"`.
- Mobile release smoke passed locally on iOS for:
  - onboarding and public browse/search/detail
  - public deep link to spring detail
  - authenticated internal-beta report submission through the existing dev-session test path
- Current local status:
  - `Yes`

## Beta Ready On Android

- Android emulator configuration exists locally through the `Pixel_9` AVD.
- Android release-facing config now includes `expo-system-ui`, which was required for the `userInterfaceStyle` release metadata path.
- Native Android build and install succeeded locally through `npx expo run:android -d Pixel_9`.
- Mobile release smoke passed locally on Android for the same two committed Maestro flows used on iOS.
- Current local status:
  - `Yes`
- Validation caveat:
  - repeated post-pass reruns later in the same session exposed Maestro/emulator flakiness after multiple consecutive runs, so Android is considered beta-ready and locally validated, but the final pre-distribution check should include one fresh-device rerun.

## Still Manual For iOS Store Submission

- App Store Connect app configuration
- final hosted privacy policy URL
- final hosted terms URL
- App Privacy questionnaire completion
- final brand/store screenshots and copy
- TestFlight distribution and tester group setup

## Still Manual For Android Store Submission

- Play Console app configuration
- final hosted privacy policy URL
- final brand/store screenshots and copy
- Data Safety form completion
- internal testing / closed testing track setup

## Deferred Post-Phase-15

- Universal Links
- Android App Links
- public beta auth strategy
- final brand asset pass
- final legal review
- post-beta roadmap prioritization from real tester feedback
