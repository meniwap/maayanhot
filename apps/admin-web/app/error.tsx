'use client';

import { useEffect } from 'react';

import { useAdminWebObservability } from '../src/infrastructure/observability/AdminWebObservabilityProvider';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const observability = useAdminWebObservability();

  useEffect(() => {
    void observability.errors.captureError(error, {
      action: 'render',
      feature: 'admin_web_root',
      metadata: {
        digest: error.digest ?? null,
      },
      severity: 'fatal',
    });
  }, [error, observability]);

  return (
    <html dir="rtl" lang="he">
      <body style={{ margin: '0 auto', maxWidth: 720, padding: 32 }}>
        <main>
          <h1>משהו השתבש במסך הניהול</h1>
          <p>התקלה דווחה דרך שכבת observability ניתנת להחלפה.</p>
          <button onClick={reset} type="button">
            נסה שוב
          </button>
        </main>
      </body>
    </html>
  );
}
