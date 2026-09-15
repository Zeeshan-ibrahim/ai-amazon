import { cn } from '@/lib/cn';

export function EmptyState({
  title,
  hint,
  className,
}: {
  title: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-card border border-dashed border-line px-6 py-14 text-center',
        className
      )}
    >
      <p className="text-sm text-muted">{title}</p>
      {hint && <p className="mt-1.5 text-[13px] text-subtle">{hint}</p>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-xl bg-black/[0.06]', className)} />
  );
}

export function LoadingBlock({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-card border border-dangerSoft/25 bg-dangerSoft/5 px-5 py-6 text-center">
      <p className="text-sm font-medium text-dangerSoft">{message}</p>
      <p className="mt-1 text-[13px] text-muted">
        Make sure the API server is running on port 4000.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg border border-line bg-white px-4 py-2 text-[13px] font-medium text-ink transition-colors hover:border-ink/25"
        >
          Try again
        </button>
      )}
    </div>
  );
}
