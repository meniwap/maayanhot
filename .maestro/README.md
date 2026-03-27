# Maestro Moderation Flow

Phase 9 adds a mobile-first moderation approval scenario without adding Maestro as an npm dependency.

## Prerequisites

- The app is running in a development build, not Expo Go.
- The linked Supabase project is the real `maayanhot` project.
- The Phase 8 demo user and demo admin accounts exist.
- The one-time admin bootstrap SQL has already promoted the demo admin account.
- `MAESTRO_PUBLISHED_SPRING_ID` points to a published spring visible in the public catalog.
- `MAESTRO_PUBLISHED_SPRING_TITLE` matches that spring's visible title.
- `MAESTRO_EXPECTED_PUBLIC_STATUS_AFTER` matches the public detail status label expected after approval.

## Run Command

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
