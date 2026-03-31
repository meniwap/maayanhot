# Progress

## Current Phase

Phase 14

## Done

- Re-read the control docs and claimed only the Phase 14 files needed for hardening, observability, tests, and documentation.
- Added the shared `@maayanhot/observability-core` package with provider-neutral analytics and error-reporting interfaces plus noop and in-memory test adapters.
- Added root-level observability composition without vendor lock-in for:
  - mobile provider and error boundary wiring
  - admin-web provider wiring
  - the Next.js admin-web root error boundary
- Extended `@maayanhot/upload-core` with prepared-asset and preprocessing policy interfaces for bounded image hardening.
- Added mobile-side one-pass image preprocessing through `expo-image-manipulator`:
  - resize longest edge to `2048`
  - one JPEG re-encode at quality `0.75`
  - strip EXIF through re-encoding
  - reject locally if the transformed file still exceeds `15 MiB`
- Hardened the offline-lite queue so attachment delivery state can now persist:
  - local ready
  - slot reserved
  - binary uploaded
  - finalize pending
  - finalized
- Hardened replay so finalize failures retry finalize without duplicate re-upload of the binary.
- Added the Phase 14 forward-only migration `20260331120000_phase14_hardening.sql` to:
  - normalize blank report notes to `null`
  - reject trimmed report notes longer than `2000` characters
  - cap reserved report attachments at `8` while preserving idempotent slot replay
- Added abuse-path, broken-upload, large-image, observability, and performance smoke coverage.

## In Progress

- None

## Blocked

- None

## Just Verified

- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm format:write` succeeded after the Phase 14 code and docs updates.
- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm validate` passed, including lint, format, typecheck, and the full Vitest suite with `45` passing test files and `167` passing tests.
- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm db:local:start` succeeded after Docker Desktop was started.
- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm db:local:reset` succeeded and applied the Phase 14 migration locally.
- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm db:test:local` passed with `Files=8` and `Tests=99`.
- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && npx supabase db push --linked` applied `20260331120000_phase14_hardening.sql` to the linked remote project.
- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm test:e2e:admin-web` passed with `2` Playwright admin-web tests.

## Remaining In Current Phase

- None

## Next Smallest Sensible Step

- Wait for explicit authorization before starting Phase 15.

## Contracts Changed This Session

- Added the shared `@maayanhot/observability-core` abstraction package for analytics and error reporting hooks.
- Extended `@maayanhot/upload-core` with prepared-asset and preprocessing policy interfaces.
- Kept public browse/detail and moderation contracts unchanged while tightening enforcement around:
  - report note length
  - blank-note normalization
  - max-8 attachment reservation

## Versions Changed This Session

- Phase 14 adds `expo-image-manipulator@~55.0.11` through the Expo-managed install path for bounded mobile image preprocessing.

## Risks Carried Forward

- Observability remains abstraction-only in Phase 14; no real analytics or crash vendor has been introduced yet.
- Upload hardening remains intentionally bounded to the report-media path; there is still no generalized background sync or media-processing pipeline.
- Admin web remains intentionally online-only; there is no offline admin support and no broader internal ops surface yet.
- The Phase 11 React Native Vitest harness still emits upstream `react-test-renderer` deprecation warnings and some `act(...)` warnings in older tests even though the suite passes.
