begin;

select plan(9);

select has_column(
  'public',
  'spring_reports',
  'client_submission_id',
  'spring_reports should store a client submission idempotency key'
);

select has_index(
  'public',
  'spring_reports',
  'spring_reports_reporter_client_submission_uidx',
  'spring_reports should enforce reporter-scoped client submission uniqueness'
);

select has_column(
  'public',
  'report_media',
  'client_media_draft_id',
  'report_media should store a client media draft idempotency key'
);

select has_index(
  'public',
  'report_media',
  'report_media_report_id_client_media_draft_uidx',
  'report_media should enforce per-report media draft uniqueness'
);

select ok(
  exists (
    select 1
    from pg_proc
    where proname = 'submit_spring_report'
  ),
  'submit_spring_report RPC should exist'
);

select ok(
  exists (
    select 1
    from pg_proc
    where proname = 'reserve_report_media_slot'
  ),
  'reserve_report_media_slot RPC should exist'
);

select ok(
  exists (
    select 1
    from information_schema.role_routine_grants
    where grantee = 'authenticated'
      and routine_schema = 'public'
      and routine_name = 'submit_spring_report'
      and privilege_type = 'EXECUTE'
  ),
  'submit_spring_report should grant authenticated execute access'
);

select ok(
  exists (
    select 1
    from information_schema.role_routine_grants
    where grantee = 'authenticated'
      and routine_schema = 'public'
      and routine_name = 'reserve_report_media_slot'
      and privilege_type = 'EXECUTE'
  ),
  'reserve_report_media_slot should grant authenticated execute access'
);

select ok(
  exists (
    select 1
    from pg_views
    where schemaname = 'public'
      and viewname = 'public_spring_detail_history'
      and lower(definition) like '%report.moderation_status = ''approved''::report_moderation_status%'
  ),
  'public_spring_detail_history should remain approved-only after offline queue support'
);

select * from finish();

rollback;
