'use client';

import { useCallback, useMemo, useState } from 'react';
import { BalanceSummary } from '@/components/products/BalanceSummary';
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
import { api } from '@/lib/api';
import type { ProductState, ProductTab, ProductsPayload } from '@/lib/types';

const fetchProducts = () => api.products() as Promise<ProductsPayload>;

const STATE_FILTERS: { id: ProductState; label: string }[] = [
  { id: 'awaiting', label: 'Awaiting' },
  { id: 'assigned', label: 'Assigned' },
];

export default function ProductsPage() {
  const fetcher = useCallback(fetchProducts, []);
  const { data, loading, error, refetch } = useApi<ProductsPayload>(fetcher);

  const [tab, setTab] = useState<ProductTab>('purchase');
  const [stateFilter, setStateFilter] = useState<ProductState>('assigned');
  const [depositOpen, setDepositOpen] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
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
  const missing = active
    ? Math.max(0, +(active.amount - availableBalance).toFixed(2))
    : 0;

  const purchase = async (id: string) => {
    setActionError(null);
    setPurchasingId(id);
    try {
      await api.purchaseProduct(id);
      await refetch();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to complete this purchase.'
      );
    } finally {
      setPurchasingId(null);
    }
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
          onChange={(id) => setTab(id as ProductTab)}
          items={[
            {
              id: 'purchase',
              label: 'Purchase Products',
              badge: data.counts.purchase ? `${data.counts.purchase} new` : undefined,
            },
            { id: 'sell', label: 'Sell Products' },
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
        <EmptyState
          title="No orders in this queue right now."
          hint="New liquidation lots are assigned throughout the day."
        />
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
            onPurchase={() => purchase(active.id)}
            purchasing={purchasingId === active.id}
          />

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
