import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();
const migrationPath = join(
  projectRoot,
  'supabase',
  'migrations',
  '20260327090000_phase10_trust_and_projection.sql',
);
const pgTapPath = join(
  projectRoot,
  'supabase',
  'tests',
  'database',
  'phase10_trust_and_projection.test.sql',
);

describe('phase 10 trust and projection migration', () => {
  const migration = readFileSync(migrationPath, 'utf8');
  const pgTap = readFileSync(pgTapPath, 'utf8');

  it('adds explicit trusted contributor sync rules to the report snapshot path', () => {
    expect(migration).toContain(
      'create or replace function private.sync_trusted_contributor_role(',
    );
    expect(migration).toContain('grant_source,\n        note');
    expect(migration).toContain("'system.phase10_trust_progression'");
    expect(migration).toContain('perform private.sync_trusted_contributor_role(target_user_id);');
  });

  it('hardens projection upserts against stale recalculations', () => {
    expect(migration).toContain(
      'create or replace function public.staff_upsert_spring_status_projection(',
    );
    expect(migration).toContain(
      'where public.spring_status_projections.recalculated_at <= excluded.recalculated_at',
    );
    expect(migration).toContain('if upserted_row is null then');
  });

  it('keeps trusted contributor progression bounded away from moderator or admin powers', () => {
    expect(migration).toContain(
      "and assignments.role in ('moderator'::public.user_role, 'admin'::public.user_role)",
    );
    expect(migration).not.toContain(
      'grant execute on function private.sync_trusted_contributor_role',
    );
  });

  it('commits pgTAP guardrails for the new trust and projection path', () => {
    expect(pgTap).toContain('private.sync_trusted_contributor_role function should exist');
    expect(pgTap).toContain('refresh_user_report_snapshot should trigger trusted contributor sync');
    expect(pgTap).toContain('projection upsert should reject stale recalculations');
    expect(pgTap).toContain(
      'Phase 10 should not weaken direct user_role_assignments table write boundaries',
    );
  });
});
