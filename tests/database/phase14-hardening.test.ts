import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();
const migrationPath = join(
  projectRoot,
  'supabase',
  'migrations',
  '20260331120000_phase14_hardening.sql',
);
const pgTapPath = join(projectRoot, 'supabase', 'tests', 'database', 'phase14_hardening.test.sql');

describe('phase 14 hardening migration', () => {
  const migration = readFileSync(migrationPath, 'utf8');
  const pgTap = readFileSync(pgTapPath, 'utf8');

  it('hardens submit_spring_report with note normalization and max length checks', () => {
    expect(migration).toContain(
      "normalized_note text := nullif(btrim(coalesce(target_note, '')), '')",
    );
    expect(migration).toContain('character_length(normalized_note) > 2000');
    expect(migration).toContain('report note exceeds max length');
  });

  it('hardens reserve_report_media_slot with a max-8 attachment boundary', () => {
    expect(migration).toContain('current_attachment_count >= 8');
    expect(migration).toContain('too many attachments reserved for report');
  });

  it('commits pgTAP checks for the hardened RPC boundaries', () => {
    expect(pgTap).toContain('submit_spring_report should enforce the 2000 character note boundary');
    expect(pgTap).toContain(
      'reserve_report_media_slot should enforce the max-8 attachment boundary',
    );
  });
});
