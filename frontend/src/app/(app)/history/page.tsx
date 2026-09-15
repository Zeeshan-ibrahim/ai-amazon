'use client';

import { useCallback, useMemo, useState } from 'react';
import { TransactionRow } from '@/components/history/TransactionRow';
import { Card } from '@/components/ui/Card';
import { SegmentedControl } from '@/components/ui/Tabs';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/States';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import type { Transaction } from '@/lib/types';

const fetchTransactions = () => api.transactions() as Promise<Transaction[]>;

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'credit', label: 'Credits' },
  { id: 'debit', label: 'Debits' },
];

export default function HistoryPage() {
  const fetcher = useCallback(fetchTransactions, []);
  const { data, loading, error, refetch } = useApi<Transaction[]>(fetcher);
  const [filter, setFilter] = useState('all');

  const visible = useMemo(
    () =>
      (data ?? []).filter(
        (transaction) => filter === 'all' || transaction.direction === filter
      ),
    [data, filter]
  );

  if (loading) return <LoadingBlock rows={3} />;
  if (error || !data) {
    return <ErrorState message={error ?? 'History unavailable.'} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[26px] font-medium tracking-tight text-ink lg:text-[30px]">
            Transaction history
          </h1>
          <p className="mt-1.5 text-[14px] text-muted">
            Every ledger action recorded on this account.
          </p>
        </div>

        <SegmentedControl items={FILTERS} active={filter} onChange={setFilter} />
      </header>

      {visible.length === 0 ? (
        <EmptyState
          title="No ledger actions match this filter."
          hint="Deposits, withdrawals and order settlements appear here."
        />
      ) : (
        <Card className="py-0">
          {visible.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))}
        </Card>
      )}
    </div>
  );
}
