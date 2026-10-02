'use client';

import { useEffect, useState, type ComponentType, type ReactNode, type SVGProps } from 'react';
import { AdminPageHeader, ROLE_LABELS } from '@/components/admin/ui';
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  BagIcon,
  CheckIcon,
  ShieldIcon,
  TrendIcon,
  UsersIcon,
} from '@/components/ui/Icons';
import { Card } from '@/components/ui/Card';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { AdminOverview } from '@/lib/types';

const fetchOverview = () => api.admin.overview();

const count = new Intl.NumberFormat('en-US');

/**
 * Group totals and system diagnostics, shared by Analytics and My account. The
 * API scopes the figures: a sub-admin's cover only their own members.
 */
export function GroupOverview({ title }: { title: string }) {
  const { data, error, refetch } = useApi<AdminOverview>(fetchOverview);
  const [refreshing, setRefreshing] = useState(false);
  const [updated, setUpdated] = useState(false);

  // Held for a moment so a fast reload still reads as a refresh.
  const refresh = async () => {
    setRefreshing(true);
    setUpdated(false);
    await Promise.all([refetch(), new Promise((resolve) => setTimeout(resolve, 600))]);
    setRefreshing(false);
    setUpdated(true);
  };

  useEffect(() => {
    if (!updated) return;
    const timer = setTimeout(() => setUpdated(false), 2500);
    return () => clearTimeout(timer);
  }, [updated]);

  return (
    <div className="space-y-6 lg:space-y-8">
      <AdminPageHeader
        title={title}
        subtitle={
          data?.diagnostics.admin.role === 'sub_admin'
            ? 'Your members only'
            : 'System strategic performance'
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:gap-5 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[92px] rounded-card" />
            ))}
          </div>
          <Skeleton className="h-[180px] rounded-card" />
        </div>
      ) : (
        <div className={cn('space-y-5 transition-opacity lg:space-y-6', refreshing && 'pointer-events-none opacity-50')}>
          <div className="grid gap-3 sm:grid-cols-2 lg:gap-5 xl:grid-cols-4">
            <StatCard icon={UsersIcon} label="Total members" value={count.format(data.members)} />
            <StatCard icon={BagIcon} label="Active products" value={count.format(data.activeProducts)} />
            <StatCard
              icon={ArrowUpRightIcon}
              label="Pending deposits"
              value={count.format(data.pendingDeposits)}
              highlight
            />
            <StatCard icon={ArrowDownLeftIcon} label="Pending withdrawals" value={count.format(data.pendingWithdrawals)} />
          </div>

          <section className="flex flex-col gap-6 rounded-card bg-balance-veil p-5 text-white shadow-panel sm:flex-row sm:items-end sm:justify-between sm:p-6">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.1em] text-brand-300">
                <TrendIcon className="h-4 w-4" />
                Total volume
              </p>
              <p className="tabular mt-4 break-words text-[40px] font-medium leading-none tracking-tight sm:text-[52px]">
                {formatCurrency(data.totalVolume)}
              </p>
              <p className="mt-3 text-[13px] text-white/60">
                Held in member balances · {formatCurrency(data.approvedDeposits)} deposited all-time
              </p>
              <p className="mt-0.5 text-[13px] text-white/60">
                Updated {formatDateTime(data.generatedAt)}
              </p>
            </div>
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              className="inline-flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 text-[15px] font-medium text-ink transition-colors hover:bg-white/90 disabled:opacity-70"
            >
              {refreshing ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                updated && <CheckIcon className="h-5 w-5" />
              )}
              {refreshing ? 'Refreshing…' : updated ? 'Updated' : 'Refresh data'}
            </button>
          </section>

          <Diagnostics diagnostics={data.diagnostics} />
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5">
      <div>
        <p className={cn('tabular text-[22px] font-medium tracking-tight sm:text-[26px]', highlight ? 'text-brand-600' : 'text-ink')}>
          {value}
        </p>
        <p className="mt-0.5 text-[13px] text-muted">{label}</p>
      </div>
      <Icon className={cn('h-7 w-7 shrink-0', highlight ? 'text-brand-500' : 'text-black/12')} />
    </Card>
  );
}

function Diagnostics({ diagnostics: d }: { diagnostics: AdminOverview['diagnostics'] }) {
  return (
    <Card tone="muted">
      <h2 className="flex items-center gap-2.5 text-lg font-medium tracking-tight text-ink">
        <ShieldIcon className="h-5 w-5 text-muted" />
        System diagnostics
      </h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <DiagnosticCard label="Admin role" ok>
          {ROLE_LABELS[d.admin.role]} · @{d.admin.username || d.admin.email.split('@')[0]}
        </DiagnosticCard>
        <DiagnosticCard label="Database connection" ok={d.database.connected}>
          {d.database.connected ? `Connected · ${d.database.latencyMs} ms` : 'Unreachable'}
        </DiagnosticCard>
        <DiagnosticCard label="Schema version" ok={Boolean(d.schema)}>
          {d.schema ? d.schema.version : 'Unknown'}
        </DiagnosticCard>
      </div>
    </Card>
  );
}

function DiagnosticCard({ label, ok, children }: { label: string; ok: boolean; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4 sm:p-5">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-subtle">{label}</p>
      <p className="mt-2 flex items-center gap-2.5 text-[15px] font-medium tracking-tight text-ink">
        <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', ok ? 'bg-money' : 'bg-dangerSoft')} />
        <span className="min-w-0 truncate">{children}</span>
      </p>
    </div>
  );
}
