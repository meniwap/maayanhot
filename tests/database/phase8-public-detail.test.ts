import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();
const migrationPath = join(
  projectRoot,
  'supabase',
  'migrations',
  '20260326210000_phase8_public_detail_and_upload.sql',
);
const pgTapPath = join(
  projectRoot,
  'supabase',
  'tests',
  'database',
  'phase8_public_detail_and_upload.test.sql',
);

describe('phase 8 public detail and upload migration', () => {
  const migration = readFileSync(migrationPath, 'utf8');
  const pgTap = readFileSync(pgTapPath, 'utf8');

  it('adds public-safe detail read surfaces and the admin create/upload RPCs', () => {
    expect(migration).toContain('create or replace view public.public_spring_detail');
    expect(migration).toContain('create or replace view public.public_spring_detail_media');
    expect(migration).toContain('create or replace view public.public_spring_detail_history');
    expect(migration).toContain('create or replace function public.admin_create_spring(');
    expect(migration).toContain('create or replace function public.create_report_media_slot(');
    expect(migration).toContain('create or replace function public.finalize_report_media_upload(');
  });

  it('keeps the public detail views bounded to approved/public-safe fields', () => {
    expect(migration).toContain(
      "and report.moderation_status = 'approved'::public.report_moderation_status",
    );
    expect(migration).toContain('and media.public_url is not null;');
    expect(migration).not.toContain('reviewer');
    expect(migration).not.toContain('reason_note');
    expect(migration).not.toContain('audit_entries');
  });

  it('grants only the intended public-safe reads and authenticated write-surface execution', () => {
    expect(migration).toContain(
      'grant select on public.public_spring_detail to anon, authenticated;',
    );
    expect(migration).toContain(
      'grant select on public.public_spring_detail_media to anon, authenticated;',
    );
    expect(migration).toContain(
      'grant select on public.public_spring_detail_history to anon, authenticated;',
    );
    expect(migration).toContain(
      'grant execute on function public.create_report_media_slot(uuid, text, timestamptz) to authenticated;',
    );
    expect(migration).toContain(
      'grant execute on function public.finalize_report_media_upload(uuid, integer, integer, bigint, timestamptz, boolean) to authenticated;',
    );
    expect(migration).not.toContain('grant select on public.spring_reports to anon');
  });

  it('commits pgTAP-ready checks for the new phase 8 surfaces', () => {
    expect(pgTap).toContain('public_spring_detail view should exist');
    expect(pgTap).toContain('admin_create_spring RPC should exist');
    expect(pgTap).toContain('create_report_media_slot should grant authenticated execute access');
  });
});
