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
import { ErrorState, Skeleton } from '@/components/ui/States';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { AdminOverview } from '@/lib/types';

const fetchOverview = () => api.admin.overview();

const count = new Intl.NumberFormat('en-US');

/**
 * Group totals and system diagnostics, shared by Analytics and My Acc. The
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
    <div className="space-y-8">
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
        <div className="grid gap-6 md:grid-cols-2 xl:gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[220px] rounded-[36px]" />
          ))}
          <Skeleton className="h-[180px] rounded-[40px] md:col-span-2" />
        </div>
      ) : (
        <div className={cn('space-y-8 transition-opacity', refreshing && 'pointer-events-none opacity-50')}>
          <div className="grid gap-6 md:grid-cols-2 xl:gap-8">
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

          <section className="flex flex-col gap-6 rounded-[40px] bg-black px-8 py-9 shadow-[0_24px_48px_-28px_rgba(0,0,0,0.9)] sm:flex-row sm:items-center sm:justify-between sm:px-12 sm:py-11">
            <div className="min-w-0">
              <p className="flex items-center gap-3 text-[13px] font-extrabold uppercase tracking-[0.16em] text-gold">
                <TrendIcon className="h-5 w-5" />
                Total volume
              </p>
              <p className="mt-2 break-words text-[40px] font-black leading-tight tracking-tight text-white sm:text-[52px]">
                {formatCurrency(data.totalVolume)}
              </p>
              <p className="mt-1 text-[12px] font-semibold text-white/50">
                Held in member balances · {formatCurrency(data.approvedDeposits)} deposited all-time
              </p>
              <p className="mt-0.5 text-[12px] font-semibold text-white/50">
                Updated {formatDateTime(data.generatedAt)}
              </p>
            </div>
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              className="pointer-events-auto inline-flex shrink-0 items-center justify-center gap-2.5 rounded-full bg-gold px-10 py-5 text-[13px] font-extrabold uppercase tracking-[0.16em] text-ink transition-opacity hover:opacity-90 disabled:opacity-70"
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
    <article className="rounded-[36px] border border-black/[0.07] bg-white p-7 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.25)] sm:p-9">
      <span
        className={cn(
          'flex h-16 w-16 items-center justify-center rounded-2xl',
          highlight ? 'bg-black text-gold' : 'border border-black/[0.04] bg-[#f7f7f7] text-ink'
        )}
      >
        <Icon className="h-7 w-7" />
      </span>
      <p className="mt-8 text-[12px] font-bold uppercase tracking-[0.16em] text-subtle">{label}</p>
      <p className="mt-1 text-[34px] font-black leading-tight tracking-tight text-ink">{value}</p>
    </article>
  );
}

function Diagnostics({ diagnostics: d }: { diagnostics: AdminOverview['diagnostics'] }) {
  return (
    <section className="rounded-[36px] border border-black/[0.05] bg-[#fafafa] p-7 sm:p-9">
      <h2 className="flex items-center gap-3 text-[15px] font-extrabold uppercase tracking-[0.16em] text-ink/70">
        <ShieldIcon className="h-6 w-6" />
        System diagnostics
      </h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
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
    </section>
  );
}

function DiagnosticCard({ label, ok, children }: { label: string; ok: boolean; children: ReactNode }) {
  return (
    <div className="rounded-[24px] border border-black/[0.05] bg-white p-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-subtle">{label}</p>
      <p className="mt-3 flex items-center gap-2.5 text-[15px] font-black uppercase tracking-tight text-ink">
        <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', ok ? 'bg-money' : 'bg-dangerSoft')} />
        <span className="min-w-0 truncate">{children}</span>
      </p>
    </div>
  );
}
