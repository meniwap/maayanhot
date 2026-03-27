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
const phase9PgTapPath = join(
  projectRoot,
  'supabase',
  'tests',
  'database',
  'phase9_moderation.test.sql',
);
const phase10PgTapPath = join(
  projectRoot,
  'supabase',
  'tests',
  'database',
  'phase10_trust_and_projection.test.sql',
);
const phase11PgTapPath = join(
  projectRoot,
  'supabase',
  'tests',
  'database',
  'phase11_offline_queue.test.sql',
);
const phase13PgTapPath = join(
  projectRoot,
  'supabase',
  'tests',
  'database',
  'phase13_admin_web.test.sql',
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
    expect(migrationFiles).toContain('20260326223000_phase9_moderation.sql');
    expect(migrationFiles).toContain('20260327090000_phase10_trust_and_projection.sql');
    expect(migrationFiles).toContain('20260327120000_phase11_offline_queue.sql');
    expect(migrationFiles).toContain('20260327183000_phase13_admin_web.sql');
    expect(existsSync(pgTapPath)).toBe(true);
    expect(existsSync(phase5PgTapPath)).toBe(true);
    expect(existsSync(phase8PgTapPath)).toBe(true);
    expect(existsSync(phase9PgTapPath)).toBe(true);
    expect(existsSync(phase10PgTapPath)).toBe(true);
    expect(existsSync(phase11PgTapPath)).toBe(true);
    expect(existsSync(phase13PgTapPath)).toBe(true);
  });
});
