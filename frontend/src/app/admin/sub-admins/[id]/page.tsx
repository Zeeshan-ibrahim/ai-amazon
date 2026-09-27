'use client';

import { useCallback, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  AccountStatusBadge,
  AdminButton,
  AdminCard,
  MemberInitial,
  Notice,
  RoleBadge,
} from '@/components/admin/ui';
import { ChevronLeftIcon, EditIcon, TrashIcon } from '@/components/ui/Icons';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/States';
import { useApi } from '@/hooks/useApi';
import { api, userMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { SubAdminDetail } from '@/lib/types';

/**
 * One sub-admin and everything they own. Profile, password, status and role
 * are edited on their member page (Particulars), where their own balance
 * requests can also be reviewed (Ledger).
 */
export default function SubAdminPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fetcher = useCallback(() => api.admin.subAdmin(id), [id]);
  const { data, loading, error, refetch } = useApi<SubAdminDetail>(fetcher);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (loading && !data) return <LoadingBlock rows={3} />;
  if (error || !data) return <ErrorState message={error ?? 'Sub-admin unavailable.'} onRetry={refetch} />;

  const { subAdmin, members, plans, products } = data;
  const { stats } = subAdmin;

  const remove = async () => {
    if (
      !window.confirm(
        `Delete ${subAdmin.displayName}? Their ${stats.members} members, ${stats.plans} plans and ${stats.products} products go to the super-admin. This can't be undone.`
      )
    ) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.admin.deleteSubAdmin(subAdmin.id);
      router.replace('/admin/sub-admins');
    } catch (err) {
      setDeleteError(userMessage(err, 'Could not delete this sub-admin.'));
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 border-b border-black/[0.06] pb-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <Link
            href="/admin/sub-admins"
            className="inline-flex w-fit shrink-0 items-center gap-3 whitespace-nowrap rounded-2xl bg-[#1c1c1c] px-6 py-4 text-[12px] font-extrabold uppercase tracking-[0.14em] text-gold shadow-[0_12px_24px_-14px_rgba(0,0,0,0.8)] transition-colors hover:bg-black"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Back
          </Link>
          <span aria-hidden className="hidden h-12 w-px bg-black/10 sm:block" />
          <div className="flex min-w-0 items-center gap-4">
            <MemberInitial name={subAdmin.displayName} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="truncate text-[24px] font-black uppercase tracking-tight text-ink sm:text-[28px]">
                  {subAdmin.displayName}
                </h1>
                <RoleBadge role={subAdmin.role} />
                <AccountStatusBadge status={subAdmin.status} />
              </div>
              <p className="mt-1 text-[12px] font-bold uppercase tracking-[0.14em] text-subtle sm:text-[13px]">
                {subAdmin.loginEmail} • Ref {subAdmin.inviteCode}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/admin/members/${subAdmin.id}`}
            className="inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-2xl border border-black/15 bg-white px-6 py-3.5 text-[12px] font-extrabold uppercase tracking-[0.14em] text-ink transition-colors hover:border-black/40"
          >
            <EditIcon className="h-5 w-5" />
            Edit account
          </Link>
          <AdminButton variant="danger" loading={deleting} onClick={remove} icon={<TrashIcon className="h-5 w-5" />}>
            Delete
          </AdminButton>
        </div>
      </header>

      {deleteError && <Notice tone="error">{deleteError}</Notice>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Members" value={String(stats.members)} />
        <Stat label="Member balances" value={formatCurrency(stats.memberBalance)} />
        <Stat label="Own balance" value={formatCurrency(subAdmin.balance)} />
        <Stat
          label="Own requests pending"
          value={String(stats.pendingRequests)}
          highlight={stats.pendingRequests > 0}
          action={
            stats.pendingRequests > 0 && (
              <Link
                href={`/admin/members/${subAdmin.id}`}
                className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink underline underline-offset-4"
              >
                Review in Ledger
              </Link>
            )
          }
        />
      </div>

      <Section title={`Members (${members.total})`}>
        {members.items.length === 0 ? (
          <EmptyState title="No members yet." />
        ) : (
          <ul className="divide-y divide-black/[0.06]">
            {members.items.map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-4 py-4">
                <Link href={`/admin/members/${member.id}`} className="flex min-w-0 items-center gap-4 hover:underline">
                  <MemberInitial name={member.displayName} />
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-black uppercase tracking-tight text-ink">
                      {member.displayName}
                    </span>
                    <span className="block truncate text-[13px] text-subtle">{member.loginEmail}</span>
                  </span>
                </Link>
                <span className="shrink-0 font-mono text-[15px] font-bold text-ink">{formatCurrency(member.balance)}</span>
              </li>
            ))}
          </ul>
        )}
        {members.total > members.items.length && (
          <p className="mt-4 text-[12px] text-subtle">
            Showing {members.items.length} of {members.total}. Filter Members by this sub-admin to see all.
          </p>
        )}
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title={`Plans (${plans.length})`}>
          {plans.length === 0 ? (
            <EmptyState title="No plans yet." />
          ) : (
            <ul className="divide-y divide-black/[0.06]">
              {plans.map((plan) => (
                <Row key={plan.id} title={plan.name} meta={plan.tag} value={`${formatCurrency(plan.price)} USDT`} />
              ))}
            </ul>
          )}
        </Section>
        <Section title={`Products (${products.total})`}>
          {products.items.length === 0 ? (
            <EmptyState title="No products yet." />
          ) : (
            <ul className="divide-y divide-black/[0.06]">
              {products.items.map((product) => (
                <Row
                  key={product.id}
                  title={product.title}
                  meta={`${Number(product.profitPercentage.toFixed(3))}% return`}
                  value={formatCurrency(product.price)}
                />
              ))}
            </ul>
          )}
        </Section>
      </div>

      <p className="text-[12px] text-subtle">
        Last sign-in: {subAdmin.lastLoginAt ? formatDateTime(subAdmin.lastLoginAt) : 'never'} · Created{' '}
        {formatDateTime(subAdmin.createdAt)}
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <AdminCard>
      <h2 className="mb-4 text-[13px] font-extrabold uppercase tracking-[0.16em] text-subtle">{title}</h2>
      {children}
    </AdminCard>
  );
}

function Row({ title, meta, value }: { title: string; meta: string; value: string }) {
  return (
    <li className="flex items-center justify-between gap-4 py-4">
      <span className="min-w-0">
        <span className="block truncate text-[14px] font-black uppercase tracking-tight text-ink">{title}</span>
        {meta && <span className="block truncate text-[12px] text-subtle">{meta}</span>}
      </span>
      <span className="shrink-0 font-mono text-[14px] font-bold text-ink">{value}</span>
    </li>
  );
}

function Stat({
  label,
  value,
  highlight,
  action,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-3xl border bg-white p-5',
        highlight ? 'border-gold/60 shadow-[0_10px_28px_-18px_rgba(217,180,90,0.9)]' : 'border-black/[0.07]'
      )}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-subtle">{label}</p>
      <p className="mt-2 font-mono text-[22px] font-bold text-ink">{value}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
