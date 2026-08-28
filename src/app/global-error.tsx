'use client';

import { useEffect } from 'react';
import { reportError } from '@/lib/observability';

/**
 * Last-resort boundary for errors thrown in the root layout, and the only boundary covering the
 * ~150 public marketing pages — /admin, /dashboard and /partner each had their own error.tsx, but
 * a crash anywhere on the public site (homepage, a calculator, checkout) previously produced the
 * default Next.js error screen and was reported to nobody.
 *
 * Must render its own <html>/<body>: when this fires, the root layout has failed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // If this is a transient Firestore watch stream teardown assertion during navigation, avoid logging as critical app crash
    const isFirestoreTeardown = error.message?.includes('INTERNAL ASSERTION FAILED') || error.message?.includes('TargetState.Ue');
    reportError(error, {
      operation: 'app.global',
      detail: {
        digest: error.digest,
        path: typeof window !== 'undefined' ? window.location.pathname : undefined,
        isFirestoreTeardown,
      },
    }, isFirestoreTeardown ? 'WARNING' : 'CRITICAL');
  }, [error]);

  return (
    <html lang="en-ZA">
      <body style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif', margin: 0 }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ maxWidth: '32rem', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 500, marginBottom: '0.75rem' }}>
              Something went wrong on our side
            </h1>
            <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              Sorry — this page failed to load. Our team has been notified automatically. Please try
              again, or contact us on 010 109 1625 if you need help right away.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => reset()}
                style={{
                  padding: '0.6rem 1.1rem', borderRadius: '8px', border: 'none',
                  background: '#1876F2', color: '#fff', fontSize: '0.95rem', cursor: 'pointer',
                }}
              >
                Try again
              </button>
              <a
                href="/"
                style={{
                  padding: '0.6rem 1.1rem', borderRadius: '8px', border: '1px solid #cbd5e1',
                  background: '#fff', color: '#0f172a', fontSize: '0.95rem', textDecoration: 'none',
                }}
              >
                Back to home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
