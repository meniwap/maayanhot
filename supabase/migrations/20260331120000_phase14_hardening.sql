begin;

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
  normalized_note text := nullif(btrim(coalesce(target_note, '')), '');
begin
  if actor_id is null then
    raise exception 'authenticated session required'
      using errcode = '42501';
  end if;

  if normalized_note is not null and character_length(normalized_note) > 2000 then
    raise exception 'report note exceeds max length'
      using errcode = '22001';
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
    normalized_note,
    target_client_submission_id
  )
  returning *
  into inserted_row;

  return inserted_row;
end;
$$;

comment on function public.submit_spring_report(uuid, timestamptz, public.water_presence, text, uuid) is
  'Authenticated idempotent report submission RPC hardened in Phase 14 with note normalization and max-length enforcement.';

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
  current_attachment_count integer;
  inserted_row public.report_media;
  next_sort_order integer;
  reserved_media_id uuid := extensions.gen_random_uuid();
  target_spring_id uuid;
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

  select count(*)
  into current_attachment_count
  from public.report_media as media
  where media.report_id = target_report_id;

  if current_attachment_count >= 8 then
    raise exception 'too many attachments reserved for report'
      using errcode = '22023';
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
  'Authenticated idempotent media-slot reservation RPC hardened in Phase 14 with a max-8 attachment boundary.';

revoke all on function public.submit_spring_report(uuid, timestamptz, public.water_presence, text, uuid) from public;
revoke all on function public.reserve_report_media_slot(uuid, text, text, timestamptz) from public;
grant execute on function public.submit_spring_report(uuid, timestamptz, public.water_presence, text, uuid) to authenticated;
grant execute on function public.reserve_report_media_slot(uuid, text, text, timestamptz) to authenticated;

commit;
