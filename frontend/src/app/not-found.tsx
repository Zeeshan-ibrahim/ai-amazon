import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-6 text-center">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-subtle">
        Error 404
      </p>
      <h1 className="text-3xl font-medium tracking-tight">Page not found</h1>
      <p className="max-w-sm text-sm text-muted">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-black/85"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
