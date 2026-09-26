'use client';

import Link from 'next/link';
import { useCallback } from 'react';
import { TransactionRow } from '@/components/history/TransactionRow';
import { Card } from '@/components/ui/Card';
import { ClockIcon } from '@/components/ui/Icons';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import type { Transaction } from '@/lib/types';

const fetchRecent = () => api.transactions({ limit: 5 });

/** Last five ledger actions. Remount it (change its `key`) to reload after a new request. */
export function RecentActivity() {
  const fetcher = useCallback(fetchRecent, []);
  const { data, loading, error, refetch } = useApi<Transaction[]>(fetcher);

  return (
    <section>
      <div className="flex items-center justify-between gap-4 border-b border-line pb-3">
        <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-subtle">
          <ClockIcon className="h-4 w-4 text-brand-500" />
          Recent activities
        </p>
        <Link
          href="/history"
          className="shrink-0 text-[11px] font-medium uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
        >
          Audits list
        </Link>
      </div>

      <div className="mt-4">
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : !data?.length ? (
          <EmptyState title="No ledger actions recorded yet." />
        ) : (
          <Card className="py-0">
            {data.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
          </Card>
        )}
      </div>
    </section>
  );
}
