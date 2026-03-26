import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();
const configPath = join(projectRoot, 'supabase', 'config.toml');
const migrationDir = join(projectRoot, 'supabase', 'migrations');
const pgTapPath = join(projectRoot, 'supabase', 'tests', 'database', 'phase4_schema.test.sql');
const phase5PgTapPath = join(
  projectRoot,
  'supabase',
  'tests',
  'database',
  'phase5_policies.test.sql',
);
const phase8PgTapPath = join(
  projectRoot,
  'supabase',
  'tests',
  'database',
  'phase8_public_detail_and_upload.test.sql',
);

describe('phase 4 and phase 5 Supabase project structure', () => {
  it('pins the local Supabase project structure to the exact maayanhot project name', () => {
    const config = readFileSync(configPath, 'utf8');

    expect(config).toContain('project_id = "maayanhot"');
    expect(config).toContain('major_version = 17');
    expect(config).toContain('[db.seed]');
    expect(config).toContain('sql_paths = ["./seed/001_base_reference.sql"]');
    expect(config).toContain('[storage.buckets.report-media]');
  });

  it('includes reproducible schema/security migrations and pgTAP-ready database tests', () => {
    const migrationFiles = readdirSync(migrationDir).filter((entry: string) =>
      entry.endsWith('.sql'),
    );

    expect(migrationFiles).toContain('20260326190000_initial_schema.sql');
    expect(migrationFiles).toContain('20260326193000_phase5_security.sql');
    expect(migrationFiles).toContain('20260326210000_phase8_public_detail_and_upload.sql');
    expect(existsSync(pgTapPath)).toBe(true);
    expect(existsSync(phase5PgTapPath)).toBe(true);
    expect(existsSync(phase8PgTapPath)).toBe(true);
  });
});
