'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Shown instead of a page that crashed while rendering. Users get a way
 * forward; the actual error goes to the console for developers.
 */
export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-subtle">Unexpected error</p>
      <h1 className="text-3xl font-medium tracking-tight text-ink">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted">
        This page ran into a problem. Please try again — your account and balance are not affected.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-black/85"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-xl border border-line bg-white px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-ink/25"
        >
          Go to home
        </Link>
      </div>
    </main>
  );
}
