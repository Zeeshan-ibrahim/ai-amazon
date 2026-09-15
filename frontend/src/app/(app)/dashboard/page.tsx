'use client';

import Image from 'next/image';
import { useCallback, useState } from 'react';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { CapabilitiesGrid } from '@/components/dashboard/CapabilitiesGrid';
import { StatCard } from '@/components/dashboard/StatCard';
import { TopEarners } from '@/components/dashboard/TopEarners';
import { TutorialCard } from '@/components/dashboard/TutorialCard';
import { DepositModal } from '@/components/ledger/DepositModal';
import { WithdrawModal } from '@/components/ledger/WithdrawModal';
import { SectionTitle } from '@/components/ui/Card';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/States';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { greeting } from '@/lib/format';
import type { DashboardPayload } from '@/lib/types';

const fetchDashboard = () => api.dashboard() as Promise<DashboardPayload>;

export default function DashboardPage() {
  const fetcher = useCallback(fetchDashboard, []);
  const { data, loading, error, refetch } = useApi<DashboardPayload>(fetcher);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  if (loading) return <LoadingBlock rows={4} />;
  if (error || !data) {
    return <ErrorState message={error ?? 'Dashboard unavailable.'} onRetry={refetch} />;
  }

  const firstName = data.user.displayName.split(' ')[0];

  return (
    <div className="space-y-8 lg:space-y-10">
      {/* Greeting — avatar + two-line variant on mobile, single line on desktop */}
      <header>
        <div className="flex items-center gap-3 lg:hidden">
          <Image
            src={data.user.avatar}
            alt=""
            width={46}
            height={46}
            className="h-[46px] w-[46px] rounded-full object-cover"
          />
          <div>
            <p className="text-[13px] text-muted">Hi {firstName}</p>
            <p className="text-lg font-medium tracking-tight text-ink">
              {greeting()} 🌤
            </p>
          </div>
        </div>

        <h1 className="hidden text-[30px] font-medium tracking-tight text-ink lg:block">
          {greeting()}, {firstName}
        </h1>
      </header>

      {/* Balance first on mobile, stats first on desktop */}
      <div className="flex flex-col gap-5 lg:gap-6">
        <div className="order-2 grid gap-3 sm:grid-cols-2 lg:order-1 lg:grid-cols-3 lg:gap-5">
          {data.stats.map((stat) => (
            <StatCard key={stat.id} stat={stat} />
          ))}
        </div>

        <div className="order-1 grid gap-5 lg:order-2 lg:grid-cols-2">
          <BalanceCard
            balance={data.balance}
            onDeposit={() => setDepositOpen(true)}
            onWithdraw={() => setWithdrawOpen(true)}
          />
          <div className="order-3 lg:order-none">
            <TutorialCard tutorial={data.tutorial} />
          </div>
        </div>
      </div>

      <CapabilitiesGrid capabilities={data.capabilities} />

      <section>
        <SectionTitle>Exclusive store campaigns</SectionTitle>
        <div className="mt-4 lg:mt-5">
          {data.campaigns.length === 0 ? (
            <EmptyState title="No active administrative campaigns at this time. Check back later." />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {data.campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="rounded-card border border-line bg-white p-5 shadow-card"
                >
                  <p className="font-medium text-ink">{campaign.title}</p>
                  <p className="mt-1.5 text-[13px] text-muted">{campaign.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <TopEarners earners={data.topEarners} />

      <DepositModal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        onSuccess={refetch}
      />
      <WithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        balance={data.balance}
        onSuccess={refetch}
      />
    </div>
  );
}
