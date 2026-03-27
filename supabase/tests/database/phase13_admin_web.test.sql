begin;

select plan(8);

select ok(
  exists (
    select 1
    from pg_views
    where schemaname = 'public'
      and viewname = 'admin_spring_management_catalog'
  ),
  'admin_spring_management_catalog view should exist'
);

select ok(
  exists (
    select 1
    from pg_views
    where schemaname = 'public'
      and viewname = 'admin_spring_management_detail'
  ),
  'admin_spring_management_detail view should exist'
);

select ok(
  exists (
    select 1
    from pg_proc
    where proname = 'admin_update_spring'
  ),
  'admin_update_spring RPC should exist'
);

select ok(
  exists (
    select 1
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'admin_spring_management_catalog'
      and privilege_type = 'SELECT'
      and grantee = 'authenticated'
  ),
  'admin_spring_management_catalog should grant authenticated select'
);

select ok(
  exists (
    select 1
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'admin_spring_management_catalog'
      and privilege_type = 'SELECT'
      and grantee = 'anon'
  ) is false,
  'admin_spring_management_catalog should not grant anon select'
);

select ok(
  exists (
    select 1
    from information_schema.role_routine_grants
    where routine_schema = 'public'
      and routine_name = 'admin_update_spring'
      and privilege_type = 'EXECUTE'
      and grantee = 'authenticated'
  ),
  'admin_update_spring should grant authenticated execute access'
);

select ok(
  exists (
    select 1
    from pg_views
    where schemaname = 'public'
      and viewname = 'admin_spring_management_catalog'
      and definition ilike '%private.current_user_has_role%'
  ),
  'admin_spring_management_catalog should remain admin-role bounded'
);

select ok(
  exists (
    select 1
    from pg_proc
    where proname = 'append_audit_entry'
  ),
  'append_audit_entry helper should still exist for audit-linked spring updates'
);

select * from finish();

rollback;
