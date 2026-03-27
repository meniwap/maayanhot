# ANDI

## Current Phase

Phase 10

## Current Objective

Implement the trusted-contributor progression model, refine status derivation, and harden the projection cache path without starting Phase 11 or widening public exposure.

## Active Workstream

Complete. Phase 10 shipped the trust progression rules, refined derived-status policy, forward-only projection hardening, and matching tests/docs.

## Files Currently Being Modified / Claimed

- `/Users/meniwap/mayyanhot/docs/ANDI.md`
- `/Users/meniwap/mayyanhot/docs/PROGRESS.md`
- `/Users/meniwap/mayyanhot/docs/DECISIONS.md`
- `/Users/meniwap/mayyanhot/docs/API_CONTRACT.md`
- `/Users/meniwap/mayyanhot/docs/TEST_MATRIX.md`
- `/Users/meniwap/mayyanhot/packages/domain/src/index.ts`
- `/Users/meniwap/mayyanhot/packages/domain/src/permissions.ts`
- `/Users/meniwap/mayyanhot/packages/domain/src/status.ts`
- `/Users/meniwap/mayyanhot/packages/domain/src/trust.ts`
- `/Users/meniwap/mayyanhot/apps/mobile/src/infrastructure/services/moderate-report-flow.ts`
- `/Users/meniwap/mayyanhot/supabase/migrations/20260327090000_phase10_trust_and_projection.sql`
- `/Users/meniwap/mayyanhot/supabase/tests/database/phase10_trust_and_projection.test.sql`
- `/Users/meniwap/mayyanhot/tests/domain/permissions.test.ts`
- `/Users/meniwap/mayyanhot/tests/domain/projection-update.test.ts`
- `/Users/meniwap/mayyanhot/tests/domain/status-derivation.test.ts`
- `/Users/meniwap/mayyanhot/tests/domain/trust-progression.test.ts`
- `/Users/meniwap/mayyanhot/tests/integration/moderation-flow.test.ts`
- `/Users/meniwap/mayyanhot/tests/database/phase10-trust-and-projection.test.ts`
- `/Users/meniwap/mayyanhot/tests/database/schema-files.test.ts`

## Next Required Action

Wait for explicit authorization before starting Phase 11.

## Blockers

- No product blocker for Phase 10 delivery.
- Local Supabase DB re-execution is currently blocked at the environment level because the Docker daemon is not running on this Mac.

## Recent Decision Summary

- Trusted-contributor progression will remain rule-based, audit-safe, and separate from moderator/admin powers.
- Projection cache hardening will land as a forward-only change and must not change `spring_reports` plus moderation state as the source of truth.
- Phase 10 will prefer explicit domain helpers plus minimal SQL replacements over UI-local or ad hoc trust/status logic.

## Last Successful Validation Run

- 2026-03-27: `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && pnpm validate` passed after the Phase 10 implementation and doc updates.
- 2026-03-27: `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && npx supabase db push --linked` succeeded, applying `20260327090000_phase10_trust_and_projection.sql` to the linked remote project `maayanhot`.
- 2026-03-27: Targeted Phase 10 Vitest coverage passed for trust progression, refined status derivation, moderation-flow projection hardening, and SQL guardrail files.

## What Every Agent Must Read Before Editing Anything

1. `/Users/meniwap/mayyanhot/docs/ANDI.md`
2. `/Users/meniwap/mayyanhot/docs/DECISIONS.md`
3. `/Users/meniwap/mayyanhot/docs/UI_CONTRACT.md`
4. `/Users/meniwap/mayyanhot/docs/API_CONTRACT.md`
5. `/Users/meniwap/mayyanhot/docs/THEMING.md`
6. `/Users/meniwap/mayyanhot/docs/VERSIONS.md`
7. `/Users/meniwap/mayyanhot/docs/PROGRESS.md`
