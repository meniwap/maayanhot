# API Contract

## Purpose

This file defines the boundary between shared contracts, pure domain logic, and the Phase 4/Phase 5 database foundation.

Non-negotiable rule:

- `spring_reports` plus moderation state remain the source of truth
- any current-status cache is derived only
- UI and domain packages must not be rewritten around concrete Supabase table access

## Package And Infrastructure Ownership

- `packages/contracts`
  - shared serializable IDs, unions, records, commands, and queries
- `packages/domain`
  - pure entities, repository ports, and business rules
- `supabase/`
  - infrastructure implementation boundary for local project config, schema migrations, seeds, and database tests

Phase 4 and Phase 5 keep the infrastructure swappable by making the database match the contract/domain model, not the other way around.

Phase 6 adds:

- `packages/map-core`
  - provider-neutral map surface contract plus the first concrete internal provider implementation
  - app consumers still depend on the `@maayanhot/map-core` surface, not on provider SDK imports

Phase 7 adds:

- `packages/navigation-core`
  - provider-neutral navigation-handoff contract plus the first concrete internal adapter implementation
  - app consumers still depend on the `@maayanhot/navigation-core` surface, not on `expo-linking` or provider URL strings

Phase 8 adds:

- `apps/mobile/src/infrastructure/`
  - concrete mobile-side repository implementations and flow services
  - Supabase client bootstrap
  - Query provider setup
  - this layer may depend on concrete Supabase client/runtime packages
  - this layer must still satisfy `packages/domain` ports instead of bypassing them

## Local Supabase Structure

Phase 4 adds:

- `supabase/config.toml`
- `supabase/migrations/20260326190000_initial_schema.sql`
- `supabase/migrations/20260326193000_phase5_security.sql`
- `supabase/migrations/20260326210000_phase8_public_detail_and_upload.sql`
- `supabase/seed/`
- `supabase/tests/database/`

Naming rule:

- local Supabase project id in config: `maayanhot`
- intended remote Supabase project name: `maayanhot`

## Database Model Mapping

### Identity And Profile

Source identity:

- `auth.users`

Application profile table:

- `public.user_profiles`

Stored fields:

- `display_name`
- `avatar_url`
- `created_at`
- `last_active_at`
- `approved_report_count`
- `rejected_report_count`
- `pending_report_count`
- `trust_score`

Important rule:

- report counters and `trust_score` are cached projection fields, not the source of truth

### Roles

Historical assignment table:

- `public.user_role_assignments`

Role model rules:

- default signup role is `user`
- active roles are rows where `revoked_at is null`
- role history is retained instead of overwriting a single mutable role field

Read-model view:

- `public.user_profile_role_summary`

This view exposes:

- `primary_role`
- `role_set`

That read model exists specifically to match the Phase 3 `UserProfileRecord` contract cleanly.

Phase 5 security rule:

- `user_profile_role_summary` is now a `security_invoker` view
- authenticated users can read their own role/profile summary
- moderators and admins can read broader role/profile data through underlying RLS
- direct role-assignment writes remain RPC-only

### Springs

Canonical spring table:

- `public.springs`

Stored fields align to the contract:

- `slug`
- `title`
- `alternate_names`
- `location`
- `location_precision_meters`
- `region_code`
- `access_notes`
- `description`
- `created_by_user_id`
- `created_at`
- `updated_at`
- `is_published`

Geospatial rule:

- canonical spring location is stored as `extensions.geography(point, 4326)`

### Reports

Source-of-truth evidence table:

- `public.spring_reports`

Stored fields align to the contract:

- `spring_id`
- `reporter_user_id`
- `observed_at`
- `submitted_at`
- `water_presence`
- `note`
- `location_evidence`
- `location_evidence_precision_meters`
- `moderation_status`
- `reporter_role_snapshot`
- `latest_moderated_at`

Critical rule:

- there is no `has_water` column anywhere in the source-of-truth model

### Report Media

Media metadata table:

- `public.report_media`

Stored fields align to the contract and upload abstraction:

- `spring_id`
- `report_id`
- `storage_bucket`
- `storage_path`
- `public_url`
- `width`
- `height`
- `byte_size`
- `media_type`
- `exif_stripped`
- `upload_state`
- `created_at`
- `captured_at`
- `sort_order`

### Moderation

Immutable moderation action table:

- `public.moderation_actions`

Stored fields:

- `report_id`
- `actor_user_id`
- `decision`
- `reason_code`
- `reason_note`
- `acted_at`

Synchronization rule:

- inserting a moderation action updates the current `spring_reports.moderation_status`
- the moderation action remains the immutable audit record

### Derived Status Cache

Projection table:

- `public.spring_status_projections`

Stored fields:

- `spring_id`
- `water_presence`
- `freshness`
- `confidence`
- `latest_approved_report_at`
- `derived_from_report_ids`
- `approved_report_count_considered`
- `recalculated_at`

Critical rule:

- this table is a browse/detail cache only
- it must never become the source of truth

Phase 5 security rule:

- raw projection rows are not public
- the only anonymous/authenticated public-safe read surface is `public.public_spring_catalog`
- that view exposes derived status fields but omits internal lineage fields such as `derived_from_report_ids`

### Auditability

Audit log table:

- `public.audit_entries`

Stored fields:

- `actor_user_id`
- `entity_type`
- `entity_id`
- `action`
- `metadata`
- `created_at`

## Database Functions And Triggers

Phase 4 introduces foundation-level database helpers:

- `public.set_updated_at`
  - keeps `springs.updated_at` current
- `public.user_role_rank`
  - defines role precedence for read models
- `public.handle_new_auth_user`
  - creates `user_profiles` and a default active `user` role assignment from `auth.users`
- `public.refresh_user_report_snapshot`
  - recalculates cached report counters and `trust_score` on `user_profiles`
- `public.sync_user_report_snapshot`
  - keeps the trust snapshot projection synchronized after report writes or moderation-state changes
- `public.apply_moderation_action_state`
  - updates current report moderation state from immutable moderation actions

These helpers are infrastructure integrity mechanisms, not replacements for domain rules.

Phase 5 adds security-layer helpers and RPCs:

- `private.current_user_has_role`
  - checks active roles from `user_role_assignments`, not JWT role claims
- `private.current_primary_role`
  - derives the current highest-precedence active role for trusted internal use
- `private.is_published_spring`
  - enforces published-only report creation for end users
- `private.owns_report`
  - enforces self-scoped report/media access
- `private.report_matches_spring`
  - prevents cross-linked media metadata writes
- `private.owns_report_storage_path`
  - enforces the storage path convention for report media
- `public.admin_grant_user_role`
  - admin-only RPC for creating historical role assignments
- `public.admin_revoke_user_role`
  - admin-only RPC for revoking active role assignments without deleting history
- `private.normalize_spring_report_insert`
  - normalizes `reporter_user_id`, `reporter_role_snapshot`, and moderation defaults before insert
- `private.audit_moderation_action`
  - writes audit entries for moderation inserts

## Index Strategy

Phase 4 adds indexes for the main read and moderation paths:

- `springs_location_gix`
  - geospatial browse/filter queries
- `springs_published_updated_idx`
  - published spring listing freshness
- `spring_reports_spring_observed_idx`
  - per-spring report history reads
- `spring_reports_public_projection_idx`
  - public status derivation reads over approved/pending state and observation time
- `spring_reports_pending_queue_idx`
  - moderation queue reads
- `spring_reports_location_evidence_gix`
  - future geospatial validation and report evidence queries
- `report_media_report_id_sort_order_idx`
  - ordered media retrieval
- `moderation_actions_report_id_acted_idx`
  - report moderation history
- `audit_entries_entity_idx`
  - audit trail lookup
- `user_role_assignments_active_user_role_idx`
  - active role uniqueness

## Public And Raw Read Surfaces

Phase 5 explicitly splits public-safe reads from raw/internal reads.

Public-safe browse view:

- `public.public_spring_catalog`

Exposed fields:

- `id`
- `slug`
- `title`
- canonical coordinates:
  - `latitude`
  - `longitude`
- region/access/description fields:
  - `region_label`
  - `access_notes`
  - `description`
- `updated_at`
- optional public browse media:
  - `cover_image_url`
- derived public status fields:
  - `water_presence`
  - `freshness`
  - `confidence`
  - `latest_approved_report_at`

Omitted fields:

- `created_by_user_id`
- raw moderation state internals
- audit data
- `derived_from_report_ids`
- `approved_report_count_considered`

Phase 6 mobile browse rule:

- the mobile map browse shell currently uses a local fixture that mirrors the `public.public_spring_catalog` shape
- this keeps Phase 6 inside the map/UI scope without adding a repository or Supabase client implementation early
- once repository-backed browse data is introduced later, it must still target this public-safe read surface rather than raw report tables

Phase 7 public-safe detail rule:

- the mobile spring-detail read flow currently uses a local fixture that mirrors the intended public-safe detail read model
- the detail read model is narrower than raw table access and must include only:
  - canonical spring identity and location fields
  - derived public projection fields:
    - `water_presence`
    - `freshness`
    - `confidence`
    - `latest_approved_report_at`
  - approved/public-safe gallery items only
  - approved/public-safe history summary rows only:
    - `report_id`
    - `observed_at`
    - `water_presence`
    - `photo_count`
- the detail read model must omit:
  - reporter identity
  - reviewer identity
  - trust labels or trust calculations
  - moderation states or reason notes
  - audit metadata
  - internal projection lineage such as `derived_from_report_ids`
  - write-capability flags
- when repository-backed detail reads are introduced later, they must preserve this public-safe shape rather than widening raw table exposure

Phase 8 repository-backed read rule:

- the mobile app now reads map browse and spring detail through app-local repositories that target these explicit public-safe surfaces
- screens still must not call Supabase directly
- future infrastructure extraction is allowed, but the public-safe shapes above remain the contract

Phase 8 public-safe detail surfaces:

- `public.public_spring_detail`
- `public.public_spring_detail_media`
- `public.public_spring_detail_history`

These surfaces expose only:

- published spring identity and public summary fields
- derived projection fields
- approved/public-safe media with explicit `public_url`
- approved/public-safe history summary rows

They still omit:

- raw notes beyond the bounded summary
- moderation status and reviewer/staff metadata
- trust/audit fields
- projection lineage internals

Raw/internal tables remain protected by direct table grants plus RLS:

- `springs`
- `spring_status_projections`
- `spring_reports`
- `report_media`
- `moderation_actions`
- `audit_entries`
- `user_profiles`
- `user_role_assignments`

## Policy Boundary Summary

### Anonymous

- may read `public.public_spring_catalog`
- may not read raw public tables
- may not write reports, media, moderation, roles, or audit data
- may not access `storage.objects` for `report-media`

### Authenticated user and trusted contributor

- effective permissions are the same in Phase 5
- may read own profile and role summary
- may read own reports and own report media metadata
- may insert reports only for published springs
- inserted reports are normalized to pending moderation
- may insert report-media metadata only for their own reports
- may read their own moderation outcomes
- may access storage objects only for their own `report-media` path convention
- may not create springs
- may not moderate reports
- may not write audit entries
- may not manage roles

### Moderator

- may read raw springs, projections, reports, report media, role/profile data, moderation actions, and audit entries
- may insert moderation actions
- may not create/update/delete springs
- may not manage roles
- may not delete storage objects

### Admin

- may do everything moderators can do
- may create/update/delete springs
- may grant and revoke roles through admin RPCs
- may delete `report-media` storage objects

## Phase 6 Map Browse Consumer Boundary

Map-browse consumers may use:

- spring identity and public display fields
- canonical coordinates
- public-safe derived status fields from `public.public_spring_catalog`

Map-browse consumers may not use:

- raw `spring_reports`
- raw `moderation_actions`
- raw `audit_entries`
- `spring_status_projections.derived_from_report_ids`
- raw storage metadata beyond any explicit public-safe read model

## Phase 7 Spring Detail Consumer Boundary

Spring-detail consumers may use:

- canonical spring title, alternate names, region/location label, description, and access notes
- canonical coordinates for external navigation handoff
- derived public status fields from the approved projection read model
- approved/public-safe gallery items
- approved/public-safe history summary rows

Spring-detail consumers may not use:

- raw `spring_reports`
- raw `moderation_actions`
- raw `audit_entries`
- reporter identities
- trust labels or trust snapshots
- raw `report_media` rows outside an explicit public-safe gallery read model
- internal projection lineage fields

## Storage Policy Foundation

Phase 5 adds the minimum storage policy baseline required for the security model.

Bucket:

- `report-media`
- private, not public

Path convention:

- `<auth.uid()>/<report_id>/<filename>`

Rules:

- only authenticated users may insert their own report-media objects
- insert path must begin with the current user id
- insert path must contain a report id owned by the current user
- moderators and admins may read all `report-media` objects
- admins may delete `report-media` objects
- public/anonymous storage access remains denied

## Phase 8 Write Surfaces

Admin spring creation RPC:

- `public.admin_create_spring(...)`
- admin-only
- inserts canonical spring rows
- defaults to `draft` unless explicitly published
- does not expose direct table writes to screens

Report-media slot RPCs:

- `public.create_report_media_slot(...)`
  - reserves a `report_media` row and storage path for the current report owner
- `public.finalize_report_media_upload(...)`
  - finalizes width/height/byte-size metadata and marks the reserved slot uploaded

Write-flow rule:

- report submission creates a pending report first
- media slots are reserved after report creation
- upload-core uploads binaries against those reserved slots
- metadata finalization happens after the binary upload succeeds
- none of these actions make the report public automatically

## Phase 8 Mobile Application Boundary

Concrete app-local repositories now exist for:

- public browse/detail reads
- admin spring creation
- report submission
- report-media slot reservation/finalization
- user role/profile summary reads for dev sessions

These repositories are allowed only inside the mobile infrastructure layer in Phase 8.

They must not:

- be imported by presentational components
- bypass `packages/domain` port contracts
- widen raw table exposure beyond the approved read surfaces

## Development Session Bootstrap

Tracked env template:

- `apps/mobile/.env.example`

Tracked public env names:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_DEV_SESSION_ENABLED`
- `EXPO_PUBLIC_DEV_ADMIN_EMAIL`
- `EXPO_PUBLIC_DEV_ADMIN_PASSWORD`
- `EXPO_PUBLIC_DEV_USER_EMAIL`
- `EXPO_PUBLIC_DEV_USER_PASSWORD`

One-time demo-admin bootstrap requirement:

- create the demo auth users first in the linked Supabase project
- then promote the chosen demo admin user once with SQL in the Supabase SQL editor

Bootstrap SQL shape:

```sql
insert into public.user_role_assignments (
  user_id,
  role,
  granted_by_user_id,
  grant_source,
  note
)
values (
  '<demo-admin-user-id>'::uuid,
  'admin'::public.user_role,
  '<demo-admin-user-id>'::uuid,
  'phase8_bootstrap',
  'Initial demo admin bootstrap'
);
```

This bootstrap is intentionally manual because the admin RPCs require an existing admin role to execute.

## Seed Strategy

Configured seed path:

- `./seed/001_base_reference.sql`

Current strategy:

- the initial seed file is intentionally empty
- migrations alone must reproduce the schema
- later seed data should be deterministic and ordered
- auth-backed sample data will wait until local auth fixtures are established

## Remote Project Status

- the real remote Supabase project already exists under the exact required name `maayanhot`
- the local repo is linked to project ref `xcjjvundvdpkxnkkkplp`
- `npx supabase db push --linked` succeeded in Phase 8, so the linked project now includes the committed Phase 5 and Phase 8 migrations

## Boundary Reminder

UI and feature code must still go through repository/application layers.

Phase 5 still does not authorize:

- direct screen-level Supabase access
- provider-specific upload logic beyond the storage policy foundation
- moderation UI flows

Phase 8 still does not authorize:

- direct screen-level Supabase access
- raw report browsing in the public mobile read flow
- moderation UI or approve/reject actions
- write-path shortcuts that bypass repositories, flow services, or upload-core
- direct provider URL construction or `expo-linking` calls from screens
