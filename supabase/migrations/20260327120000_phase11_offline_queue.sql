begin;

alter table public.spring_reports
  add column if not exists client_submission_id uuid;

comment on column public.spring_reports.client_submission_id is
  'Optional client-generated idempotency key for safe replay of queued report submissions.';

create unique index if not exists spring_reports_reporter_client_submission_uidx
  on public.spring_reports (reporter_user_id, client_submission_id)
  where client_submission_id is not null;

alter table public.report_media
  add column if not exists client_media_draft_id text;

comment on column public.report_media.client_media_draft_id is
  'Client-side attachment draft identifier for idempotent media slot replay.';

create unique index if not exists report_media_report_id_client_media_draft_uidx
  on public.report_media (report_id, client_media_draft_id)
  where client_media_draft_id is not null;

create or replace function public.submit_spring_report(
  target_spring_id uuid,
  target_observed_at timestamptz,
  target_water_presence public.water_presence,
  target_note text default null,
  target_client_submission_id uuid default null
)
returns public.spring_reports
language plpgsql
security definer
set search_path = public, private, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  inserted_row public.spring_reports;
begin
  if actor_id is null then
    raise exception 'authenticated session required'
      using errcode = '42501';
  end if;

  if target_client_submission_id is not null then
    select report.*
    into inserted_row
    from public.spring_reports as report
    where report.reporter_user_id = actor_id
      and report.client_submission_id = target_client_submission_id
    order by report.submitted_at desc
    limit 1;

    if inserted_row is not null then
      return inserted_row;
    end if;
  end if;

  if not private.is_published_spring(target_spring_id) then
    raise exception 'spring is not published'
      using errcode = '42501';
  end if;

  insert into public.spring_reports (
    spring_id,
    observed_at,
    water_presence,
    note,
    client_submission_id
  )
  values (
    target_spring_id,
    target_observed_at,
    target_water_presence,
    target_note,
    target_client_submission_id
  )
  returning *
  into inserted_row;

  return inserted_row;
end;
$$;

comment on function public.submit_spring_report(uuid, timestamptz, public.water_presence, text, uuid) is
  'Authenticated idempotent report submission RPC for Phase 11 offline-lite replay.';

create or replace function public.reserve_report_media_slot(
  target_report_id uuid,
  target_client_media_draft_id text,
  file_extension text default 'jpg',
  captured_at timestamptz default null
)
returns public.report_media
language plpgsql
security definer
set search_path = public, private, auth, extensions, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  target_spring_id uuid;
  next_sort_order integer;
  reserved_media_id uuid := extensions.gen_random_uuid();
  inserted_row public.report_media;
begin
  if actor_id is null then
    raise exception 'authenticated session required'
      using errcode = '42501';
  end if;

  if target_client_media_draft_id is null or btrim(target_client_media_draft_id) = '' then
    raise exception 'client media draft id is required'
      using errcode = '23502';
  end if;

  select media.*
  into inserted_row
  from public.report_media as media
  join public.spring_reports as report
    on report.id = media.report_id
  where media.report_id = target_report_id
    and media.client_media_draft_id = target_client_media_draft_id
    and report.reporter_user_id = actor_id
  limit 1;

  if inserted_row is not null then
    return inserted_row;
  end if;

  select report.spring_id
  into target_spring_id
  from public.spring_reports as report
  where report.id = target_report_id
    and report.reporter_user_id = actor_id;

  if target_spring_id is null then
    raise exception 'report not found or not owned by current user'
      using errcode = 'P0002';
  end if;

  select coalesce(max(media.sort_order), -1) + 1
  into next_sort_order
  from public.report_media as media
  where media.report_id = target_report_id;

  insert into public.report_media (
    id,
    spring_id,
    report_id,
    storage_bucket,
    storage_path,
    media_type,
    upload_state,
    public_url,
    captured_at,
    sort_order,
    client_media_draft_id
  )
  values (
    reserved_media_id,
    target_spring_id,
    target_report_id,
    'report-media',
    actor_id::text || '/' || target_report_id::text || '/' || reserved_media_id::text || '.' ||
      private.normalize_media_file_extension(file_extension),
    'image'::public.upload_asset_kind,
    'pending'::public.upload_lifecycle_state,
    null,
    captured_at,
    next_sort_order,
    btrim(target_client_media_draft_id)
  )
  returning *
  into inserted_row;

  return inserted_row;
end;
$$;

comment on function public.reserve_report_media_slot(uuid, text, text, timestamptz) is
  'Authenticated idempotent media-slot reservation RPC for queued report attachment replay.';

revoke all on function public.submit_spring_report(uuid, timestamptz, public.water_presence, text, uuid) from public;
revoke all on function public.reserve_report_media_slot(uuid, text, text, timestamptz) from public;
grant execute on function public.submit_spring_report(uuid, timestamptz, public.water_presence, text, uuid) to authenticated;
grant execute on function public.reserve_report_media_slot(uuid, text, text, timestamptz) to authenticated;

commit;
