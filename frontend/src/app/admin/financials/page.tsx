'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { RequestCard } from '@/components/admin/financials/RequestCard';
import { AdminButton } from '@/components/admin/ui';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { usePagedList } from '@/hooks/usePagedList';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
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
    <div className="space-y-8">
      <header className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-[32px] font-black uppercase leading-none tracking-tight text-ink sm:text-[40px]">
            Requests
          </h1>
          <p className="mt-3 max-w-xs text-[12px] font-bold uppercase leading-relaxed tracking-[0.18em] text-subtle">
            Review and verify group transactions
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-3xl border border-black/[0.05] bg-white p-2 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.4)] sm:flex-row sm:items-center">
          <div className="flex" role="tablist" aria-label="Request type">
            {(['deposit', 'withdrawal'] as const).map((k) => (
              <Segment key={k} active={kind === k} tone="dark" onClick={() => setKind(k)} badge={pending[k]}>
                {k === 'deposit' ? 'Deposits' : 'Withdrawals'}
              </Segment>
            ))}
          </div>
          <span aria-hidden className="hidden h-10 w-px bg-black/10 sm:block" />
          <div className="flex" role="tablist" aria-label="Request status">
            {(['active', 'history'] as const).map((s) => (
              <Segment key={s} active={scope === s} tone="gold" onClick={() => setScope(s)}>
                {s}
              </Segment>
            ))}
          </div>
        </div>
      </header>

      {list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : list.loading ? (
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-[32px]" />
          ))}
        </div>
      ) : list.items.length === 0 ? (
        <EmptyState
          className="border-black/10 bg-white"
          title={scope === 'active' ? `No ${noun} requests waiting for review.` : `No reviewed ${noun}s yet.`}
        />
      ) : (
        <div className="space-y-6">
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

function Segment({
  active,
  tone,
  badge,
  onClick,
  children,
}: {
  active: boolean;
  tone: 'dark' | 'gold';
  badge?: number;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-[13px] font-extrabold uppercase tracking-[0.16em] transition-colors sm:flex-none sm:px-8',
        active
          ? tone === 'dark'
            ? 'bg-black text-gold shadow-[0_10px_20px_-12px_rgba(0,0,0,0.8)]'
            : 'bg-gold text-ink shadow-[0_10px_20px_-12px_rgba(217,180,90,0.9)]'
          : 'text-subtle hover:text-ink'
      )}
    >
      {children}
      {badge ? (
        <span
          className={cn(
            'min-w-[22px] rounded-full px-1.5 py-0.5 text-[11px] tracking-normal',
            active ? 'bg-gold text-ink' : 'bg-black text-gold'
          )}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}
