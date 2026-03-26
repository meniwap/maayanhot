# Database Tests

Phase 4 and Phase 5 add pgTAP-ready database tests under `supabase/tests/database`.

Official local workflow once the Supabase CLI is available:

1. install the CLI
2. start the local stack with `npx supabase start`
3. run database tests with `npx supabase test db`

Current SQL suites:

- `phase4_schema.test.sql`
  - schema, index, and read-model presence checks
- `phase5_policies.test.sql`
  - RLS, grants, view exposure, trigger, RPC, and storage-policy checks

In the current environment, the CLI is not installed, so the repository also includes executable Vitest guardrail tests under `tests/database` to keep the schema and policy foundation validated in CI and local development.
