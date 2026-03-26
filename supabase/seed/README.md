# Seed Strategy

Phase 4 keeps the seed baseline intentionally minimal and reproducible.

Rules:

- Seed files should contain data only, not schema changes.
- The configured seed order is controlled by `supabase/config.toml`.
- The initial seed file is intentionally empty because most meaningful seed data in this app depends on `auth.users` identities and later storage wiring.
- Once local auth fixtures and Phase 8+ flows exist, seed files can add deterministic springs, reports, media metadata, and moderation records in lexicographic order.

Planned later split:

1. auth fixture bootstrap handled through local Supabase auth tooling or dedicated setup scripts
2. baseline admin/trusted contributor role assignments
3. sample published springs
4. sample reports and media metadata
5. optional demo moderation/audit data for local review flows
