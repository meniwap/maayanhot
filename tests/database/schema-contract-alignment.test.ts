import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();
const migrationPath = join(
  projectRoot,
  'supabase',
  'migrations',
  '20260326190000_initial_schema.sql',
);
const seedReadmePath = join(projectRoot, 'supabase', 'seed', 'README.md');

const migration = readFileSync(migrationPath, 'utf8').toLowerCase();
const seedReadme = readFileSync(seedReadmePath, 'utf8').toLowerCase();

describe('phase 4 schema alignment', () => {
  it('keeps the report-centered model and required core tables', () => {
    expect(migration).toContain('create extension if not exists postgis');
    expect(migration).toContain('create table public.springs');
    expect(migration).toContain('create table public.spring_reports');
    expect(migration).toContain('create table public.report_media');
    expect(migration).toContain('create table public.moderation_actions');
    expect(migration).toContain('create table public.spring_status_projections');
    expect(migration).toContain('create table public.audit_entries');
    expect(migration).not.toContain('has_water');
  });

  it('maps the phase 3 contract fields to schema columns and derived projections', () => {
    expect(migration).toContain('water_presence public.water_presence not null');
    expect(migration).toContain(
      "moderation_status public.report_moderation_status not null default 'pending'",
    );
    expect(migration).toContain('reporter_role_snapshot public.user_role');
    expect(migration).toContain('location extensions.geography(point, 4326) not null');
    expect(migration).toContain('location_evidence extensions.geography(point, 4326)');
    expect(migration).toContain('derived_from_report_ids uuid[] not null default');
    expect(migration).toContain('user_profile_role_summary');
    expect(migration).toContain('source truth');
    expect(migration).toContain('derived cache table');
  });

  it('defines a seed strategy that stays deterministic and auth-aware', () => {
    expect(seedReadme).toContain('initial seed file is intentionally empty');
    expect(seedReadme).toContain('depends on `auth.users` identities'.toLowerCase());
    expect(seedReadme).toContain('deterministic');
  });
});
