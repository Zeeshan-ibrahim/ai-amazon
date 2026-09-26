'use client';

import { useCallback, useMemo, useState } from 'react';
import { useSession } from '@/components/layout/SessionProvider';
import { DepositModal } from '@/components/ledger/DepositModal';
import { WithdrawModal } from '@/components/ledger/WithdrawModal';
import { SubPageHeader } from '@/components/settings/SubPageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CheckIcon, CopyIcon } from '@/components/ui/Icons';
import { SegmentedControl } from '@/components/ui/Tabs';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/States';
import { useApi } from '@/hooks/useApi';
import { useCopy } from '@/hooks/useCopy';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDateTime, formatSignedCurrency } from '@/lib/format';
import type { Transaction } from '@/lib/types';

type Kind = 'deposit' | 'withdrawal';
type Status = Transaction['status'];

const COPY: Record<
  Kind,
  { title: string; description: string; action: string; empty: string; addressLabel: string }
> = {
  deposit: {
    title: 'Deposit records',
    description: 'Every deposit request and its review status.',
    action: 'New deposit',
    empty: 'No deposits yet.',
    addressLabel: 'Paid to',
  },
  withdrawal: {
    title: 'Withdrawal records',
    description: 'Every withdrawal request and its review status.',
    action: 'New withdrawal',
    empty: 'No withdrawals yet.',
    addressLabel: 'Sent to',
  },
};

const FILTERS: { id: 'all' | Status; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'REJECTED', label: 'Rejected' },
];

const STATUS_STYLE: Record<Status, string> = {
  PENDING: 'bg-gold/15 text-[#8A6A1F]',
  COMPLETED: 'bg-brand-50 text-brand-600',
  REJECTED: 'bg-dangerSoft/10 text-dangerSoft',
};

const fetchers: Record<Kind, () => Promise<Transaction[]>> = {
  deposit: () => api.transactions({ type: 'deposit' }),
  withdrawal: () => api.transactions({ type: 'withdrawal' }),
};

/** Deposit or withdrawal history for the signed-in trader, with a shortcut to file a new one. */
export function LedgerRecords({ kind }: { kind: Kind }) {
  const copy = COPY[kind];
  const { user, refresh } = useSession();
  const { data, loading, error, refetch } = useApi<Transaction[]>(fetchers[kind]);
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [modalOpen, setModalOpen] = useState(false);

  const onFiled = useCallback(async () => {
    await Promise.all([refetch(), refresh()]);
  }, [refetch, refresh]);

  const visible = useMemo(
    () => (data ?? []).filter((t) => filter === 'all' || t.status === filter),
    [data, filter]
  );

  const totals = useMemo(() => {
    const sum = (status: Status) =>
      (data ?? []).filter((t) => t.status === status).reduce((acc, t) => acc + t.amount, 0);
    return { completed: sum('COMPLETED'), pending: sum('PENDING') };
  }, [data]);

  return (
    <div className="space-y-6 lg:space-y-8">
      <SubPageHeader
        title={copy.title}
        description={copy.description}
        action={<Button onClick={() => setModalOpen(true)}>{copy.action}</Button>}
      />

      {loading ? (
        <LoadingBlock rows={3} />
      ) : error || !data ? (
        <ErrorState message={error ?? 'Records unavailable.'} onRetry={refetch} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:gap-5">
            <Card tone="muted">
              <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-subtle">
                {kind === 'deposit' ? 'Total deposited' : 'Total withdrawn'}
              </p>
              <p className="tabular mt-1.5 text-xl font-medium tracking-tight text-ink sm:text-2xl">
                {formatCurrency(totals.completed)}
              </p>
            </Card>
            <Card tone="muted">
              <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-subtle">
                Awaiting review
              </p>
              <p className="tabular mt-1.5 text-xl font-medium tracking-tight text-ink sm:text-2xl">
                {formatCurrency(totals.pending)}
              </p>
            </Card>
          </div>

          <SegmentedControl
            items={FILTERS}
            active={filter}
            onChange={(id) => setFilter(id as 'all' | Status)}
          />

          {visible.length === 0 ? (
            <EmptyState
              title={data.length === 0 ? copy.empty : 'No records match this filter.'}
              hint={
                data.length === 0
                  ? 'Requests appear here as soon as you submit them.'
                  : undefined
              }
            />
          ) : (
            <Card className="py-0">
              {visible.map((record) => (
                <RecordRow key={record.id} record={record} addressLabel={copy.addressLabel} />
              ))}
            </Card>
          )}
        </>
      )}

      {kind === 'deposit' ? (
        <DepositModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={onFiled} />
      ) : (
        <WithdrawModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          balance={user?.balance ?? 0}
          onSuccess={onFiled}
        />
      )}
    </div>
  );
}

function RecordRow({ record, addressLabel }: { record: Transaction; addressLabel: string }) {
  const { copied, copy } = useCopy();
  const network = [record.coin, record.network].filter(Boolean).join(' ');

  return (
    <div className="border-b border-line py-5 last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[14px] font-medium leading-snug text-ink sm:text-[15px]">
            {record.title}
          </p>
          <p className="mt-1 text-[12px] text-subtle">
            Requested {formatDateTime(record.createdAt)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p
            className={cn(
              'tabular text-[15px] font-medium',
              record.status === 'REJECTED'
                ? 'text-subtle line-through'
                : record.direction === 'credit'
                  ? 'text-money'
                  : 'text-ink'
            )}
          >
            {formatSignedCurrency(record.amount, record.direction)}
          </p>
          <Badge className={cn('mt-1.5', STATUS_STYLE[record.status])}>{record.status}</Badge>
        </div>
      </div>

      <dl className="mt-3 grid gap-1.5 text-[12px] sm:grid-cols-[auto_1fr] sm:gap-x-4">
        {network && (
          <>
            <dt className="text-subtle">Network</dt>
            <dd className="text-muted">{network}</dd>
          </>
        )}
        {record.address && (
          <>
            <dt className="text-subtle">{addressLabel}</dt>
            <dd className="flex min-w-0 items-center gap-2 text-muted">
              <span className="truncate font-mono text-[11px]">{record.address}</span>
              <button
                type="button"
                onClick={() => copy(record.address!)}
                aria-label="Copy address"
                className="shrink-0 text-subtle transition-colors hover:text-ink"
              >
                {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
              </button>
            </dd>
          </>
        )}
        {record.reviewedAt && (
          <>
            <dt className="text-subtle">{record.status === 'REJECTED' ? 'Rejected' : 'Approved'}</dt>
            <dd className="text-muted">{formatDateTime(record.reviewedAt)}</dd>
          </>
        )}
      </dl>
    </div>
  );
}
