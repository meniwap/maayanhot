# Maestro Mobile Flows

The repo keeps Maestro outside npm and uses the real native app id `com.meniwap.maayanhot` for mobile smoke and critical-journey verification.

## Prerequisites

- The app is running in a development build, not Expo Go.
- The linked Supabase project is the real `maayanhot` project.
- The Phase 8 demo user and demo admin accounts exist.
- The one-time admin bootstrap SQL has already promoted the demo admin account.
- `MAESTRO_PUBLISHED_SPRING_ID` points to a published spring visible in the public catalog.
- `MAESTRO_PUBLISHED_SPRING_TITLE` matches that spring's visible title.
- `MAESTRO_EXPECTED_PUBLIC_STATUS_AFTER` matches the public detail status label expected after approval.
- The only release-documented public deep link is `springs-israel://springs/:springId`.
- `springs-israel://dev/session` is an internal beta-testing route only and is not part of the public release contract.

The same committed flows can run on iOS simulator or Android emulator as long as the build uses the same app id.

## Release Smoke Commands

Public browse, onboarding, and detail deep-link smoke:

```bash
MAESTRO_PUBLISHED_SPRING_ID=00000000-0000-0000-0000-000000000000 \
MAESTRO_PUBLISHED_SPRING_TITLE="עין בדיקה" \
maestro test .maestro/release-public-browse-detail.yaml
```

Authenticated internal-beta report smoke:

```bash
MAESTRO_PUBLISHED_SPRING_ID=00000000-0000-0000-0000-000000000000 \
MAESTRO_PUBLISHED_SPRING_TITLE="עין בדיקה" \
maestro test .maestro/release-report-submit.yaml
```

The report smoke intentionally uses the internal testing deep-link path only to sign in a demo tester before opening the public spring detail route. That path is valid for internal beta verification only and should not be documented as a public release feature.

## Existing Moderation Flow

```bash
maestro test .maestro/moderation-approve-flow.yaml
```

Example with env:

```bash
MAESTRO_PUBLISHED_SPRING_ID=00000000-0000-0000-0000-000000000000 \
MAESTRO_PUBLISHED_SPRING_TITLE="עין בדיקה" \
MAESTRO_EXPECTED_PUBLIC_STATUS_AFTER="יש מים לפי דיווח מאושר עדכני" \
maestro test .maestro/moderation-approve-flow.yaml
```
