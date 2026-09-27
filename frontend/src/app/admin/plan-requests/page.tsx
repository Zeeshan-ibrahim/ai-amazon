'use client';

import { useCallback, useState } from 'react';
import { PlanRequestCard } from '@/components/admin/plan-requests/PlanRequestCard';
import { AdminButton, Segment } from '@/components/admin/ui';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { usePagedList } from '@/hooks/usePagedList';
import { api } from '@/lib/api';
import type { PlanRequest } from '@/lib/types';

type Scope = 'active' | 'history';

export default function PlanRequestsPage() {
  const [scope, setScope] = useState<Scope>('active');
  const [pending, setPending] = useState(0);

  const fetchPage = useCallback(
    async (offset: number) => {
      const page = await api.admin.planRequests({ scope, offset });
      setPending(page.pending);
      return page;
    },
    [scope]
  );
  const list = usePagedList<PlanRequest>(fetchPage);

  // A reviewed request leaves the Active queue (it's now in History).
  const onReviewed = (id: string) => {
    list.remove((item) => item.id === id);
    setPending((p) => Math.max(0, p - 1));
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-[32px] font-black uppercase leading-none tracking-tight text-ink sm:text-[40px]">
            Plan requests
          </h1>
          <p className="mt-3 max-w-xs text-[12px] font-bold uppercase leading-relaxed tracking-[0.18em] text-subtle">
            Review member plan activations
          </p>
        </div>

        <div
          className="flex rounded-3xl border border-black/[0.05] bg-white p-2 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.4)]"
          role="tablist"
          aria-label="Request status"
        >
          <Segment active={scope === 'active'} tone="dark" onClick={() => setScope('active')} badge={pending}>
            Active
          </Segment>
          <Segment active={scope === 'history'} tone="dark" onClick={() => setScope('history')}>
            History
          </Segment>
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
          title={scope === 'active' ? 'No plan requests waiting for review.' : 'No reviewed plan requests yet.'}
        />
      ) : (
        <div className="space-y-6">
          {list.items.map((request) => (
            <PlanRequestCard key={request.id} request={request} onReviewed={onReviewed} />
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
