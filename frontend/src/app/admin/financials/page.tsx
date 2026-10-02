'use client';

import { useCallback, useState } from 'react';
import { RequestCard } from '@/components/admin/financials/RequestCard';
import { AdminButton, Segment } from '@/components/admin/ui';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { usePagedList } from '@/hooks/usePagedList';
import { api } from '@/lib/api';
import type { FinancialRequest } from '@/lib/types';

type Kind = 'deposit' | 'withdrawal';
type Scope = 'active' | 'history';

export default function FinancialsPage() {
  const [kind, setKind] = useState<Kind>('deposit');
  const [scope, setScope] = useState<Scope>('active');
  const [pending, setPending] = useState<Record<Kind, number>>({ deposit: 0, withdrawal: 0 });

  const fetchPage = useCallback(
    async (offset: number) => {
      const page = await api.admin.requests({ type: kind, scope, offset });
      setPending(page.pending);
      return page;
    },
    [kind, scope]
  );
  const list = usePagedList<FinancialRequest>(fetchPage);

  // A reviewed request leaves the Active queue (it's now in History).
  const onReviewed = (id: string) => {
    list.remove((item) => item.id === id);
    setPending((p) => ({ ...p, [kind]: Math.max(0, p[kind] - 1) }));
  };

  const noun = kind === 'deposit' ? 'deposit' : 'withdrawal';

  return (
    <div className="space-y-6 lg:space-y-8">
      <header className="flex flex-col gap-5 border-b border-line pb-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-[26px] font-medium leading-tight tracking-tight text-ink lg:text-[30px]">
            Requests
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
            Review and verify group transactions
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-line bg-white p-1.5 shadow-card sm:flex-row sm:items-center">
          <div className="flex" role="tablist" aria-label="Request type">
            {(['deposit', 'withdrawal'] as const).map((k) => (
              <Segment key={k} active={kind === k} tone="dark" onClick={() => setKind(k)} badge={pending[k]}>
                {k === 'deposit' ? 'Deposits' : 'Withdrawals'}
              </Segment>
            ))}
          </div>
          <span aria-hidden className="hidden h-7 w-px bg-line sm:block" />
          <div className="flex" role="tablist" aria-label="Request status">
            {(['active', 'history'] as const).map((s) => (
              <Segment key={s} active={scope === s} tone="gold" onClick={() => setScope(s)}>
                {s === 'active' ? 'Active' : 'History'}
              </Segment>
            ))}
          </div>
        </div>
      </header>

      {list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : list.loading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-card" />
          ))}
        </div>
      ) : list.items.length === 0 ? (
        <EmptyState
          className="bg-white"
          title={scope === 'active' ? `No ${noun} requests waiting for review.` : `No reviewed ${noun}s yet.`}
        />
      ) : (
        <div className="space-y-4">
          {list.items.map((request) => (
            <RequestCard key={request.id} request={request} onReviewed={onReviewed} />
          ))}
          {list.hasMore && (
            <div className="text-center">
              <AdminButton variant="outline" size="sm" loading={list.loadingMore} onClick={list.loadMore}>
                Load more ({list.items.length} of {list.total})
              </AdminButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
