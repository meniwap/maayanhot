import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

import { AppProviders } from '../src/infrastructure/providers/AppProviders';
import { getServerAdminWebEnvSnapshot } from '../src/infrastructure/public-env';
import './globals.css';

export const metadata: Metadata = {
  title: 'Maayanhot Admin',
  description: 'Admin spring management and moderation surface for Maayanhot.',
};

export default function RootLayout({ children }: PropsWithChildren) {
  const publicEnv = getServerAdminWebEnvSnapshot();

  return (
    <html dir="rtl" lang="he">
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__MAAYANHOT_ADMIN_ENV__ = ${JSON.stringify(publicEnv)};`,
          }}
        />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
