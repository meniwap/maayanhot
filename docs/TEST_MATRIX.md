# Test Matrix

## Test Policy

- Every phase has explicit validation gates.
- Tests should land with the phase that introduces the behavior.
- Contract changes require matching test updates in the same session.
- No phase is complete until its required tests pass or the phase explicitly states that only documentation validation is required.

## Current Status

Phase 12 adds bounded discovery coverage for client-side search, filters, lightweight sorting, and shared map/list coordination on top of the persisted public catalog path from Phase 11.

## Inventory By Category

| Category         | Test / Validation                                                                      | Required by phase | Status   |
| ---------------- | -------------------------------------------------------------------------------------- | ----------------- | -------- |
| Documentation    | Required control docs exist and are internally coherent                                | 0                 | Complete |
| Documentation    | Version baseline includes source, stability, compatibility, lock strategy, and caveats | 0                 | Complete |
| Tooling          | Workspace install succeeds from clean checkout                                         | 1                 | Complete |
| Tooling          | `lint` command passes                                                                  | 1                 | Complete |
| Tooling          | `typecheck` command passes                                                             | 1                 | Complete |
| Tooling          | `test` command passes in CI                                                            | 1                 | Complete |
| Tooling          | Local Supabase stack starts through `pnpm db:local:start`                              | Pre-10            | Complete |
| Tooling          | Local Supabase reset path runs through `pnpm db:local:reset`                           | Pre-10            | Complete |
| Tooling          | Local database test path runs through `pnpm db:test:local`                             | Pre-10            | Complete |
| Tooling          | Native iOS development build installs with `npx expo run:ios --device "iPhone 17"`     | Pre-10            | Complete |
| Tooling          | Local Maestro smoke flow runs on iOS simulator                                         | Pre-10            | Complete |
| UI Foundation    | Theme token structure and central theme-swap tests                                     | 2                 | Complete |
| UI Foundation    | Button label, variant, and disabled-state tests                                        | 2                 | Complete |
| UI Foundation    | StatusBadge semantic styling tests                                                     | 2                 | Complete |
| UI Foundation    | Stack and Inline token-spacing and logical-direction tests                             | 2                 | Complete |
| UI Foundation    | AppText typography token tests                                                         | 2                 | Complete |
| UI Foundation    | RTL-aware Hebrew smoke checks for shared primitives                                    | 2                 | Complete |
| Domain           | Status derivation unit tests                                                           | 3, 10             | Complete |
| Domain           | Permission guard tests for spring creation and moderation boundaries                   | 3                 | Complete |
| Domain           | Repository contract tests / interface conformance tests                                | 3                 | Complete |
| Domain           | Map/navigation/upload adapter port conformance tests                                   | 3                 | Complete |
| Domain           | Validation schema tests                                                                | 3                 | Planned  |
| Database         | Migration reproducibility and config integrity tests                                   | 4                 | Complete |
| Database         | Schema constraint and contract-alignment tests                                         | 4                 | Complete |
| Database         | Geospatial schema/index integrity tests                                                | 4                 | Complete |
| Database         | Seed strategy/config integrity test                                                    | 4                 | Complete |
| Database         | pgTAP-ready database test files committed under `supabase/tests/database`              | 4                 | Complete |
| Security         | RLS allow/deny matrix tests                                                            | 5                 | Complete |
| Security         | Storage policy access tests                                                            | 5                 | Complete |
| Security         | Unauthorized role action tests                                                         | 5                 | Complete |
| Map              | Marker rendering tests                                                                 | 6                 | Complete |
| Map              | Spring selection tests                                                                 | 6                 | Complete |
| Map              | Cluster behavior tests if clustering is enabled                                        | 6                 | Not used |
| Map              | Provider abstraction behavior tests                                                    | 6                 | Complete |
| Map              | Map browse shell rendering and teaser interaction tests                                | 6                 | Complete |
| Read Flow        | Spring detail integration test                                                         | 7                 | Complete |
| Read Flow        | External navigation handoff adapter tests                                              | 7                 | Complete |
| Read Flow        | Empty/error state screen tests                                                         | 7                 | Complete |
| Create Flow      | Admin create spring integration test                                                   | 8                 | Complete |
| Create Flow      | User report submission integration test                                                | 8                 | Complete |
| Create Flow      | Photo attach/upload integration test                                                   | 8                 | Complete |
| Create Flow      | Slug normalization/conflict unit tests                                                 | 8                 | Complete |
| Device           | Camera permission flow test                                                            | 8                 | Complete |
| Device           | Gallery permission flow test                                                           | 8                 | Complete |
| Upload           | Upload-core MIME/size validation tests                                                 | 8                 | Complete |
| Upload           | Reserved-slot retry tests                                                              | 8                 | Complete |
| Database         | Public-safe detail surface and upload-RPC guardrail tests                              | 8                 | Complete |
| Moderation       | Moderation queue integration test                                                      | 9                 | Complete |
| Moderation       | Approve/reject state transition tests                                                  | 9                 | Complete |
| Moderation       | Audit-linked moderation SQL/policy guardrails                                          | 9                 | Complete |
| Moderation       | Moderation queue/review UI tests                                                       | 9                 | Complete |
| Moderation       | Maestro approval-flow artifact committed                                               | 9                 | Complete |
| Trust And Status | Trust escalation rules tests                                                           | 10                | Complete |
| Trust And Status | Stale/recent/unknown status derivation tests                                           | 10                | Complete |
| Trust And Status | Cached projection update tests                                                         | 10                | Complete |
| Offline          | Queue enqueue/dequeue tests                                                            | 11                | Complete |
| Offline          | Retry and backoff rules tests                                                          | 11                | Complete |
| Offline          | Reconnect merge tests                                                                  | 11                | Complete |
| Offline          | Previously loaded data offline-read test                                               | 11                | Complete |
| Offline          | Admin create remains online-only while offline                                         | 11                | Complete |
| Discovery        | Search/filter integration tests                                                        | 12                | Complete |
| Discovery        | List/map coordination tests                                                            | 12                | Complete |
| Discovery        | Offline-compatible cached browse discovery regression                                  | 12                | Complete |
| Admin Web        | Admin moderation workflow E2E                                                          | 13                | Planned  |
| Admin Web        | Spring management integration tests                                                    | 13                | Planned  |
| Hardening        | Abuse scenario tests                                                                   | 14                | Planned  |
| Hardening        | Broken upload resilience tests                                                         | 14                | Planned  |
| Hardening        | Large image compression/rejection tests                                                | 14                | Planned  |
| Hardening        | Performance smoke checks                                                               | 14                | Planned  |
| Release          | Core user journey E2E                                                                  | 15                | Planned  |
| Release          | Moderator/admin journey E2E                                                            | 15                | Planned  |
| Release          | Release smoke checklist verification                                                   | 15                | Planned  |

## Recommended Tooling Baseline

- Unit and domain tests: Vitest
- Mobile component tests: React Native Testing Library is the intended long-term library, but Phase 2 currently runs a local compatibility harness on top of `react-test-renderer` to keep Vitest as the sole runner
- Mobile E2E: Maestro, now proven locally on iOS simulator with `.maestro/smoke-dev-session.yaml`
- Admin web E2E: Playwright
- Database and policy tests: SQL-based checks plus integration harnesses run from CI; the repo now also has a proven local pgTAP command path through pinned `supabase` CLI scripts plus Docker Desktop on this Mac

Exact tool versions will be pinned when those tools are introduced in code and added to `docs/VERSIONS.md` if they are not already covered by the baseline.

## Phase Gates

| Phase | Required validation gate                                                                         |
| ----- | ------------------------------------------------------------------------------------------------ |
| 0     | Documentation completeness and version-verification review                                       |
| 1     | Clean install, lint, typecheck, and test commands running in CI                                  |
| 2     | Shared UI primitive tests and RTL-aware baseline checks                                          |
| 3     | Contract and domain tests                                                                        |
| 4     | Migration, constraint, and geospatial tests                                                      |
| 5     | RLS and storage policy tests                                                                     |
| 6     | Map behavior and basic mobile rendering tests                                                    |
| 7     | Read-flow integration and screen tests                                                           |
| 8     | Create/report/upload integration and permission tests                                            |
| 9     | Moderation integration, state-transition, SQL/policy guardrails, and committed E2E flow artifact |
| 10    | Status derivation, trust escalation, and projection tests                                        |
| 11    | Offline queue, reconnect/backoff, offline-read, and replay-safety tests                          |
| 12    | Discovery/search/filter behavior tests plus list/map coordination coverage                       |
| 13    | Admin integration and E2E tests                                                                  |
| 14    | Resilience, abuse, and performance smoke checks                                                  |
| 15    | Release smoke verification and critical-journey E2E pass                                         |

## Exit Criteria For A Testable Phase

- Tests for the newly introduced behavior exist.
- Existing tests still pass.
- The relevant contract docs match the implemented behavior.
- `docs/PROGRESS.md` and `docs/ANDI.md` record the validation results.
