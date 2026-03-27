begin;

create or replace function private.sync_trusted_contributor_role(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private, auth, pg_temp
as $$
declare
  target_profile public.user_profiles;
  active_trusted_assignment public.user_role_assignments;
  has_staff_role boolean := false;
  should_have_role boolean := false;
begin
  if target_user_id is null then
    return;
  end if;

  select *
  into target_profile
  from public.user_profiles as profile
  where profile.id = target_user_id;

  if target_profile is null then
    return;
  end if;

  select exists (
    select 1
    from public.user_role_assignments as assignments
    where assignments.user_id = target_user_id
      and assignments.revoked_at is null
      and assignments.role in ('moderator'::public.user_role, 'admin'::public.user_role)
  )
  into has_staff_role;

  if has_staff_role then
    return;
  end if;

  select *
  into active_trusted_assignment
  from public.user_role_assignments as assignments
  where assignments.user_id = target_user_id
    and assignments.role = 'trusted_contributor'::public.user_role
    and assignments.revoked_at is null
  order by assignments.granted_at desc
  limit 1;

  if active_trusted_assignment is null then
    should_have_role :=
      target_profile.approved_report_count >= 5
      and coalesce(target_profile.trust_score, 0) >= 0.85
      and target_profile.pending_report_count <= 0;

    if should_have_role then
      insert into public.user_role_assignments (
        user_id,
        role,
        grant_source,
        note
      )
      values (
        target_user_id,
        'trusted_contributor'::public.user_role,
        'system.phase10_trust_progression',
        'Auto-granted after meeting approved-report and trust-score thresholds.'
      );
    end if;

    return;
  end if;

  should_have_role :=
    target_profile.approved_report_count >= 4
    and coalesce(target_profile.trust_score, 0) >= 0.72
    and target_profile.pending_report_count <= 1;

  if not should_have_role then
    update public.user_role_assignments
    set
      revoked_at = timezone('utc', now()),
      revoke_note = 'Auto-revoked after falling below trusted-contributor retention thresholds.'
    where id = active_trusted_assignment.id
      and revoked_at is null;
  end if;
end;
$$;

comment on function private.sync_trusted_contributor_role(uuid) is
  'Internal Phase 10 helper that grants or revokes the trusted_contributor role from cached approved/rejected/pending history without affecting moderator/admin roles.';

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

  perform private.sync_trusted_contributor_role(target_user_id);
end;
$$;

comment on function public.refresh_user_report_snapshot(uuid) is
  'Refreshes cached report counters and trust score, then synchronizes the bounded trusted_contributor role progression.';

create or replace function public.staff_upsert_spring_status_projection(
  target_spring_id uuid,
  input_water_presence public.water_presence,
  input_freshness public.projection_freshness,
  input_confidence public.projection_confidence,
  input_latest_approved_report_at timestamptz default null,
  input_derived_from_report_ids uuid[] default '{}'::uuid[],
  input_approved_report_count_considered integer default 0,
  input_recalculated_at timestamptz default null
)
returns public.spring_status_projections
language plpgsql
security definer
set search_path = public, private, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  upserted_row public.spring_status_projections;
begin
  if actor_id is null
    or not private.current_user_has_role(array['moderator'::public.user_role, 'admin'::public.user_role]) then
    raise exception 'moderator or admin role required'
      using errcode = '42501';
  end if;

  insert into public.spring_status_projections (
    spring_id,
    water_presence,
    freshness,
    confidence,
    latest_approved_report_at,
    derived_from_report_ids,
    approved_report_count_considered,
    recalculated_at
  )
  values (
    target_spring_id,
    input_water_presence,
    input_freshness,
    input_confidence,
    input_latest_approved_report_at,
    coalesce(input_derived_from_report_ids, '{}'::uuid[]),
    coalesce(input_approved_report_count_considered, 0),
    coalesce(input_recalculated_at, timezone('utc', now()))
  )
  on conflict (spring_id) do update
  set
    water_presence = excluded.water_presence,
    freshness = excluded.freshness,
    confidence = excluded.confidence,
    latest_approved_report_at = excluded.latest_approved_report_at,
    derived_from_report_ids = excluded.derived_from_report_ids,
    approved_report_count_considered = excluded.approved_report_count_considered,
    recalculated_at = excluded.recalculated_at
  where public.spring_status_projections.recalculated_at <= excluded.recalculated_at
  returning * into upserted_row;

  if upserted_row is null then
    select *
    into upserted_row
    from public.spring_status_projections as projection
    where projection.spring_id = target_spring_id;
  end if;

  return upserted_row;
end;
$$;

comment on function public.staff_upsert_spring_status_projection(
  uuid,
  public.water_presence,
  public.projection_freshness,
  public.projection_confidence,
  timestamptz,
  uuid[],
  integer,
  timestamptz
) is
  'Staff-only projection cache write surface. Phase 10 rejects stale recalculations so newer cached status projections are not overwritten by older recomputations.';

commit;
