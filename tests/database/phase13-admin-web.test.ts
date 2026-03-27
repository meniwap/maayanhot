import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();
const migrationPath = join(
  projectRoot,
  'supabase',
  'migrations',
  '20260327183000_phase13_admin_web.sql',
);
const pgTapPath = join(projectRoot, 'supabase', 'tests', 'database', 'phase13_admin_web.test.sql');

describe('phase 13 admin web migration', () => {
  const migration = readFileSync(migrationPath, 'utf8');
  const pgTap = readFileSync(pgTapPath, 'utf8');

  it('adds admin-only spring management views and the admin update rpc', () => {
    expect(migration).toContain('create or replace view public.admin_spring_management_catalog');
    expect(migration).toContain('create or replace view public.admin_spring_management_detail');
    expect(migration).toContain('create or replace function public.admin_update_spring(');
  });

  it('keeps the surfaces admin-only and audit-linked', () => {
    expect(migration).toContain(
      "where private.current_user_has_role(array['admin'::public.user_role])",
    );
    expect(migration).toContain("'spring.updated'");
    expect(migration).toContain('perform private.append_audit_entry(');
    expect(migration).not.toContain(
      'grant select on public.admin_spring_management_catalog to anon',
    );
  });

  it('commits pgTAP checks for the admin spring management surface', () => {
    expect(pgTap).toContain('admin_spring_management_catalog view should exist');
    expect(pgTap).toContain('admin_update_spring RPC should exist');
    expect(pgTap).toContain('append_audit_entry helper should still exist');
  });
});
