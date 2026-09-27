'use client';

import { useCallback, useState } from 'react';
import { ContractRow } from '@/components/plans/ContractRow';
import { PlanCard } from '@/components/plans/PlanCard';
import { Card, SectionTitle } from '@/components/ui/Card';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/States';
import { useApi } from '@/hooks/useApi';
import { api, userMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { PlansPayload } from '@/lib/types';

const fetchPlans = () => api.plans();

export default function PlansPage() {
  const fetcher = useCallback(fetchPlans, []);
  const { data, loading, error, refetch } = useApi<PlansPayload>(fetcher);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (loading && !data) return <LoadingBlock rows={4} />;
  if (error || !data) {
    return <ErrorState message={error ?? 'Plans unavailable.'} onRetry={refetch} />;
  }

  const pendingPlanIds = new Set(
    data.contracts.filter((c) => c.status === 'PENDING').map((c) => c.planId)
  );

  const activate = async (id: string) => {
    setActionError(null);
    setActivatingId(id);
    try {
      await api.activatePlan(id);
      await refetch();
    } catch (err) {
      setActionError(userMessage(err, 'Unable to activate this plan.'));
      // The plan may have been edited or removed by an admin, or the balance
      // moved — reload so the cards match the server.
      await refetch();
    } finally {
      setActivatingId(null);
    }
  };

  return (
    <div className="space-y-8 lg:space-y-10">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="lg:max-w-[640px]">
          <h1 className="text-[26px] font-medium leading-tight tracking-tight text-ink lg:text-[34px]">
            {data.meta.title}
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-muted">
            {data.meta.subtitle}
          </p>
        </div>

        <Card tone="muted" className="shrink-0 lg:w-[240px]">
          <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-subtle">
            Available asset balance
          </p>
          <p className="tabular mt-2 text-[30px] font-medium tracking-tight text-ink lg:text-[34px]">
            {formatCurrency(data.meta.availableBalance)}
          </p>
        </Card>
      </header>

      {actionError && (
        <p className="rounded-lg bg-dangerSoft/8 px-4 py-3 text-[13px] text-dangerSoft">
          {actionError}
        </p>
      )}

      {data.items.length === 0 ? (
        <EmptyState
          title="No plans are available right now."
          hint="Check back soon for new partnership packages."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
          {data.items.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              balance={data.meta.availableBalance}
              pending={pendingPlanIds.has(plan.id)}
              onActivate={() => activate(plan.id)}
              activating={activatingId === plan.id}
            />
          ))}
        </div>
      )}

      <section>
        <SectionTitle>
          My investment contracts{' '}
          <span className="text-subtle">({data.contracts.length})</span>
        </SectionTitle>

        <div className="mt-4 lg:mt-5">
          {data.contracts.length === 0 ? (
            <EmptyState
              title="No active plan requests records found on this account."
              hint="Select a store logistics partnership above to get started."
            />
          ) : (
            <Card className="py-0">
              {data.contracts.map((contract) => (
                <ContractRow key={contract.id} contract={contract} />
              ))}
            </Card>
          )}
        </div>
      </section>

      <footer className="grid gap-4 border-t border-line pt-6 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)] lg:gap-10">
        <p className="text-[10px] font-medium uppercase leading-relaxed tracking-[0.13em] text-subtle">
          Trade guarantee &amp; capital insurances
        </p>
        <p className="text-[13px] leading-relaxed text-muted">
          {data.meta.guarantee}
        </p>
      </footer>
    </div>
  );
}
