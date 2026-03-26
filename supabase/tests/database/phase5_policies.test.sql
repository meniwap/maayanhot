begin;

select plan(25);

select ok(
  exists (
    select 1
    from pg_class as class
    join pg_namespace as namespace
      on namespace.oid = class.relnamespace
    where namespace.nspname = 'public'
      and class.relname = 'public_spring_catalog'
      and class.relkind = 'v'
  ),
  'public_spring_catalog view should exist'
);

select ok(
  exists (
    select 1
    from pg_class as class
    join pg_namespace as namespace
      on namespace.oid = class.relnamespace
    where namespace.nspname = 'public'
      and class.relname = 'public_spring_catalog'
      and pg_get_viewdef(class.oid, true) like '%where spring.is_published = true%'
  ),
  'public_spring_catalog should expose published springs only'
);

select ok(
  exists (
    select 1
    from pg_class as class
    join pg_namespace as namespace
      on namespace.oid = class.relnamespace
    where namespace.nspname = 'public'
      and class.relname = 'user_profile_role_summary'
      and coalesce(class.reloptions, array[]::text[]) @> array['security_invoker=true']
  ),
  'user_profile_role_summary should use security_invoker'
);

select ok(
  exists (
    select 1
    from pg_proc as proc
    join pg_namespace as namespace
      on namespace.oid = proc.pronamespace
    where namespace.nspname = 'private'
      and proc.proname = 'current_user_has_role'
  ),
  'private.current_user_has_role helper should exist'
);

select ok(
  exists (
    select 1
    from pg_proc as proc
    join pg_namespace as namespace
      on namespace.oid = proc.pronamespace
    where namespace.nspname = 'public'
      and proc.proname = 'admin_grant_user_role'
  ),
  'admin_grant_user_role RPC should exist'
);

select ok(
  exists (
    select 1
    from pg_proc as proc
    join pg_namespace as namespace
      on namespace.oid = proc.pronamespace
    where namespace.nspname = 'public'
      and proc.proname = 'admin_revoke_user_role'
  ),
  'admin_revoke_user_role RPC should exist'
);

select ok(
  exists (
    select 1
    from pg_class as class
    join pg_namespace as namespace
      on namespace.oid = class.relnamespace
    where namespace.nspname = 'public'
      and class.relname = 'springs'
      and class.relrowsecurity
  ),
  'springs should have RLS enabled'
);

select ok(
  exists (
    select 1
    from pg_class as class
    join pg_namespace as namespace
      on namespace.oid = class.relnamespace
    where namespace.nspname = 'public'
      and class.relname = 'spring_reports'
      and class.relrowsecurity
  ),
  'spring_reports should have RLS enabled'
);

select ok(
  exists (
    select 1
    from pg_class as class
    join pg_namespace as namespace
      on namespace.oid = class.relnamespace
    where namespace.nspname = 'storage'
      and class.relname = 'objects'
      and class.relrowsecurity
  ),
  'storage.objects should have RLS enabled'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'springs'
      and policyname = 'springs_select_staff_only'
  ),
  'springs should have a staff-only raw select policy'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'spring_reports'
      and policyname = 'spring_reports_select_owner_or_staff'
  ),
  'spring_reports should have an owner/staff select policy'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'spring_reports'
      and policyname = 'spring_reports_insert_own_pending_on_published'
  ),
  'spring_reports should have a pending-on-published insert policy'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'report_media'
      and policyname = 'report_media_insert_own_pending_metadata'
  ),
  'report_media should have an own-report insert policy'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'moderation_actions'
      and policyname = 'moderation_actions_insert_staff_only'
  ),
  'moderation_actions should have a staff-only insert policy'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'audit_entries'
      and policyname = 'audit_entries_select_staff_only'
  ),
  'audit_entries should have a staff-only select policy'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'storage_objects_insert_own_report_media'
  ),
  'storage.objects should have an owner-path insert policy'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'storage_objects_delete_admin_only'
  ),
  'storage.objects should have an admin-only delete policy'
);

select ok(
  exists (
    select 1
    from information_schema.role_table_grants
    where grantee = 'anon'
      and table_schema = 'public'
      and table_name = 'public_spring_catalog'
      and privilege_type = 'SELECT'
  ),
  'anon should have select access to public_spring_catalog'
);

select ok(
  not exists (
    select 1
    from information_schema.role_table_grants
    where grantee = 'anon'
      and table_schema = 'public'
      and table_name in (
        'springs',
        'spring_status_projections',
        'spring_reports',
        'report_media',
        'moderation_actions',
        'audit_entries',
        'user_profiles',
        'user_role_assignments'
      )
      and privilege_type = 'SELECT'
  ),
  'anon should not have raw select access to protected public tables'
);

select ok(
  exists (
    select 1
    from information_schema.role_routine_grants
    where grantee = 'authenticated'
      and routine_schema = 'public'
      and routine_name = 'admin_grant_user_role'
      and privilege_type = 'EXECUTE'
  ),
  'authenticated should have execute access to admin_grant_user_role'
);

select ok(
  exists (
    select 1
    from information_schema.role_routine_grants
    where grantee = 'authenticated'
      and routine_schema = 'public'
      and routine_name = 'admin_revoke_user_role'
      and privilege_type = 'EXECUTE'
  ),
  'authenticated should have execute access to admin_revoke_user_role'
);

select ok(
  exists (
    select 1
    from pg_trigger as trigger
    join pg_class as class
      on class.oid = trigger.tgrelid
    join pg_namespace as namespace
      on namespace.oid = class.relnamespace
    where namespace.nspname = 'public'
      and class.relname = 'spring_reports'
      and trigger.tgname = 'spring_reports_normalize_insert'
  ),
  'spring_reports should have the normalization trigger'
);

select ok(
  exists (
    select 1
    from pg_trigger as trigger
    join pg_class as class
      on class.oid = trigger.tgrelid
    join pg_namespace as namespace
      on namespace.oid = class.relnamespace
    where namespace.nspname = 'public'
      and class.relname = 'moderation_actions'
      and trigger.tgname = 'moderation_actions_audit_entry'
  ),
  'moderation_actions should have the audit trigger'
);

select ok(
  exists (
    select 1
    from pg_views
    where schemaname = 'public'
      and viewname = 'public_spring_catalog'
      and definition not like '%derived_from_report_ids%'
      and definition not like '%approved_report_count_considered%'
      and definition not like '%created_by_user_id%'
  ),
  'public_spring_catalog should omit internal projection lineage and creator fields'
);

select ok(
  exists (
    select 1
    from pg_views
    where schemaname = 'public'
      and viewname = 'public_spring_catalog'
      and definition like '%water_presence%'
      and definition like '%freshness%'
      and definition like '%confidence%'
  ),
  'public_spring_catalog should expose derived public status fields'
);

select * from finish();

rollback;
