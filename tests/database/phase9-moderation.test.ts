import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();
const migrationPath = join(
  projectRoot,
  'supabase',
  'migrations',
  '20260326223000_phase9_moderation.sql',
);
const pgTapPath = join(projectRoot, 'supabase', 'tests', 'database', 'phase9_moderation.test.sql');

describe('phase 9 moderation migration', () => {
  const migration = readFileSync(migrationPath, 'utf8');
  const pgTap = readFileSync(pgTapPath, 'utf8');

  it('adds staff-only moderation views and the moderation write RPC', () => {
    expect(migration).toContain('create or replace view public.staff_moderation_queue');
    expect(migration).toContain('create or replace view public.staff_moderation_report_detail');
    expect(migration).toContain('create or replace view public.staff_moderation_report_media');
    expect(migration).toContain('create or replace function public.moderate_report(');
    expect(migration).toContain(
      'create or replace function public.staff_upsert_spring_status_projection(',
    );
  });

  it('locks moderation writes behind the rpc and keeps queue surfaces non-public', () => {
    expect(migration).toContain('revoke insert on public.moderation_actions from authenticated;');
    expect(migration).toContain(
      'drop policy if exists moderation_actions_insert_staff_only on public.moderation_actions;',
    );
    expect(migration).toContain('insert into public.moderation_actions (');
    expect(migration).not.toMatch(/update\s+public\.spring_reports/iu);
    expect(migration).not.toContain(
      'grant select on public.staff_moderation_queue to anon, authenticated;',
    );
    expect(migration).toContain('grant select on public.staff_moderation_queue to authenticated;');
  });

  it('keeps public detail/history surfaces approval-bound while queue surfaces stay pending-only', () => {
    expect(migration).toContain(
      "where report.moderation_status = 'pending'::public.report_moderation_status",
    );
    expect(migration).not.toContain('create or replace view public.public_spring_detail_history');
    expect(migration).not.toContain('grant select on public.spring_reports to anon');
  });

  it('commits pgTAP-ready checks for the new moderation surface', () => {
    expect(pgTap).toContain('staff_moderation_queue view should exist');
    expect(pgTap).toContain('moderate_report RPC should exist');
    expect(pgTap).toContain(
      'moderation_actions_apply_state trigger should still exist for state transitions',
    );
    expect(pgTap).toContain(
      'moderation_actions_audit_entry trigger should still exist for audit linkage',
    );
    expect(pgTap).toContain(
      'authenticated should not have direct insert access to moderation_actions after Phase 9',
    );
  });
});
