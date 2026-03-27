begin;

create or replace view public.admin_spring_management_catalog
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
  spring.created_at,
  spring.created_by_user_id,
  spring.updated_at,
  spring.is_published,
  coalesce(projection.water_presence, 'unknown'::public.water_presence) as water_presence,
  coalesce(projection.freshness, 'none'::public.projection_freshness) as freshness,
  coalesce(projection.confidence, 'low'::public.projection_confidence) as confidence,
  projection.latest_approved_report_at
from public.springs as spring
left join public.spring_status_projections as projection
  on projection.spring_id = spring.id
where private.current_user_has_role(array['admin'::public.user_role]);

alter view public.admin_spring_management_catalog
  set (security_invoker = true);

comment on view public.admin_spring_management_catalog is
  'Admin-only spring management list surface. Exposes only the canonical fields needed for list and edit workflows.';

create or replace view public.admin_spring_management_detail
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
  spring.created_at,
  spring.created_by_user_id,
  spring.updated_at,
  spring.is_published,
  coalesce(projection.water_presence, 'unknown'::public.water_presence) as water_presence,
  coalesce(projection.freshness, 'none'::public.projection_freshness) as freshness,
  coalesce(projection.confidence, 'low'::public.projection_confidence) as confidence,
  projection.latest_approved_report_at
from public.springs as spring
left join public.spring_status_projections as projection
  on projection.spring_id = spring.id
where private.current_user_has_role(array['admin'::public.user_role]);

alter view public.admin_spring_management_detail
  set (security_invoker = true);

comment on view public.admin_spring_management_detail is
  'Admin-only spring management detail surface. Provides the canonical editable spring fields plus the current derived projection summary.';

create or replace function public.admin_update_spring(
  target_spring_id uuid,
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
  existing_row public.springs;
  updated_row public.springs;
begin
  if actor_id is null or not private.current_user_has_role(array['admin'::public.user_role]) then
    raise exception 'admin role required'
      using errcode = '42501';
  end if;

  if input_latitude is null or input_longitude is null then
    raise exception 'latitude and longitude are required'
      using errcode = '23502';
  end if;

  select *
  into existing_row
  from public.springs as spring
  where spring.id = target_spring_id;

  if existing_row is null then
    raise exception 'spring not found'
      using errcode = 'P0002';
  end if;

  update public.springs as spring
  set
    slug = input_slug,
    title = input_title,
    alternate_names = coalesce(input_alternate_names, '{}'::text[]),
    location = extensions.st_setsrid(
      extensions.st_makepoint(input_longitude, input_latitude),
      4326
    )::extensions.geography,
    location_precision_meters = input_location_precision_meters,
    region_code = input_region_code,
    access_notes = input_access_notes,
    description = input_description,
    is_published = coalesce(input_is_published, false)
  where spring.id = target_spring_id
  returning * into updated_row;

  perform private.append_audit_entry(
    actor_id,
    'spring'::public.audited_entity_type,
    updated_row.id::text,
    'spring.updated',
    jsonb_build_object(
      'previous_slug', existing_row.slug,
      'slug', updated_row.slug,
      'previous_title', existing_row.title,
      'title', updated_row.title,
      'was_published', existing_row.is_published,
      'is_published', updated_row.is_published
    )
  );

  return updated_row;
end;
$$;

comment on function public.admin_update_spring(
  uuid,
  text,
  text,
  text[],
  double precision,
  double precision,
  integer,
  text,
  text,
  text,
  boolean
) is
  'Admin-only spring update surface. Updates canonical spring fields and writes an audit entry for the change.';

revoke all on public.admin_spring_management_catalog from anon, authenticated;
revoke all on public.admin_spring_management_detail from anon, authenticated;
grant select on public.admin_spring_management_catalog to authenticated;
grant select on public.admin_spring_management_detail to authenticated;

revoke all on function public.admin_update_spring(uuid, text, text, text[], double precision, double precision, integer, text, text, text, boolean) from public;
grant execute on function public.admin_update_spring(uuid, text, text, text[], double precision, double precision, integer, text, text, text, boolean) to authenticated;

commit;
