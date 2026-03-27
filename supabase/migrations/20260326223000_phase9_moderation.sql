begin;

create or replace view public.staff_moderation_queue
as
select
  report.id as report_id,
  spring.id as spring_id,
  spring.slug as spring_slug,
  spring.title as spring_title,
  spring.region_code,
  report.observed_at,
  report.submitted_at,
  report.water_presence,
  report.note,
  report.reporter_role_snapshot,
  count(media.id) filter (
    where media.upload_state = 'uploaded'::public.upload_lifecycle_state
  )::integer as photo_count
from public.spring_reports as report
join public.springs as spring
  on spring.id = report.spring_id
left join public.report_media as media
  on media.report_id = report.id
where report.moderation_status = 'pending'::public.report_moderation_status
group by
  report.id,
  spring.id,
  spring.slug,
  spring.title,
  spring.region_code,
  report.observed_at,
  report.submitted_at,
  report.water_presence,
  report.note,
  report.reporter_role_snapshot;

alter view public.staff_moderation_queue
  set (security_invoker = true);

comment on view public.staff_moderation_queue is
  'Staff-only pending moderation queue surface. Exposes only the minimum review context for moderators and admins.';

create or replace view public.staff_moderation_report_detail
as
select
  report.id as report_id,
  spring.id as spring_id,
  spring.slug as spring_slug,
  spring.title as spring_title,
  spring.region_code,
  spring.access_notes,
  spring.description,
  report.observed_at,
  report.submitted_at,
  report.water_presence,
  report.note,
  report.reporter_role_snapshot,
  count(media.id) filter (
    where media.upload_state = 'uploaded'::public.upload_lifecycle_state
  )::integer as photo_count
from public.spring_reports as report
join public.springs as spring
  on spring.id = report.spring_id
left join public.report_media as media
  on media.report_id = report.id
where report.moderation_status = 'pending'::public.report_moderation_status
group by
  report.id,
  spring.id,
  spring.slug,
  spring.title,
  spring.region_code,
  spring.access_notes,
  spring.description,
  report.observed_at,
  report.submitted_at,
  report.water_presence,
  report.note,
  report.reporter_role_snapshot;

alter view public.staff_moderation_report_detail
  set (security_invoker = true);

comment on view public.staff_moderation_report_detail is
  'Staff-only moderation review surface. Includes private review context without exposing audit rows directly.';

create or replace view public.staff_moderation_report_media
as
select
  media.id,
  media.spring_id,
  media.report_id,
  media.storage_bucket,
  media.storage_path,
  media.media_type,
  media.width,
  media.height,
  media.byte_size,
  media.captured_at,
  media.created_at,
  media.sort_order,
  media.upload_state
from public.report_media as media
join public.spring_reports as report
  on report.id = media.report_id
join public.springs as spring
  on spring.id = media.spring_id
where media.upload_state = 'uploaded'::public.upload_lifecycle_state
  and report.moderation_status = 'pending'::public.report_moderation_status;

alter view public.staff_moderation_report_media
  set (security_invoker = true);

comment on view public.staff_moderation_report_media is
  'Staff-only uploaded report media surface for generating private signed previews during moderation review.';

create or replace function public.moderate_report(
  target_report_id uuid,
  decision public.moderation_decision,
  reason_code text default null,
  reason_note text default null
)
returns public.moderation_actions
language plpgsql
security definer
set search_path = public, private, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  target_report public.spring_reports;
  inserted_action public.moderation_actions;
  trimmed_reason_code text := nullif(trim(reason_code), '');
  trimmed_reason_note text := nullif(trim(reason_note), '');
begin
  if actor_id is null
    or not private.current_user_has_role(array['moderator'::public.user_role, 'admin'::public.user_role]) then
    raise exception 'moderator or admin role required'
      using errcode = '42501';
  end if;

  select *
  into target_report
  from public.spring_reports as report
  where report.id = target_report_id
    and report.moderation_status = 'pending'::public.report_moderation_status;

  if target_report is null then
    raise exception 'pending report not found'
      using errcode = 'P0002';
  end if;

  if decision = 'reject'::public.moderation_decision and trimmed_reason_code is null then
    raise exception 'rejection reason code required'
      using errcode = '23514';
  end if;

  if decision = 'approve'::public.moderation_decision and trimmed_reason_code is not null then
    raise exception 'approve decisions may not include a rejection reason code'
      using errcode = '23514';
  end if;

  insert into public.moderation_actions (
    report_id,
    actor_user_id,
    decision,
    reason_code,
    reason_note
  )
  values (
    target_report_id,
    actor_id,
    decision,
    trimmed_reason_code,
    trimmed_reason_note
  )
  returning * into inserted_action;

  return inserted_action;
end;
$$;

comment on function public.moderate_report(uuid, public.moderation_decision, text, text) is
  'Staff-only moderation write surface. Inserts immutable moderation actions and relies on existing triggers for report-state and audit updates.';

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
  returning * into upserted_row;

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
  'Staff-only projection cache write surface. Keeps spring_status_projections as a derived cache rather than primary truth.';

revoke all on public.staff_moderation_queue from anon, authenticated;
revoke all on public.staff_moderation_report_detail from anon, authenticated;
revoke all on public.staff_moderation_report_media from anon, authenticated;
grant select on public.staff_moderation_queue to authenticated;
grant select on public.staff_moderation_report_detail to authenticated;
grant select on public.staff_moderation_report_media to authenticated;

revoke insert on public.moderation_actions from authenticated;
drop policy if exists moderation_actions_insert_staff_only on public.moderation_actions;

revoke all on function public.moderate_report(uuid, public.moderation_decision, text, text) from public;
revoke all on function public.staff_upsert_spring_status_projection(
  uuid,
  public.water_presence,
  public.projection_freshness,
  public.projection_confidence,
  timestamptz,
  uuid[],
  integer,
  timestamptz
) from public;

grant execute on function public.moderate_report(uuid, public.moderation_decision, text, text) to authenticated;
grant execute on function public.staff_upsert_spring_status_projection(
  uuid,
  public.water_presence,
  public.projection_freshness,
  public.projection_confidence,
  timestamptz,
  uuid[],
  integer,
  timestamptz
) to authenticated;

commit;
