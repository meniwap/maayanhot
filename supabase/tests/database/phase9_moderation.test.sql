begin;

select plan(13);

select ok(
  exists (
    select 1
    from pg_views
    where schemaname = 'public'
      and viewname = 'staff_moderation_queue'
  ),
  'staff_moderation_queue view should exist'
);

select ok(
  exists (
    select 1
    from pg_views
    where schemaname = 'public'
      and viewname = 'staff_moderation_report_detail'
  ),
  'staff_moderation_report_detail view should exist'
);

select ok(
  exists (
    select 1
    from pg_views
    where schemaname = 'public'
      and viewname = 'staff_moderation_report_media'
  ),
  'staff_moderation_report_media view should exist'
);

select ok(
  exists (
    select 1
    from pg_proc
    where proname = 'moderate_report'
  ),
  'moderate_report RPC should exist'
);

select ok(
  exists (
    select 1
    from pg_proc
    where proname = 'staff_upsert_spring_status_projection'
  ),
  'staff_upsert_spring_status_projection RPC should exist'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'moderation_actions_apply_state'
  ),
  'moderation_actions_apply_state trigger should still exist for state transitions'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'moderation_actions_audit_entry'
  ),
  'moderation_actions_audit_entry trigger should still exist for audit linkage'
);

select ok(
  exists (
    select 1
    from information_schema.role_routine_grants
    where grantee = 'authenticated'
      and routine_schema = 'public'
      and routine_name = 'moderate_report'
      and privilege_type = 'EXECUTE'
  ),
  'moderate_report should grant authenticated execute access'
);

select ok(
  exists (
    select 1
    from information_schema.role_routine_grants
    where grantee = 'authenticated'
      and routine_schema = 'public'
      and routine_name = 'staff_upsert_spring_status_projection'
      and privilege_type = 'EXECUTE'
  ),
  'staff_upsert_spring_status_projection should grant authenticated execute access'
);

select ok(
  not exists (
    select 1
    from information_schema.role_table_grants
    where grantee = 'anon'
      and table_schema = 'public'
      and table_name in (
        'staff_moderation_queue',
        'staff_moderation_report_detail',
        'staff_moderation_report_media'
      )
      and privilege_type = 'SELECT'
  ),
  'anon should not have access to staff moderation views'
);

select ok(
  not exists (
    select 1
    from information_schema.role_table_grants
    where grantee = 'authenticated'
      and table_schema = 'public'
      and table_name = 'moderation_actions'
      and privilege_type = 'INSERT'
  ),
  'authenticated should not have direct insert access to moderation_actions after Phase 9'
);

select ok(
  exists (
    select 1
    from pg_views
    where schemaname = 'public'
      and viewname = 'public_spring_detail_history'
      and lower(definition) like '%report.moderation_status = ''approved''::report_moderation_status%'
  ),
  'public_spring_detail_history should remain limited to approved reports only'
);

select ok(
  exists (
    select 1
    from pg_views
    where schemaname = 'public'
      and viewname = 'staff_moderation_queue'
      and lower(definition) like '%report.moderation_status = ''pending''::report_moderation_status%'
  ),
  'staff_moderation_queue should surface pending reports only'
);

select * from finish();

rollback;
