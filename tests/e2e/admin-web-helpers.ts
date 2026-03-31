import { createClient } from '@supabase/supabase-js';
import type { Page } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

const readEnvFile = (filePath: string) => {
  if (!existsSync(filePath)) {
    return {} as Record<string, string>;
  }

  const raw = readFileSync(filePath, 'utf8');
  const values: Record<string, string> = {};

  for (const line of raw.split(/\r?\n/u)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    values[key] = value;
  }

  return values;
};

const mobileEnv = readEnvFile(join(process.cwd(), 'apps', 'mobile', '.env.local'));
const adminWebEnv = readEnvFile(join(process.cwd(), 'apps', 'admin-web', '.env.local'));

const getEnv = (name: string) => process.env[name] ?? adminWebEnv[name] ?? mobileEnv[name] ?? null;

const requireEnv = (name: string) => {
  const value = getEnv(name);

  if (!value) {
    throw new Error(`Missing required local env: ${name}`);
  }

  return value;
};

const requireOneOf = (...names: string[]) => {
  for (const name of names) {
    const value = getEnv(name);

    if (value) {
      return value;
    }
  }

  throw new Error(`Missing required local env from any of: ${names.join(', ')}`);
};

export const publicSupabaseUrl = () => requireEnv('NEXT_PUBLIC_SUPABASE_URL');
export const publicSupabaseKey = () => requireEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
export const adminEmail = () =>
  requireOneOf('ADMIN_WEB_E2E_ADMIN_EMAIL', 'EXPO_PUBLIC_DEV_ADMIN_EMAIL');
export const adminPassword = () =>
  requireOneOf('ADMIN_WEB_E2E_ADMIN_PASSWORD', 'EXPO_PUBLIC_DEV_ADMIN_PASSWORD');
export const userEmail = () =>
  requireOneOf('ADMIN_WEB_E2E_USER_EMAIL', 'EXPO_PUBLIC_DEV_USER_EMAIL');
export const userPassword = () =>
  requireOneOf('ADMIN_WEB_E2E_USER_PASSWORD', 'EXPO_PUBLIC_DEV_USER_PASSWORD');

export const createSupabaseTestClient = () =>
  createClient(publicSupabaseUrl(), publicSupabaseKey(), {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

export const createPublishedSpringFixture = async () => {
  const client = createSupabaseTestClient();
  const { error: authError } = await client.auth.signInWithPassword({
    email: adminEmail(),
    password: adminPassword(),
  });

  if (authError) {
    throw new Error(`Admin fixture sign-in failed: ${authError.message}`);
  }

  const timestamp = Date.now();
  const title = `מעיין פלייטרייט ${timestamp}`;
  const slug = `playwright-spring-${timestamp}`;
  const { data, error } = await client.rpc('admin_create_spring', {
    input_access_notes: 'גישה נוחה לרכב',
    input_alternate_names: ['Playwright Spring'],
    input_description: 'Spring fixture for admin web e2e.',
    input_is_published: true,
    input_latitude: 31.778,
    input_location_precision_meters: 12,
    input_longitude: 35.235,
    input_region_code: 'jerusalem_hills',
    input_slug: slug,
    input_title: title,
  });

  await client.auth.signOut();

  if (error) {
    throw new Error(`Failed to create spring fixture: ${error.message}`);
  }

  return {
    springId: String((data as { id: string }).id),
    title,
  };
};

export const createPendingReportFixture = async () => {
  const springFixture = await createPublishedSpringFixture();
  const client = createSupabaseTestClient();
  const { error: authError } = await client.auth.signInWithPassword({
    email: userEmail(),
    password: userPassword(),
  });

  if (authError) {
    throw new Error(`User fixture sign-in failed: ${authError.message}`);
  }

  const note = `playwright moderation ${randomUUID()}`;
  const { data, error } = await client.rpc('submit_spring_report', {
    target_client_submission_id: randomUUID(),
    target_note: note,
    target_observed_at: new Date().toISOString(),
    target_spring_id: springFixture.springId,
    target_water_presence: 'water',
  });

  await client.auth.signOut();

  if (error) {
    throw new Error(`Failed to create pending report fixture: ${error.message}`);
  }

  return {
    note,
    reportId: String((data as { id: string }).id),
    springTitle: springFixture.title,
  };
};

export const loginAsAdmin = async (page: Page) => {
  await page.goto('/login');
  await page.getByTestId('admin-login-email').fill(adminEmail());
  await page.getByTestId('admin-login-password').fill(adminPassword());
  await page
    .getByTestId('admin-login-submit')
    .evaluate((node) => (node as HTMLButtonElement).click());
  await page.waitForURL('**/admin');
};
