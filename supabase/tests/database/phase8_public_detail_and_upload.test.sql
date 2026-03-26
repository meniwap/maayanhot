begin;

select plan(8);

select ok(
  exists (
    select 1
    from pg_views
    where schemaname = 'public'
      and viewname = 'public_spring_detail'
  ),
  'public_spring_detail view should exist'
);

select ok(
  exists (
    select 1
    from pg_views
    where schemaname = 'public'
      and viewname = 'public_spring_detail_media'
  ),
  'public_spring_detail_media view should exist'
);

select ok(
  exists (
    select 1
    from pg_views
    where schemaname = 'public'
      and viewname = 'public_spring_detail_history'
  ),
  'public_spring_detail_history view should exist'
);

select ok(
  exists (
    select 1
    from pg_proc
    where proname = 'admin_create_spring'
  ),
  'admin_create_spring RPC should exist'
);

select ok(
  exists (
    select 1
    from pg_proc
    where proname = 'create_report_media_slot'
  ),
  'create_report_media_slot RPC should exist'
);

select ok(
  exists (
    select 1
    from pg_proc
    where proname = 'finalize_report_media_upload'
  ),
  'finalize_report_media_upload RPC should exist'
);

select ok(
  exists (
    select 1
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'public_spring_detail'
      and privilege_type = 'SELECT'
      and grantee = 'anon'
  ),
  'public_spring_detail should grant anon read access'
);

select ok(
  exists (
    select 1
    from information_schema.role_routine_grants
    where routine_schema = 'public'
      and routine_name = 'create_report_media_slot'
      and privilege_type = 'EXECUTE'
      and grantee = 'authenticated'
  ),
  'create_report_media_slot should grant authenticated execute access'
);

select * from finish();

rollback;
