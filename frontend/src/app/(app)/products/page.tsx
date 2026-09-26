'use client';

import { useCallback, useMemo, useState } from 'react';
import { BalanceSummary } from '@/components/products/BalanceSummary';
import { CompletedOrders } from '@/components/products/CompletedOrders';
import {
  InsufficientBanner,
  InsufficientPanel,
} from '@/components/products/InsufficientBalance';
import { OrderCard } from '@/components/products/OrderCard';
import { OrderMetrics } from '@/components/products/OrderMetrics';
import { OrderNotice } from '@/components/products/OrderNotice';
import { DepositModal } from '@/components/ledger/DepositModal';
import { Button } from '@/components/ui/Button';
import { SegmentedControl, Tabs } from '@/components/ui/Tabs';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/States';
import { useApi } from '@/hooks/useApi';
import { api, ApiError, userMessage } from '@/lib/api';
import type { ProductState, ProductTab, ProductsPayload } from '@/lib/types';

const fetchProducts = () => api.products() as Promise<ProductsPayload>;

const STATE_FILTERS: { id: ProductState; label: string }[] = [
  { id: 'awaiting', label: 'Awaiting' },
  { id: 'assigned', label: 'Assigned' },
];

const EMPTY_COPY: Record<ProductTab, { title: string; hint: string }> = {
  purchase: {
    title: 'No orders in this queue right now.',
    hint: 'New liquidation lots are assigned throughout the day.',
  },
  sell: {
    title: 'Nothing to sell right now.',
    hint: 'Orders you purchase appear here, ready to sell.',
  },
  completed: {
    title: 'No completed orders yet.',
    hint: 'Orders you sell are listed here.',
  },
};

export default function ProductsPage() {
  const fetcher = useCallback(fetchProducts, []);
  const { data, loading, error, refetch } = useApi<ProductsPayload>(fetcher);

  const [tab, setTab] = useState<ProductTab>('purchase');
  const [stateFilter, setStateFilter] = useState<ProductState>('assigned');
  const [depositOpen, setDepositOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const visible = useMemo(() => {
    if (!data) return [];
    return data.items.filter(
      (item) =>
        item.tab === tab && (tab !== 'purchase' || item.state === stateFilter)
    );
  }, [data, tab, stateFilter]);

  if (loading) return <LoadingBlock rows={4} />;
  if (error || !data) {
    return <ErrorState message={error ?? 'Products unavailable.'} onRetry={refetch} />;
  }

  const { availableBalance, completed, notice } = data.meta;
  const active = visible[0] ?? null;
  // Funding only matters before purchase; sold-side orders are already paid for.
  const missing =
    active && tab === 'purchase'
      ? Math.max(0, +(active.amount - availableBalance).toFixed(2))
      : 0;

  const runAction = async (id: string) => {
    const selling = tab === 'sell';
    setActionError(null);
    setBusyId(id);
    try {
      await (selling ? api.sellProduct(id) : api.purchaseProduct(id));
      await refetch();
    } catch (err) {
      // 409 means the order already moved on (another tab, a double click):
      // reload so the queue matches the server instead of showing a stale card.
      if (err instanceof ApiError && err.status === 409) await refetch();
      setActionError(
        userMessage(
          err,
          selling ? 'Unable to sell this order.' : 'Unable to complete this purchase.'
        )
      );
    } finally {
      setBusyId(null);
    }
  };

  const changeTab = (id: ProductTab) => {
    setActionError(null);
    setTab(id);
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      <h1 className="text-[26px] font-medium tracking-tight text-ink lg:text-[30px]">
        Products
      </h1>

      {/* Mobile puts the balance above the notice; desktop sits them side by side. */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)] lg:items-stretch lg:gap-5">
        <div className="order-2 lg:order-1">
          <OrderNotice notice={notice} />
        </div>
        <div className="order-1 lg:order-2">
          <BalanceSummary balance={availableBalance} completed={completed} />
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <Tabs
          className="flex-1"
          active={tab}
          onChange={(id) => changeTab(id as ProductTab)}
          items={[
            {
              id: 'purchase',
              label: 'Purchase Products',
              badge: data.counts.purchase ? `${data.counts.purchase} new` : undefined,
            },
            {
              id: 'sell',
              label: 'Sell Products',
              badge: data.counts.sell ? `${data.counts.sell} ready` : undefined,
            },
            { id: 'completed', label: 'Completed Orders' },
          ]}
        />

        {tab === 'purchase' && (
          <div className="shrink-0 pb-1 lg:pb-3">
            <SegmentedControl
              label="Preview"
              items={STATE_FILTERS}
              active={stateFilter}
              onChange={(id) => setStateFilter(id as ProductState)}
            />
          </div>
        )}
      </div>

      {actionError && (
        <p className="rounded-lg bg-dangerSoft/8 px-4 py-3 text-[13px] text-dangerSoft">
          {actionError}
        </p>
      )}

      {data.meta.depositRequired ? (
        <div className="flex flex-col items-center gap-4 rounded-card border border-dashed border-line px-6 py-14 text-center">
          <div>
            <p className="text-sm font-medium text-ink">Make your first deposit to unlock orders.</p>
            <p className="mt-1.5 text-[13px] text-subtle">
              Assigned orders appear here once a deposit has been approved.
            </p>
          </div>
          <Button onClick={() => setDepositOpen(true)}>Deposit funds</Button>
        </div>
      ) : !active ? (
        <EmptyState {...EMPTY_COPY[tab]} />
      ) : tab === 'completed' ? (
        <CompletedOrders items={visible} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
          {/* Mobile: warning banner first, then the card */}
          {missing > 0 && (
            <div className="lg:hidden">
              <InsufficientBanner
                required={active.amount}
                current={availableBalance}
                missing={missing}
                onDeposit={() => setDepositOpen(true)}
              />
            </div>
          )}

          <OrderCard
            product={active}
            balance={availableBalance}
            position={1}
            total={visible.length}
            mode={tab === 'sell' ? 'sell' : 'purchase'}
            onAction={() => runAction(active.id)}
            busy={busyId === active.id}
          />

          {tab === 'purchase' && (
            <aside className="hidden space-y-4 lg:block">
              <OrderMetrics
                required={active.amount}
                current={availableBalance}
                missing={missing}
              />
              {missing > 0 && (
                <InsufficientPanel
                  missing={missing}
                  onDeposit={() => setDepositOpen(true)}
                />
              )}
            </aside>
          )}
        </div>
      )}

      <DepositModal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        onSuccess={refetch}
      />
    </div>
  );
}
