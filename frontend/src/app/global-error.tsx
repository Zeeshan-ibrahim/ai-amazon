'use client';

import { useEffect } from 'react';

/** Last-resort screen when the root layout itself fails. Must render its own <html>. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 24,
          textAlign: 'center',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          background: '#FAF9F5',
          color: '#0A0A0A',
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 500, margin: 0 }}>Something went wrong</h1>
        <p style={{ maxWidth: 360, fontSize: 14, color: '#7C7C74', margin: 0 }}>
          Please try again. Your account and balance are not affected.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{ border: 0, borderRadius: 12, padding: '12px 20px', background: '#0A0A0A', color: '#fff', fontSize: 14, cursor: 'pointer' }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
