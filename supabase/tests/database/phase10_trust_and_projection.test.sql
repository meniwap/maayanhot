begin;

select plan(8);

select ok(
  exists (
    select 1
    from pg_proc as proc
    join pg_namespace as namespace
      on namespace.oid = proc.pronamespace
    where namespace.nspname = 'private'
      and proc.proname = 'sync_trusted_contributor_role'
  ),
  'private.sync_trusted_contributor_role function should exist'
);

select ok(
  lower((
    select pg_get_functiondef(proc.oid)
    from pg_proc as proc
    join pg_namespace as namespace
      on namespace.oid = proc.pronamespace
    where namespace.nspname = 'private'
      and proc.proname = 'sync_trusted_contributor_role'
    limit 1
  )) like '%system.phase10_trust_progression%',
  'trusted contributor sync should use an explicit system grant_source'
);

select ok(
  lower((
    select pg_get_functiondef(proc.oid)
    from pg_proc as proc
    join pg_namespace as namespace
      on namespace.oid = proc.pronamespace
    where namespace.nspname = 'public'
      and proc.proname = 'refresh_user_report_snapshot'
    limit 1
  )) like '%perform private.sync_trusted_contributor_role(target_user_id)%',
  'refresh_user_report_snapshot should trigger trusted contributor sync'
);

select ok(
  exists (
    select 1
    from pg_proc as proc
    join pg_namespace as namespace
      on namespace.oid = proc.pronamespace
    where namespace.nspname = 'public'
      and proc.proname = 'staff_upsert_spring_status_projection'
  ),
  'staff_upsert_spring_status_projection should still exist after hardening'
);

select ok(
  lower((
    select pg_get_functiondef(proc.oid)
    from pg_proc as proc
    join pg_namespace as namespace
      on namespace.oid = proc.pronamespace
    where namespace.nspname = 'public'
      and proc.proname = 'staff_upsert_spring_status_projection'
    limit 1
  )) like '%where public.spring_status_projections.recalculated_at <= excluded.recalculated_at%',
  'projection upsert should reject stale recalculations'
);

select ok(
  lower((
    select pg_get_functiondef(proc.oid)
    from pg_proc as proc
    join pg_namespace as namespace
      on namespace.oid = proc.pronamespace
    where namespace.nspname = 'public'
      and proc.proname = 'staff_upsert_spring_status_projection'
    limit 1
  )) like '%if upserted_row is null then%',
  'projection upsert should return the existing cached row after a stale write attempt'
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
  'authenticated should retain execute access to the staff projection RPC'
);

select ok(
  not exists (
    select 1
    from information_schema.role_table_grants
    where grantee = 'authenticated'
      and table_schema = 'public'
      and table_name = 'user_role_assignments'
      and privilege_type in ('INSERT', 'UPDATE', 'DELETE')
  ),
  'Phase 10 should not weaken direct user_role_assignments table write boundaries'
);

select * from finish();

rollback;
