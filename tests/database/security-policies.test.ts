import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();
const migrationPath = join(
  projectRoot,
  'supabase',
  'migrations',
  '20260326193000_phase5_security.sql',
);
const pgTapPath = join(projectRoot, 'supabase', 'tests', 'database', 'phase5_policies.test.sql');

describe('phase 5 security migration', () => {
  const migration = readFileSync(migrationPath, 'utf8');
  const pgTap = readFileSync(pgTapPath, 'utf8');

  it('adds the private helper layer, admin RPCs, and the public-safe catalog view', () => {
    expect(migration).toContain('create schema if not exists private;');
    expect(migration).toContain(
      'create or replace function private.current_user_has_role(required_roles public.user_role[])',
    );
    expect(migration).toContain('create or replace function public.admin_grant_user_role(');
    expect(migration).toContain('create or replace function public.admin_revoke_user_role(');
    expect(migration).toContain('create or replace view public.public_spring_catalog');
    expect(migration).toContain('alter view public.user_profile_role_summary');
    expect(migration).toContain('set (security_invoker = true);');
  });

  it('enables RLS on every protected table and encodes the public-read restrictions', () => {
    expect(migration).toContain('alter table public.user_profiles enable row level security;');
    expect(migration).toContain(
      'alter table public.user_role_assignments enable row level security;',
    );
    expect(migration).toContain('alter table public.springs enable row level security;');
    expect(migration).toContain(
      'alter table public.spring_status_projections enable row level security;',
    );
    expect(migration).toContain('alter table public.spring_reports enable row level security;');
    expect(migration).toContain('alter table public.report_media enable row level security;');
    expect(migration).toContain('alter table public.moderation_actions enable row level security;');
    expect(migration).toContain('alter table public.audit_entries enable row level security;');
    expect(migration).not.toContain('alter table storage.objects enable row level security;');
    expect(migration).toContain(
      'grant select on public.public_spring_catalog to anon, authenticated;',
    );
    expect(migration).not.toContain('grant select on public.spring_reports to anon;');
    expect(migration).not.toContain('grant select on public.report_media to anon;');
    expect(migration).not.toContain('grant select on public.moderation_actions to anon;');
    expect(migration).not.toContain('grant select on public.audit_entries to anon;');
  });

  it('locks write paths to role-checked policies and the report-media storage convention', () => {
    expect(migration).toContain('create policy springs_insert_admin_only');
    expect(migration).toContain('create policy springs_update_admin_only');
    expect(migration).toContain('create policy spring_reports_insert_own_pending_on_published');
    expect(migration).toContain('create policy report_media_insert_own_pending_metadata');
    expect(migration).toContain('create policy moderation_actions_insert_staff_only');
    expect(migration).toContain('create policy storage_objects_insert_own_report_media');
    expect(migration).toContain('create policy storage_objects_delete_admin_only');
    expect(migration).toContain("storage_bucket = 'report-media'");
    expect(migration).toContain("bucket_id = 'report-media'");
    expect(migration).toContain('(storage.foldername(name))[1] = auth.uid()::text');
    expect(migration).toContain(
      'private.owns_report_storage_path(name, (storage.foldername(name))[2]::uuid)',
    );
  });

  it('adds committed pgTAP policy coverage for the new security surface', () => {
    expect(pgTap).toContain('public_spring_catalog view should exist');
    expect(pgTap).toContain('user_profile_role_summary should use security_invoker');
    expect(pgTap).toContain('spring_reports should have an owner/staff select policy');
    expect(pgTap).toContain('storage.objects should have an owner-path insert policy');
    expect(pgTap).toContain('anon should not have raw select access to protected public tables');
  });
});
