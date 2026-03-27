import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();
const migrationPath = join(
  projectRoot,
  'supabase',
  'migrations',
  '20260327120000_phase11_offline_queue.sql',
);
const pgTapPath = join(
  projectRoot,
  'supabase',
  'tests',
  'database',
  'phase11_offline_queue.test.sql',
);

describe('phase 11 offline queue migration', () => {
  const migration = readFileSync(migrationPath, 'utf8');
  const pgTap = readFileSync(pgTapPath, 'utf8');

  it('adds report and media idempotency columns plus partial unique indexes', () => {
    expect(migration).toContain('add column if not exists client_submission_id uuid;');
    expect(migration).toContain('spring_reports_reporter_client_submission_uidx');
    expect(migration).toContain('add column if not exists client_media_draft_id text;');
    expect(migration).toContain('report_media_report_id_client_media_draft_uidx');
  });

  it('introduces authenticated idempotent RPCs for report replay', () => {
    expect(migration).toContain('create or replace function public.submit_spring_report(');
    expect(migration).toContain('create or replace function public.reserve_report_media_slot(');
    expect(migration).toContain('grant execute on function public.submit_spring_report');
    expect(migration).toContain('grant execute on function public.reserve_report_media_slot');
  });

  it('keeps the public-safe detail history approved-only', () => {
    expect(pgTap).toContain('public_spring_detail_history should remain approved-only');
    expect(pgTap).toContain('submit_spring_report RPC should exist');
    expect(pgTap).toContain('reserve_report_media_slot RPC should exist');
  });
});
