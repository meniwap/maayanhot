begin;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists postgis with schema extensions;

create type public.user_role as enum (
  'user',
  'trusted_contributor',
  'moderator',
  'admin'
);

create type public.report_moderation_status as enum (
  'pending',
  'approved',
  'rejected'
);

create type public.moderation_decision as enum (
  'approve',
  'reject'
);

create type public.water_presence as enum (
  'water',
  'no_water',
  'unknown'
);

create type public.projection_freshness as enum (
  'recent',
  'stale',
  'none'
);

create type public.projection_confidence as enum (
  'low',
  'medium',
  'high'
);

create type public.upload_asset_kind as enum (
  'image'
);

create type public.upload_lifecycle_state as enum (
  'pending',
  'uploaded',
  'failed'
);

create type public.audited_entity_type as enum (
  'spring',
  'report',
  'moderation_action',
  'role_assignment'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

create or replace function public.user_role_rank(input_role public.user_role)
returns integer
language sql
immutable
as $$
  select case input_role
    when 'user' then 10
    when 'trusted_contributor' then 20
    when 'moderator' then 30
    when 'admin' then 40
  end;
$$;

create table public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  last_active_at timestamptz,
  approved_report_count integer not null default 0 check (approved_report_count >= 0),
  rejected_report_count integer not null default 0 check (rejected_report_count >= 0),
  pending_report_count integer not null default 0 check (pending_report_count >= 0),
  trust_score numeric(5, 4) check (trust_score is null or (trust_score >= 0 and trust_score <= 1))
);

comment on table public.user_profiles is
  'Application profile records keyed to auth.users. Trust counters and trust_score are derived cache fields, not source truth.';

create table public.user_role_assignments (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.user_role not null,
  granted_at timestamptz not null default timezone('utc', now()),
  granted_by_user_id uuid references auth.users (id) on delete set null,
  grant_source text not null default 'manual',
  note text,
  revoked_at timestamptz,
  revoked_by_user_id uuid references auth.users (id) on delete set null,
  revoke_note text,
  check (char_length(trim(grant_source)) > 0),
  check (
    (revoked_at is null and revoked_by_user_id is null and revoke_note is null)
    or revoked_at is not null
  )
);

create unique index user_role_assignments_active_user_role_idx
  on public.user_role_assignments (user_id, role)
  where revoked_at is null;

create index user_role_assignments_active_role_idx
  on public.user_role_assignments (role, granted_at desc)
  where revoked_at is null;

create or replace view public.user_profile_role_summary
as
with active_roles as (
  select
    assignments.user_id,
    array_agg(assignments.role order by public.user_role_rank(assignments.role) desc) as role_set
  from public.user_role_assignments as assignments
  where assignments.revoked_at is null
  group by assignments.user_id
)
select
  profiles.id,
  profiles.display_name,
  profiles.avatar_url,
  coalesce(active_roles.role_set[1], 'user'::public.user_role) as primary_role,
  coalesce(active_roles.role_set, array['user'::public.user_role]) as role_set,
  profiles.created_at,
  profiles.last_active_at,
  profiles.approved_report_count,
  profiles.rejected_report_count,
  profiles.pending_report_count,
  profiles.trust_score
from public.user_profiles as profiles
left join active_roles
  on active_roles.user_id = profiles.id;

comment on view public.user_profile_role_summary is
  'Read model that maps normalized profiles and active role assignments to the Phase 3 profile contract.';

create table public.springs (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  title text not null,
  alternate_names text[] not null default '{}',
  location extensions.geography(point, 4326) not null,
  location_precision_meters integer check (location_precision_meters is null or location_precision_meters > 0),
  region_code text,
  access_notes text,
  description text,
  created_by_user_id uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  is_published boolean not null default false,
  check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create trigger springs_set_updated_at
before update on public.springs
for each row
execute function public.set_updated_at();

create index springs_created_by_idx
  on public.springs (created_by_user_id, created_at desc);

create index springs_published_updated_idx
  on public.springs (is_published, updated_at desc);

create index springs_location_gix
  on public.springs
  using gist (location);

create table public.spring_reports (
  id uuid primary key default extensions.gen_random_uuid(),
  spring_id uuid not null references public.springs (id) on delete cascade,
  reporter_user_id uuid not null references auth.users (id) on delete restrict,
  observed_at timestamptz not null,
  submitted_at timestamptz not null default timezone('utc', now()),
  water_presence public.water_presence not null,
  note text,
  location_evidence extensions.geography(point, 4326),
  location_evidence_precision_meters integer check (
    location_evidence_precision_meters is null or location_evidence_precision_meters > 0
  ),
  moderation_status public.report_moderation_status not null default 'pending',
  reporter_role_snapshot public.user_role,
  latest_moderated_at timestamptz,
  check (location_evidence is not null or location_evidence_precision_meters is null)
);

comment on table public.spring_reports is
  'Append-only field evidence. Reports plus moderation state remain the source truth for spring status.';

create index spring_reports_spring_observed_idx
  on public.spring_reports (spring_id, observed_at desc);

create index spring_reports_public_projection_idx
  on public.spring_reports (spring_id, moderation_status, observed_at desc);

create index spring_reports_pending_queue_idx
  on public.spring_reports (moderation_status, submitted_at asc)
  where moderation_status = 'pending';

create index spring_reports_reporter_idx
  on public.spring_reports (reporter_user_id, submitted_at desc);

create index spring_reports_location_evidence_gix
  on public.spring_reports
  using gist (location_evidence)
  where location_evidence is not null;

create table public.report_media (
  id uuid primary key default extensions.gen_random_uuid(),
  spring_id uuid not null references public.springs (id) on delete cascade,
  report_id uuid not null references public.spring_reports (id) on delete cascade,
  storage_bucket text not null default 'report-media',
  storage_path text not null unique,
  public_url text,
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  byte_size bigint check (byte_size is null or byte_size > 0),
  media_type public.upload_asset_kind not null default 'image',
  exif_stripped boolean not null default false,
  upload_state public.upload_lifecycle_state not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  captured_at timestamptz,
  sort_order integer not null default 0 check (sort_order >= 0)
);

create unique index report_media_report_id_sort_order_idx
  on public.report_media (report_id, sort_order);

create index report_media_spring_id_created_idx
  on public.report_media (spring_id, created_at desc);

create index report_media_uploaded_idx
  on public.report_media (upload_state, created_at desc);

create table public.moderation_actions (
  id uuid primary key default extensions.gen_random_uuid(),
  report_id uuid not null references public.spring_reports (id) on delete cascade,
  actor_user_id uuid not null references auth.users (id) on delete restrict,
  decision public.moderation_decision not null,
  reason_code text,
  reason_note text,
  acted_at timestamptz not null default timezone('utc', now())
);

create index moderation_actions_report_id_acted_idx
  on public.moderation_actions (report_id, acted_at desc);

create index moderation_actions_actor_id_acted_idx
  on public.moderation_actions (actor_user_id, acted_at desc);

create table public.spring_status_projections (
  spring_id uuid primary key references public.springs (id) on delete cascade,
  water_presence public.water_presence not null,
  freshness public.projection_freshness not null,
  confidence public.projection_confidence not null,
  latest_approved_report_at timestamptz,
  derived_from_report_ids uuid[] not null default '{}',
  approved_report_count_considered integer not null default 0 check (approved_report_count_considered >= 0),
  recalculated_at timestamptz not null
);

comment on table public.spring_status_projections is
  'Derived cache table for browse/detail performance. It is not the source truth for current spring status.';

create index spring_status_projections_filter_idx
  on public.spring_status_projections (water_presence, freshness, latest_approved_report_at desc);

create table public.audit_entries (
  id uuid primary key default extensions.gen_random_uuid(),
  actor_user_id uuid not null references auth.users (id) on delete restrict,
  entity_type public.audited_entity_type not null,
  entity_id text not null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  check (char_length(trim(action)) > 0)
);

create index audit_entries_entity_idx
  on public.audit_entries (entity_type, entity_id, created_at desc);

create index audit_entries_actor_idx
  on public.audit_entries (actor_user_id, created_at desc);

create or replace function public.refresh_user_report_snapshot(target_user_id uuid)
returns void
language plpgsql
as $$
declare
  approved_count integer := 0;
  rejected_count integer := 0;
  pending_count integer := 0;
  computed_trust_score numeric(5, 4) := null;
  reviewed_count integer := 0;
begin
  select
    count(*) filter (where report.moderation_status = 'approved')::integer,
    count(*) filter (where report.moderation_status = 'rejected')::integer,
    count(*) filter (where report.moderation_status = 'pending')::integer
  into approved_count, rejected_count, pending_count
  from public.spring_reports as report
  where report.reporter_user_id = target_user_id;

  reviewed_count := approved_count + rejected_count;

  if reviewed_count > 0 then
    computed_trust_score := round(approved_count::numeric / reviewed_count::numeric, 4);
  end if;

  update public.user_profiles as profile
  set
    approved_report_count = approved_count,
    rejected_report_count = rejected_count,
    pending_report_count = pending_count,
    trust_score = computed_trust_score
  where profile.id = target_user_id;
end;
$$;

create or replace function public.sync_user_report_snapshot()
returns trigger
language plpgsql
as $$
begin
  perform public.refresh_user_report_snapshot(new.reporter_user_id);

  if tg_op = 'update' and old.reporter_user_id is distinct from new.reporter_user_id then
    perform public.refresh_user_report_snapshot(old.reporter_user_id);
  end if;

  return new;
end;
$$;

create or replace function public.apply_moderation_action_state()
returns trigger
language plpgsql
as $$
begin
  update public.spring_reports
  set
    moderation_status = case new.decision
      when 'approve' then 'approved'::public.report_moderation_status
      when 'reject' then 'rejected'::public.report_moderation_status
    end,
    latest_moderated_at = new.acted_at
  where id = new.report_id;

  return new;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  inferred_display_name text;
begin
  inferred_display_name := coalesce(
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'name',
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'New user'
  );

  insert into public.user_profiles (
    id,
    display_name,
    avatar_url,
    created_at,
    last_active_at
  )
  values (
    new.id,
    inferred_display_name,
    new.raw_user_meta_data ->> 'avatar_url',
    coalesce(new.created_at, timezone('utc', now())),
    new.last_sign_in_at
  )
  on conflict (id) do nothing;

  insert into public.user_role_assignments (
    user_id,
    role,
    grant_source,
    note
  )
  values (
    new.id,
    'user',
    'signup_default',
    'Default active role created from auth.users signup trigger.'
  )
  on conflict do nothing;

  return new;
end;
$$;

create trigger spring_reports_refresh_user_snapshot
after insert or update of moderation_status, reporter_user_id
on public.spring_reports
for each row
execute function public.sync_user_report_snapshot();

create trigger moderation_actions_apply_state
after insert on public.moderation_actions
for each row
execute function public.apply_moderation_action_state();

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

commit;
