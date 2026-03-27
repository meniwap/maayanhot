# Progress

## Current Phase

Phase 10

## Done

- Re-read the control docs and claimed only the Phase 10 files required for trust progression, refined status derivation, projection hardening, tests, and docs.
- Added explicit domain-level trusted-contributor progression helpers:
  - `/Users/meniwap/mayyanhot/packages/domain/src/trust.ts`
  - exported through `/Users/meniwap/mayyanhot/packages/domain/src/index.ts`
- Refined `deriveSpringStatusProjection(...)` so the derived model now includes:
  - corroboration bonuses for aligned definitive approved reports
  - downweighting of `unknown` evidence relative to definitive evidence
  - a decisive-score floor so very weak stale evidence resolves to `unknown` instead of an overconfident public state
- Added domain-level projection cache hardening with `shouldReplaceSpringStatusProjection(...)`.
- Updated the Phase 9 moderation flow so it now checks the current cached projection and skips stale recomputation writes before calling the projection repository.
- Added a new forward-only migration:
  - `/Users/meniwap/mayyanhot/supabase/migrations/20260327090000_phase10_trust_and_projection.sql`
- That migration now:
  - adds `private.sync_trusted_contributor_role(...)`
  - replaces `public.refresh_user_report_snapshot(...)` so trust progression sync happens after cached snapshot refresh
  - hardens `public.staff_upsert_spring_status_projection(...)` against stale `recalculated_at` writes
- Added new SQL guardrails:
  - `/Users/meniwap/mayyanhot/supabase/tests/database/phase10_trust_and_projection.test.sql`
- Added new executable tests:
  - `/Users/meniwap/mayyanhot/tests/domain/trust-progression.test.ts`
  - `/Users/meniwap/mayyanhot/tests/domain/projection-update.test.ts`
  - `/Users/meniwap/mayyanhot/tests/database/phase10-trust-and-projection.test.ts`
- Extended existing executable tests for:
  - refined status derivation behavior
  - submit permissions remaining unchanged for trusted contributors
  - moderation flow behavior when a newer projection already exists
- Applied the Phase 10 migration to the linked remote Supabase project `maayanhot` with:
  - `npx supabase db push --linked`
- Re-ran `pnpm validate` successfully under Node `24.14.1`.

## In Progress

- None

## Blocked

- Local Phase 10 pgTAP re-execution is temporarily blocked at the environment level because the Docker daemon is not currently running on this Mac.

## Just Verified

- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm typecheck` passes.
- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm validate` passes, including lint, format, typecheck, and the full Vitest suite.
- The new Phase 10 targeted tests pass, including:
  - trust progression rules
  - refined status derivation
  - cached projection update behavior
  - Phase 10 migration/file guardrails
- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && npx supabase db push --linked` succeeds and applies `20260327090000_phase10_trust_and_projection.sql` to the linked remote project `maayanhot`.
- `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm db:local:start` is currently blocked because Docker Desktop is installed but the Docker daemon is not running.

## Remaining In Current Phase

- Update the control docs, leave the repo clean and pushable, and stop for explicit authorization before Phase 11.

## Next Smallest Sensible Step

Wait for explicit authorization before starting Phase 11.

## Contracts Changed This Session

- No transport-facing public read/write shape changed in Phase 10.
- Domain behavior changed in two bounded areas:
  - trusted-contributor progression rules are now explicit and executable
  - derived status and projection-cache replacement rules are now more explicit and test-covered

## Versions Changed This Session

- None in Phase 10.

## Risks Carried Forward

- The local Supabase DB test path remains environment-dependent on a live Docker daemon even though the repo wiring is already proven.
- Trusted-contributor progression currently changes role assignment history only; any future privilege expansion must remain explicitly policy-reviewed in a later authorized phase.
- The existing Phase 2 UI tests still emit upstream `react-test-renderer` deprecation warnings under Vitest even though the suite passes.
