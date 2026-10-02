'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { AdminButton, AdminCard, AdminSearch, Notice } from '@/components/admin/ui';
import { AssignedOrders } from '@/components/admin/members/AssignedOrders';
import { BoxIcon, CheckIcon, LayersIcon } from '@/components/ui/Icons';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { useDebounced } from '@/hooks/useDebounced';
import { usePagedList } from '@/hooks/usePagedList';
import { api, userMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrency, formatNumber } from '@/lib/format';
import type { CatalogProduct, Member } from '@/lib/types';

const SEGMENTS = [
  { id: 'all', label: 'All' },
  { id: 'lt250', label: '< $250', max: 250 },
  { id: '250-1k', label: '$250-$1K', min: 250, max: 1000 },
  { id: '1k-5k', label: '$1K-$5K', min: 1000, max: 5000 },
  { id: '5k+', label: '$5K+', min: 5000 },
] as const;

type SegmentId = (typeof SEGMENTS)[number]['id'];

export function OrdersTab({
  member,
  onGoToLedger,
  onBalanceChange,
}: {
  member: Member;
  onGoToLedger: () => void;
  onBalanceChange: () => void;
}) {
  const [query, setQuery] = useState('');
  const [segmentId, setSegmentId] = useState<SegmentId>('all');
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [assignedVersion, setAssignedVersion] = useState(0);
  const q = useDebounced(query.trim());

  const segment = SEGMENTS.find((s) => s.id === segmentId)!;
  const min = 'min' in segment ? segment.min : undefined;
  const max = 'max' in segment ? segment.max : undefined;

  const fetchPage = useCallback(
    (offset: number) => api.admin.catalog(member.id, { q, min, max, offset }),
    [member.id, q, min, max]
  );
  const list = usePagedList<CatalogProduct>(fetchPage);

  if (member.role !== 'user') {
    return <EmptyState title="Orders can only be assigned to user accounts." />;
  }

  const assign = async (product: CatalogProduct) => {
    setAssigningId(product.id);
    setError(null);
    try {
      await api.admin.assignOrder(member.id, product.id);
      list.setItems((items) =>
        items.map((item) => (item.id === product.id ? { ...item, assigned: true } : item))
      );
      setAssignedVersion((v) => v + 1);
    } catch (err) {
      setError(userMessage(err, 'Could not assign this contract.'));
    } finally {
      setAssigningId(null);
    }
  };

  const release = (productId: string) =>
    list.setItems((items) =>
      items.map((item) => (item.id === productId ? { ...item, assigned: false } : item))
    );

  return (
    <AdminCard className="grid gap-6 xl:grid-cols-2 xl:items-start">
      {!member.hasApprovedDeposit && (
        <div className="xl:col-span-2">
          <Notice tone="warn">
            Contracts you assign stay hidden from this member until they have an approved deposit.{' '}
            <button
              type="button"
              onClick={onGoToLedger}
              className="font-medium underline underline-offset-2"
            >
              Review their ledger
            </button>
          </Notice>
        </div>
      )}

      <div className="min-w-0 space-y-5">
        <div className="rounded-card border border-line bg-cream p-5 sm:p-6">
          <span className="inline-block rounded-md bg-brand-500 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-white">
            Allocation hub
          </span>
          <h2 className="mt-4 text-xl font-medium tracking-tight text-ink">
            Find &amp; assign contracts
          </h2>
          <p className="mt-1 text-[14px] text-muted">
            Filter available strategic contracts by price points or names to allocate immediately to
            the user workspace.
          </p>

          <AdminSearch
            tone="plain"
            value={query}
            onChange={setQuery}
            placeholder="Search by price or title (e.g. 500, laser)..."
            className="mt-6"
          />

          <p className="mt-6 text-[10px] font-medium uppercase tracking-[0.14em] text-subtle">
            Quick price segments
          </p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {SEGMENTS.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={segmentId === s.id}
                onClick={() => setSegmentId(s.id)}
                className={cn(
                  'rounded-lg border px-3.5 py-1.5 text-[13px] transition-colors',
                  segmentId === s.id
                    ? 'border-ink bg-ink font-medium text-white'
                    : 'border-line bg-white text-muted hover:text-ink'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-card border border-line p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 border-b border-line pb-5">
            <p className="flex items-center gap-2 text-[15px] font-medium text-ink">
              <LayersIcon className="h-[18px] w-[18px] text-muted" />
              Available contracts
            </p>
            <span className="rounded-md bg-black/5 px-2.5 py-1 text-[12px] font-medium text-muted">
              {formatNumber(list.total)} entries
            </span>
          </div>

          {error && (
            <div className="mt-5">
              <Notice tone="error">{error}</Notice>
            </div>
          )}

          {list.error ? (
            <div className="mt-5">
              <ErrorState message={list.error} onRetry={list.reload} />
            </div>
          ) : list.loading ? (
            <div className="mt-5 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-card" />
              ))}
            </div>
          ) : list.items.length === 0 ? (
            <EmptyState className="mt-5" title="No contracts match these filters." />
          ) : (
            <ul className="mt-5 space-y-4">
              {list.items.map((product) => (
                <ContractRow
                  key={product.id}
                  product={product}
                  assigning={assigningId === product.id}
                  disabled={assigningId !== null}
                  onAssign={() => assign(product)}
                />
              ))}
            </ul>
          )}

          {list.hasMore && !list.loading && (
            <div className="mt-6 text-center">
              <AdminButton
                variant="outline"
                size="sm"
                loading={list.loadingMore}
                onClick={list.loadMore}
              >
                Load more ({list.items.length} of {formatNumber(list.total)})
              </AdminButton>
            </div>
          )}
        </div>
      </div>

      <div className="min-w-0 xl:sticky xl:top-6">
        <AssignedOrders
          member={member}
          reloadKey={assignedVersion}
          onReleased={release}
          onBalanceChange={onBalanceChange}
        />
      </div>
    </AdminCard>
  );
}

function ContractRow({
  product,
  assigning,
  disabled,
  onAssign,
}: {
  product: CatalogProduct;
  assigning: boolean;
  disabled: boolean;
  onAssign: () => void;
}) {
  return (
    <li
      className={cn(
        'flex items-center gap-4 rounded-card p-4 sm:gap-5 sm:p-5',
        product.assigned
          ? 'border border-brand-300 bg-brand-50/60'
          : 'border border-line bg-white'
      )}
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-white sm:h-16 sm:w-16">
        {product.image ? (
          <Image
            src={product.image}
            alt=""
            width={80}
            height={80}
            className="h-full w-full object-cover"
          />
        ) : (
          <BoxIcon className="h-6 w-6 text-subtle" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium tracking-tight text-ink">
          {product.title}
        </p>
        <p className="tabular mt-1 text-[13px] font-medium sm:text-[14px]">
          <span className="text-ink/70">{formatCurrency(product.price)}</span>
          <span className="mx-2 text-subtle">•</span>
          <span className="text-money">+{product.profitPercentage}% Profit</span>
        </p>
      </div>

      {product.assigned ? (
        <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3.5 text-[13px] font-medium text-brand-600">
          <CheckIcon className="h-4 w-4" />
          Assigned
        </span>
      ) : (
        <button
          type="button"
          onClick={onAssign}
          disabled={disabled}
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl bg-ink px-4 text-[13px] font-medium text-white transition-colors hover:bg-black/85 disabled:cursor-not-allowed disabled:bg-ink/40"
        >
          {assigning && (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
          Assign
        </button>
      )}
    </li>
  );
}
