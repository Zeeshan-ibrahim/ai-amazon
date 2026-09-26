'use client';

import { useCallback } from 'react';
import { AdminCard, PicturesNeeded } from '@/components/admin/ui';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/States';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { AuditEntry, Member } from '@/lib/types';

/** Mirrors `AUDIT` in backend/src/models/audit.js. */
const ACTION_LABELS: Record<string, string> = {
  'member.created': 'Account created',
  'member.updated': 'Particulars updated',
  'order.assigned': 'Contract assigned',
  'order.purchased': 'Order purchased',
  'order.sold': 'Order sold',
  'order.updated': 'Contract edited',
  'order.removed': 'Contract removed',
  'balance.adjusted': 'Balance adjusted',
  'deposit.requested': 'Deposit requested',
  'withdrawal.requested': 'Withdrawal requested',
  'transaction.approved': 'Transaction approved',
  'transaction.rejected': 'Transaction rejected',
};

const FIELD_LABELS: Record<string, string> = {
  firstName: 'first name',
  lastName: 'last name',
  withdrawalLimit: 'withdrawal limit',
};

const show = (value: unknown) =>
  value === null || value === '' || value === undefined ? '—' : String(value);

/** One readable line per entry, built from the stored `details`. */
function describe({ action, details: d }: AuditEntry): string | null {
  const money = (v: unknown) => formatCurrency(Number(v));
  switch (action) {
    case 'member.updated': {
      const changes = (d.changes ?? {}) as Record<string, { from?: unknown; to?: unknown }>;
      return Object.entries(changes)
        .map(([field, c]) => (field === 'password' ? 'password reset' : `${FIELD_LABELS[field] ?? field}: ${show(c.from)} → ${show(c.to)}`))
        .join(' · ');
    }
    case 'member.created':
      return `${show(d.email)} as ${show(d.role)}`;
    case 'order.assigned':
      return `Price ${money(d.price)}`;
    case 'order.purchased':
      return `Debited ${money(d.amount)} · new balance ${money(d.balance)}`;
    case 'order.sold':
      return `Credited ${money(d.amount)} · new balance ${money(d.balance)}`;
    case 'order.updated': {
      const changes = (d.changes ?? {}) as Record<string, { from?: unknown; to?: unknown }>;
      return Object.entries(changes)
        .map(([field, c]) =>
          field === 'price' ? `price: ${money(c.from)} → ${money(c.to)}` : `profit: ${show(c.from)}% → ${show(c.to)}%`
        )
        .join(' · ');
    }
    case 'order.removed':
      return `Price ${money(d.price)}`;
    case 'balance.adjusted':
      return [`${show(d.direction)} ${money(d.amount)}`, `new balance ${money(d.balance)}`, d.note && `“${d.note}”`]
        .filter(Boolean)
        .join(' · ');
    case 'transaction.approved':
    case 'transaction.rejected':
      return [`${show(d.type)} ${money(d.amount)}`, d.balance !== undefined && `new balance ${money(d.balance)}`, d.note && `“${d.note}”`]
        .filter(Boolean)
        .join(' · ');
    case 'deposit.requested':
    case 'withdrawal.requested':
      return money(d.amount);
    default:
      return null;
  }
}

export function AuditsTab({ member }: { member: Member }) {
  const fetcher = useCallback(() => api.admin.audits(member.id), [member.id]);
  const { data, loading, error, refetch } = useApi<AuditEntry[]>(fetcher);

  return (
    <div className="space-y-6">
      <PicturesNeeded what="Audits tab" />
      <AdminCard>
        {loading ? (
          <LoadingBlock rows={3} />
        ) : error || !data ? (
          <ErrorState message={error ?? 'Audit trail unavailable.'} onRetry={refetch} />
        ) : data.length === 0 ? (
          <EmptyState title="No recorded activity yet." />
        ) : (
          <ol className="relative space-y-6 border-l-2 border-black/[0.08] pl-6">
            {data.map((entry) => {
              const line = describe(entry);
              return (
                <li key={entry.id} className="relative">
                  <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-gold ring-2 ring-gold/30" />
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <p className="text-[14px] font-black uppercase tracking-tight text-ink">
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </p>
                    <p className="shrink-0 text-[12px] text-subtle">{formatDateTime(entry.createdAt)}</p>
                  </div>
                  <p className="mt-0.5 text-[12px] font-bold uppercase tracking-[0.12em] text-subtle">
                    by {entry.actor ? `@${entry.actor.handle}` : 'deleted user'}
                    {entry.actor?.role === 'admin' && ' · admin'}
                  </p>
                  {line && <p className="mt-1.5 break-words text-[13px] text-muted">{line}</p>}
                </li>
              );
            })}
          </ol>
        )}
      </AdminCard>
    </div>
  );
}
