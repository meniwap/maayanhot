begin;

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.current_user_has_role(required_roles public.user_role[])
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.user_role_assignments as assignments
    where assignments.user_id = auth.uid()
      and assignments.revoked_at is null
      and assignments.role = any(required_roles)
  );
$$;

create or replace function private.current_primary_role()
returns public.user_role
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select coalesce(
    (
      select assignments.role
      from public.user_role_assignments as assignments
      where assignments.user_id = auth.uid()
        and assignments.revoked_at is null
      order by public.user_role_rank(assignments.role) desc
      limit 1
    ),
    'user'::public.user_role
  );
$$;

create or replace function private.is_published_spring(target_spring_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.springs as spring
    where spring.id = target_spring_id
      and spring.is_published = true
  );
$$;

create or replace function private.owns_report(target_report_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.spring_reports as report
    where report.id = target_report_id
      and report.reporter_user_id = auth.uid()
  );
$$;

create or replace function private.report_matches_spring(target_report_id uuid, target_spring_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.spring_reports as report
    where report.id = target_report_id
      and report.spring_id = target_spring_id
  );
$$;

create or replace function private.owns_report_storage_path(object_name text, target_report_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, storage, pg_temp
as $$
  with path_parts as (
    select storage.foldername(object_name) as folders
  )
  select exists (
    select 1
    from path_parts
    where cardinality(path_parts.folders) >= 2
      and path_parts.folders[1] = auth.uid()::text
      and path_parts.folders[2] = target_report_id::text
      and private.owns_report(target_report_id)
  );
$$;

create or replace function private.append_audit_entry(
  actor_user_id uuid,
  entity_type public.audited_entity_type,
  entity_id text,
  action text,
  metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inserted_audit_id uuid;
begin
  insert into public.audit_entries (
    actor_user_id,
    entity_type,
    entity_id,
    action,
    metadata
  )
  values (
    actor_user_id,
    entity_type,
    entity_id,
    action,
    coalesce(metadata, '{}'::jsonb)
  )
  returning id into inserted_audit_id;

  return inserted_audit_id;
end;
$$;

create or replace function private.normalize_spring_report_insert()
returns trigger
language plpgsql
security definer
set search_path = public, private, auth, pg_temp
as $$
begin
  new.reporter_user_id := auth.uid();
  new.reporter_role_snapshot := private.current_primary_role();
  new.moderation_status := 'pending'::public.report_moderation_status;
  new.latest_moderated_at := null;

  if new.submitted_at is null then
    new.submitted_at := timezone('utc', now());
  end if;

  return new;
end;
$$;

drop trigger if exists spring_reports_normalize_insert on public.spring_reports;

create trigger spring_reports_normalize_insert
before insert on public.spring_reports
for each row
execute function private.normalize_spring_report_insert();

create or replace function private.audit_moderation_action()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  perform private.append_audit_entry(
    new.actor_user_id,
    'moderation_action'::public.audited_entity_type,
    new.id::text,
    case new.decision
      when 'approve' then 'moderation.approved'
      when 'reject' then 'moderation.rejected'
    end,
    jsonb_build_object(
      'report_id', new.report_id,
      'decision', new.decision,
      'reason_code', new.reason_code
    )
  );

  return new;
end;
$$;

drop trigger if exists moderation_actions_audit_entry on public.moderation_actions;

create trigger moderation_actions_audit_entry
after insert on public.moderation_actions
for each row
execute function private.audit_moderation_action();

create or replace function public.admin_grant_user_role(
  target_user_id uuid,
  role public.user_role,
  grant_source text default 'manual',
  note text default null
)
returns public.user_role_assignments
language plpgsql
security definer
set search_path = public, private, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  inserted_assignment public.user_role_assignments;
begin
  if actor_id is null or not private.current_user_has_role(array['admin'::public.user_role]) then
    raise exception 'admin role required'
      using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.user_role_assignments as assignments
    where assignments.user_id = target_user_id
      and assignments.role = role
      and assignments.revoked_at is null
  ) then
    raise exception 'role assignment is already active'
      using errcode = '23505';
  end if;

  insert into public.user_role_assignments (
    user_id,
    role,
    granted_by_user_id,
    grant_source,
    note
  )
  values (
    target_user_id,
    role,
    actor_id,
    grant_source,
    note
  )
  returning * into inserted_assignment;

  perform private.append_audit_entry(
    actor_id,
    'role_assignment'::public.audited_entity_type,
    inserted_assignment.id::text,
    'role.granted',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'role', role,
      'grant_source', grant_source
    )
  );

  return inserted_assignment;
end;
$$;

create or replace function public.admin_revoke_user_role(
  assignment_id uuid,
  revoke_note text default null
)
returns public.user_role_assignments
language plpgsql
security definer
set search_path = public, private, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  updated_assignment public.user_role_assignments;
begin
  if actor_id is null or not private.current_user_has_role(array['admin'::public.user_role]) then
    raise exception 'admin role required'
      using errcode = '42501';
  end if;

  update public.user_role_assignments as assignments
  set
    revoked_at = timezone('utc', now()),
    revoked_by_user_id = actor_id,
    revoke_note = admin_revoke_user_role.revoke_note
  where assignments.id = assignment_id
    and assignments.revoked_at is null
  returning * into updated_assignment;

  if updated_assignment is null then
    raise exception 'active role assignment not found'
      using errcode = 'P0002';
  end if;

  perform private.append_audit_entry(
    actor_id,
    'role_assignment'::public.audited_entity_type,
    updated_assignment.id::text,
    'role.revoked',
    jsonb_build_object(
      'target_user_id', updated_assignment.user_id,
      'role', updated_assignment.role
    )
  );

  return updated_assignment;
end;
$$;

create or replace view public.public_spring_catalog
as
select
  spring.id,
  spring.slug,
  spring.title,
  spring.alternate_names,
  extensions.st_y(spring.location::extensions.geometry) as latitude,
  extensions.st_x(spring.location::extensions.geometry) as longitude,
  spring.location_precision_meters,
  spring.region_code,
  spring.access_notes,
  spring.description,
  spring.updated_at,
  coalesce(projection.water_presence, 'unknown'::public.water_presence) as water_presence,
  coalesce(projection.freshness, 'none'::public.projection_freshness) as freshness,
  coalesce(projection.confidence, 'low'::public.projection_confidence) as confidence,
  projection.latest_approved_report_at
from public.springs as spring
left join public.spring_status_projections as projection
  on projection.spring_id = spring.id
where spring.is_published = true;

comment on view public.public_spring_catalog is
  'Minimal public-safe browse surface. Raw reports, moderation state, and internal projection lineage remain non-public.';

alter view public.user_profile_role_summary
  set (security_invoker = true);

revoke all on public.user_profiles from anon, authenticated;
revoke all on public.user_role_assignments from anon, authenticated;
revoke all on public.user_profile_role_summary from anon, authenticated;
revoke all on public.springs from anon, authenticated;
revoke all on public.spring_status_projections from anon, authenticated;
revoke all on public.spring_reports from anon, authenticated;
revoke all on public.report_media from anon, authenticated;
revoke all on public.moderation_actions from anon, authenticated;
revoke all on public.audit_entries from anon, authenticated;
revoke all on public.public_spring_catalog from anon, authenticated;
revoke all on storage.objects from anon, authenticated;

grant select on public.user_profiles to authenticated;
grant select on public.user_role_assignments to authenticated;
grant select on public.user_profile_role_summary to authenticated;
grant select, insert, update, delete on public.springs to authenticated;
grant select on public.spring_status_projections to authenticated;
grant select, insert on public.spring_reports to authenticated;
grant select, insert on public.report_media to authenticated;
grant select, insert on public.moderation_actions to authenticated;
grant select on public.audit_entries to authenticated;
grant select on public.public_spring_catalog to anon, authenticated;
grant select, insert, delete on storage.objects to authenticated;

revoke all on function public.admin_grant_user_role(uuid, public.user_role, text, text) from public;
revoke all on function public.admin_revoke_user_role(uuid, text) from public;
revoke all on function private.current_user_has_role(public.user_role[]) from public;
revoke all on function private.current_primary_role() from public;
revoke all on function private.is_published_spring(uuid) from public;
revoke all on function private.owns_report(uuid) from public;
revoke all on function private.report_matches_spring(uuid, uuid) from public;
revoke all on function private.owns_report_storage_path(text, uuid) from public;
revoke all on function private.append_audit_entry(uuid, public.audited_entity_type, text, text, jsonb) from public;
grant execute on function public.admin_grant_user_role(uuid, public.user_role, text, text) to authenticated;
grant execute on function public.admin_revoke_user_role(uuid, text) to authenticated;

grant execute on function private.current_user_has_role(public.user_role[]) to authenticated;
grant execute on function private.is_published_spring(uuid) to authenticated;
grant execute on function private.owns_report(uuid) to authenticated;
grant execute on function private.report_matches_spring(uuid, uuid) to authenticated;
grant execute on function private.owns_report_storage_path(text, uuid) to authenticated;

alter table public.user_profiles enable row level security;
alter table public.user_role_assignments enable row level security;
alter table public.springs enable row level security;
alter table public.spring_status_projections enable row level security;
alter table public.spring_reports enable row level security;
alter table public.report_media enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.audit_entries enable row level security;
-- Hosted Supabase manages RLS on storage.objects already. The policies below assume that remains enabled.

drop policy if exists user_profiles_select_self_or_staff on public.user_profiles;
drop policy if exists user_role_assignments_select_self_or_staff on public.user_role_assignments;
drop policy if exists springs_select_staff_only on public.springs;
drop policy if exists springs_insert_admin_only on public.springs;
drop policy if exists springs_update_admin_only on public.springs;
drop policy if exists springs_delete_admin_only on public.springs;
drop policy if exists spring_status_projections_select_staff_only on public.spring_status_projections;
drop policy if exists spring_reports_select_owner_or_staff on public.spring_reports;
drop policy if exists spring_reports_insert_own_pending_on_published on public.spring_reports;
drop policy if exists report_media_select_owner_or_staff on public.report_media;
drop policy if exists report_media_insert_own_pending_metadata on public.report_media;
drop policy if exists moderation_actions_select_owner_or_staff on public.moderation_actions;
drop policy if exists moderation_actions_insert_staff_only on public.moderation_actions;
drop policy if exists audit_entries_select_staff_only on public.audit_entries;
drop policy if exists storage_objects_select_own_or_staff on storage.objects;
drop policy if exists storage_objects_insert_own_report_media on storage.objects;
drop policy if exists storage_objects_delete_admin_only on storage.objects;

create policy user_profiles_select_self_or_staff
on public.user_profiles
for select
to authenticated
using (
  id = auth.uid()
  or private.current_user_has_role(array['moderator'::public.user_role, 'admin'::public.user_role])
);

create policy user_role_assignments_select_self_or_staff
on public.user_role_assignments
for select
to authenticated
using (
  user_id = auth.uid()
  or private.current_user_has_role(array['moderator'::public.user_role, 'admin'::public.user_role])
);

create policy springs_select_staff_only
on public.springs
for select
to authenticated
using (
  private.current_user_has_role(array['moderator'::public.user_role, 'admin'::public.user_role])
);

create policy springs_insert_admin_only
on public.springs
for insert
to authenticated
with check (
  private.current_user_has_role(array['admin'::public.user_role])
);

create policy springs_update_admin_only
on public.springs
for update
to authenticated
using (
  private.current_user_has_role(array['admin'::public.user_role])
)
with check (
  private.current_user_has_role(array['admin'::public.user_role])
);

create policy springs_delete_admin_only
on public.springs
for delete
to authenticated
using (
  private.current_user_has_role(array['admin'::public.user_role])
);

create policy spring_status_projections_select_staff_only
on public.spring_status_projections
for select
to authenticated
using (
  private.current_user_has_role(array['moderator'::public.user_role, 'admin'::public.user_role])
);

create policy spring_reports_select_owner_or_staff
on public.spring_reports
for select
to authenticated
using (
  reporter_user_id = auth.uid()
  or private.current_user_has_role(array['moderator'::public.user_role, 'admin'::public.user_role])
);

create policy spring_reports_insert_own_pending_on_published
on public.spring_reports
for insert
to authenticated
with check (
  auth.uid() is not null
  and reporter_user_id = auth.uid()
  and private.is_published_spring(spring_id)
  and moderation_status = 'pending'::public.report_moderation_status
  and latest_moderated_at is null
);

create policy report_media_select_owner_or_staff
on public.report_media
for select
to authenticated
using (
  private.owns_report(report_id)
  or private.current_user_has_role(array['moderator'::public.user_role, 'admin'::public.user_role])
);

create policy report_media_insert_own_pending_metadata
on public.report_media
for insert
to authenticated
with check (
  auth.uid() is not null
  and storage_bucket = 'report-media'
  and private.owns_report(report_id)
  and private.report_matches_spring(report_id, spring_id)
  and private.owns_report_storage_path(storage_path, report_id)
  and upload_state = 'pending'::public.upload_lifecycle_state
  and public_url is null
);

create policy moderation_actions_select_owner_or_staff
on public.moderation_actions
for select
to authenticated
using (
  private.owns_report(report_id)
  or private.current_user_has_role(array['moderator'::public.user_role, 'admin'::public.user_role])
);

create policy moderation_actions_insert_staff_only
on public.moderation_actions
for insert
to authenticated
with check (
  auth.uid() is not null
  and private.current_user_has_role(array['moderator'::public.user_role, 'admin'::public.user_role])
  and actor_user_id = auth.uid()
  and exists (
    select 1
    from public.spring_reports as report
    where report.id = report_id
      and report.moderation_status = 'pending'::public.report_moderation_status
  )
);

create policy audit_entries_select_staff_only
on public.audit_entries
for select
to authenticated
using (
  private.current_user_has_role(array['moderator'::public.user_role, 'admin'::public.user_role])
);

create policy storage_objects_select_own_or_staff
on storage.objects
for select
to authenticated
using (
  bucket_id = 'report-media'
  and (
    private.current_user_has_role(array['moderator'::public.user_role, 'admin'::public.user_role])
    or case
      when cardinality(storage.foldername(name)) >= 2
        and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then private.owns_report_storage_path(name, (storage.foldername(name))[2]::uuid)
      else false
    end
  )
);

create policy storage_objects_insert_own_report_media
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'report-media'
  and auth.uid() is not null
  and cardinality(storage.foldername(name)) >= 2
  and (storage.foldername(name))[1] = auth.uid()::text
  and case
    when (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    then private.owns_report_storage_path(name, (storage.foldername(name))[2]::uuid)
    else false
  end
);

create policy storage_objects_delete_admin_only
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'report-media'
  and private.current_user_has_role(array['admin'::public.user_role])
);

commit;
