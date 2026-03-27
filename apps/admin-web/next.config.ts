import type { NextConfig } from 'next';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const localEnvPath = join(__dirname, '.env.local');

const readLocalEnv = () => {
  if (!existsSync(localEnvPath)) {
    return {} as Record<string, string>;
  }

  const values: Record<string, string> = {};

  for (const line of readFileSync(localEnvPath, 'utf8').split(/\r?\n/u)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    values[trimmed.slice(0, separatorIndex).trim()] = trimmed.slice(separatorIndex + 1).trim();
  }

  return values;
};

const localEnv = readLocalEnv();
const readPublicEnv = (name: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' | 'NEXT_PUBLIC_SUPABASE_URL') =>
  process.env[name] ?? localEnv[name] ?? '';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  env: {
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: readPublicEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
    NEXT_PUBLIC_SUPABASE_URL: readPublicEnv('NEXT_PUBLIC_SUPABASE_URL'),
  },
  transpilePackages: [
    '@maayanhot/contracts',
    '@maayanhot/design-tokens',
    '@maayanhot/domain',
    '@maayanhot/upload-core',
    '@maayanhot/use-cases',
  ],
};

export default nextConfig;
