begin;

create or replace view public.public_spring_detail
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
  projection.latest_approved_report_at,
  coalesce(projection.approved_report_count_considered, 0) as approved_history_count
from public.springs as spring
left join public.spring_status_projections as projection
  on projection.spring_id = spring.id
where spring.is_published = true;

comment on view public.public_spring_detail is
  'Public-safe detail read surface. Exposes published spring fields and derived status only.';

create or replace view public.public_spring_detail_media
as
select
  media.id,
  media.spring_id,
  media.public_url,
  media.captured_at,
  media.created_at,
  media.sort_order
from public.report_media as media
join public.spring_reports as report
  on report.id = media.report_id
join public.springs as spring
  on spring.id = media.spring_id
where spring.is_published = true
  and report.moderation_status = 'approved'::public.report_moderation_status
  and media.upload_state = 'uploaded'::public.upload_lifecycle_state
  and media.public_url is not null;

comment on view public.public_spring_detail_media is
  'Public-safe approved media surface. Only approved uploads with explicitly published URLs appear here.';

create or replace view public.public_spring_detail_history
as
select
  report.id as report_id,
  report.spring_id,
  report.observed_at,
  report.water_presence,
  count(media.id) filter (
    where media.upload_state = 'uploaded'::public.upload_lifecycle_state
      and media.public_url is not null
  )::integer as photo_count
from public.spring_reports as report
join public.springs as spring
  on spring.id = report.spring_id
left join public.report_media as media
  on media.report_id = report.id
where spring.is_published = true
  and report.moderation_status = 'approved'::public.report_moderation_status
group by
  report.id,
  report.spring_id,
  report.observed_at,
  report.water_presence;

comment on view public.public_spring_detail_history is
  'Public-safe approved report history summary. Notes, moderation state, and staff review details remain private.';

create or replace function private.normalize_media_file_extension(input_extension text)
returns text
language sql
immutable
as $$
  select case regexp_replace(lower(coalesce(input_extension, 'jpg')), '[^a-z0-9]+', '', 'g')
    when 'jpeg' then 'jpg'
    when 'jpg' then 'jpg'
    when 'png' then 'png'
    when 'webp' then 'webp'
    when 'heic' then 'heic'
    else 'jpg'
  end;
$$;

create or replace function public.admin_create_spring(
  input_slug text,
  input_title text,
  input_alternate_names text[] default '{}'::text[],
  input_latitude double precision default null,
  input_longitude double precision default null,
  input_location_precision_meters integer default null,
  input_region_code text default null,
  input_access_notes text default null,
  input_description text default null,
  input_is_published boolean default false
)
returns public.springs
language plpgsql
security definer
set search_path = public, private, auth, extensions, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  inserted_row public.springs;
begin
  if actor_id is null or not private.current_user_has_role(array['admin'::public.user_role]) then
    raise exception 'admin role required'
      using errcode = '42501';
  end if;

  if input_latitude is null or input_longitude is null then
    raise exception 'latitude and longitude are required'
      using errcode = '23502';
  end if;

  insert into public.springs (
    slug,
    title,
    alternate_names,
    location,
    location_precision_meters,
    region_code,
    access_notes,
    description,
    created_by_user_id,
    is_published
  )
  values (
    input_slug,
    input_title,
    coalesce(input_alternate_names, '{}'::text[]),
    extensions.st_setsrid(
      extensions.st_makepoint(input_longitude, input_latitude),
      4326
    )::extensions.geography,
    input_location_precision_meters,
    input_region_code,
    input_access_notes,
    input_description,
    actor_id,
    coalesce(input_is_published, false)
  )
  returning * into inserted_row;

  return inserted_row;
end;
$$;

create or replace function public.create_report_media_slot(
  target_report_id uuid,
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
    sort_order
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
    next_sort_order
  )
  returning * into inserted_row;

  return inserted_row;
end;
$$;

create or replace function public.finalize_report_media_upload(
  target_media_id uuid,
  width integer default null,
  height integer default null,
  byte_size bigint default null,
  captured_at timestamptz default null,
  exif_stripped boolean default false
)
returns public.report_media
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  updated_row public.report_media;
begin
  if actor_id is null then
    raise exception 'authenticated session required'
      using errcode = '42501';
  end if;

  update public.report_media as media
  set
    width = finalize_report_media_upload.width,
    height = finalize_report_media_upload.height,
    byte_size = finalize_report_media_upload.byte_size,
    captured_at = coalesce(finalize_report_media_upload.captured_at, media.captured_at),
    exif_stripped = finalize_report_media_upload.exif_stripped,
    upload_state = 'uploaded'::public.upload_lifecycle_state
  where media.id = target_media_id
    and exists (
      select 1
      from public.spring_reports as report
      where report.id = media.report_id
        and report.reporter_user_id = actor_id
    )
  returning * into updated_row;

  if updated_row is null then
    raise exception 'owned media slot not found'
      using errcode = 'P0002';
  end if;

  return updated_row;
end;
$$;

revoke all on public.public_spring_detail from anon, authenticated;
revoke all on public.public_spring_detail_media from anon, authenticated;
revoke all on public.public_spring_detail_history from anon, authenticated;
grant select on public.public_spring_detail to anon, authenticated;
grant select on public.public_spring_detail_media to anon, authenticated;
grant select on public.public_spring_detail_history to anon, authenticated;

revoke all on function private.normalize_media_file_extension(text) from public;
revoke all on function public.admin_create_spring(text, text, text[], double precision, double precision, integer, text, text, text, boolean) from public;
revoke all on function public.create_report_media_slot(uuid, text, timestamptz) from public;
revoke all on function public.finalize_report_media_upload(uuid, integer, integer, bigint, timestamptz, boolean) from public;
grant execute on function public.admin_create_spring(text, text, text[], double precision, double precision, integer, text, text, text, boolean) to authenticated;
grant execute on function public.create_report_media_slot(uuid, text, timestamptz) to authenticated;
grant execute on function public.finalize_report_media_upload(uuid, integer, integer, bigint, timestamptz, boolean) to authenticated;

commit;
