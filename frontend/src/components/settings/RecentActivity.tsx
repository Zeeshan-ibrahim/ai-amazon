'use client';

import Link from 'next/link';
import { useCallback } from 'react';
import { TransactionRow } from '@/components/history/TransactionRow';
import { SectionTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/States';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import type { Transaction } from '@/lib/types';

const fetchRecent = () => api.transactions(5) as Promise<Transaction[]>;

export function RecentActivity() {
  const fetcher = useCallback(fetchRecent, []);
  const { data } = useApi<Transaction[]>(fetcher);
  const transactions = data ?? [];

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <SectionTitle>Recent ledger actions</SectionTitle>
        <Link
          href="/history"
          className="shrink-0 text-[13px] text-muted transition-colors hover:text-ink"
        >
          Full transaction history
        </Link>
      </div>

      <div className="mt-2">
        {transactions.length === 0 ? (
          <EmptyState title="No ledger actions recorded yet." className="mt-4" />
        ) : (
          transactions.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))
        )}
      </div>
    </section>
  );
}
