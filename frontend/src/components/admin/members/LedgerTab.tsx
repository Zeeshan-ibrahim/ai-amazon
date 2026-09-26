'use client';

import { useCallback, useState, type FormEvent } from 'react';
import { ReceiptViewer } from '@/components/admin/financials/ReceiptViewer';
import { AdminButton, AdminCard, AdminInput, Notice, PicturesNeeded } from '@/components/admin/ui';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/States';
import { useApi } from '@/hooks/useApi';
import { api, userMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDateTime, formatSignedCurrency } from '@/lib/format';
import type { LedgerEntry, Member } from '@/lib/types';

const TYPE_LABELS: Record<LedgerEntry['type'], string> = {
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
  adjustment: 'Adjustment',
  order_purchase: 'Order purchase',
  order_sale: 'Order sale',
};

export function LedgerTab({
  member,
  onBalanceChange,
}: {
  member: Member;
  onBalanceChange: () => void;
}) {
  const fetcher = useCallback(() => api.admin.transactions(member.id), [member.id]);
  const { data, loading, error, refetch } = useApi<LedgerEntry[]>(fetcher);

  const changed = async () => {
    await refetch();
    onBalanceChange();
  };

  const entries = data ?? [];
  const approvedDeposits = entries
    .filter((e) => e.type === 'deposit' && e.status === 'COMPLETED')
    .reduce((sum, e) => sum + e.amount, 0);
  const pending = entries.filter((e) => e.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      <PicturesNeeded what="Ledger tab" />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Current balance" value={formatCurrency(member.balance)} />
        <Stat label="Approved deposits" value={formatCurrency(approvedDeposits)} />
        <Stat label="Pending review" value={String(pending)} highlight={pending > 0} />
      </div>

      <AdjustBalanceForm memberId={member.id} onDone={changed} />

      <AdminCard>
        <h2 className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-subtle">
          Transactions
        </h2>
        {!member.hasApprovedDeposit && member.role === 'user' && (
          <div className="mt-4">
            <Notice tone="warn">
              Approving this member&apos;s first deposit makes their assigned contracts visible to them.
            </Notice>
          </div>
        )}
        <div className="mt-4">
          {loading && !data ? (
            <LoadingBlock rows={2} />
          ) : error ? (
            <ErrorState message={error} onRetry={refetch} />
          ) : entries.length === 0 ? (
            <EmptyState title="No transactions yet." />
          ) : (
            <ul className="divide-y divide-black/[0.06]">
              {entries.map((entry) => (
                <EntryRow key={entry.id} entry={entry} onReviewed={changed} />
              ))}
            </ul>
          )}
        </div>
      </AdminCard>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-3xl border bg-white p-5',
        highlight ? 'border-gold/60 shadow-[0_10px_28px_-18px_rgba(217,180,90,0.9)]' : 'border-black/[0.07]'
      )}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-subtle">{label}</p>
      <p className="mt-2 font-mono text-[22px] font-bold text-ink">{value}</p>
    </div>
  );
}

function AdjustBalanceForm({ memberId, onDone }: { memberId: string; onDone: () => Promise<void> }) {
  const [direction, setDirection] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setResult(null);
    try {
      await api.admin.adjustBalance(memberId, { direction, amount: Number(amount), note });
      setAmount('');
      setNote('');
      setResult({ tone: 'success', text: `${direction === 'credit' ? 'Credited' : 'Debited'} ${formatCurrency(Number(amount))}.` });
      await onDone();
    } catch (err) {
      setResult({ tone: 'error', text: userMessage(err, 'Could not adjust the balance.') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminCard>
      <h2 className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-subtle">
        Adjust balance
      </h2>
      <p className="mt-1 text-[13px] text-muted">
        Applies immediately. Adjustments don&apos;t count as deposits.
      </p>
      <form onSubmit={onSubmit} className="mt-5 space-y-5" noValidate>
        <div className="inline-flex rounded-2xl bg-black/[0.04] p-1">
          {(['credit', 'debit'] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={direction === d}
              onClick={() => setDirection(d)}
              className={cn(
                'rounded-xl px-6 py-2.5 text-[12px] font-extrabold uppercase tracking-[0.14em] transition-colors',
                direction === d ? 'bg-black text-gold' : 'text-ink/60 hover:text-ink'
              )}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <AdminInput
            label="Amount (USD)"
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <AdminInput
            label="Internal note (optional)"
            placeholder="Visible to admins only"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        {result && <Notice tone={result.tone}>{result.text}</Notice>}
        <AdminButton type="submit" loading={saving} disabled={!(Number(amount) > 0)}>
          Apply {direction}
        </AdminButton>
      </form>
    </AdminCard>
  );
}

function EntryRow({ entry, onReviewed }: { entry: LedgerEntry; onReviewed: () => Promise<void> }) {
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [viewing, setViewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reviewable = entry.status === 'PENDING' && entry.type !== 'adjustment';

  const review = async (decision: 'approve' | 'reject') => {
    setBusy(decision);
    setError(null);
    try {
      await api.admin.reviewTransaction(entry.id, decision);
      await onReviewed();
    } catch (err) {
      setError(userMessage(err, 'Could not update this transaction.'));
      setBusy(null);
    }
  };

  const isOrder = entry.type === 'order_purchase' || entry.type === 'order_sale';
  const meta = [
    isOrder && entry.title,
    [entry.coin, entry.network].filter(Boolean).join(' '),
    entry.address,
    entry.note && `Note: ${entry.note}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <li className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-[15px] font-black uppercase tracking-tight text-ink">
          {TYPE_LABELS[entry.type]}
        </p>
        <p className="mt-0.5 text-[12px] text-subtle">{formatDateTime(entry.createdAt)}</p>
        {meta && <p className="mt-1 break-all text-[12px] text-muted">{meta}</p>}
        {entry.hasReceipt && (
          <button
            type="button"
            onClick={() => setViewing(true)}
            className="mt-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink underline underline-offset-4"
          >
            View screenshot
          </button>
        )}
        {error && <p className="mt-2 text-[12px] font-medium text-dangerSoft">{error}</p>}
        {viewing && <ReceiptViewer entry={entry} onClose={() => setViewing(false)} />}
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <div className="text-right">
          <p
            className={cn(
              'font-mono text-[16px] font-bold',
              entry.direction === 'credit' ? 'text-money' : 'text-ink'
            )}
          >
            {formatSignedCurrency(entry.amount, entry.direction)}
          </p>
          <StatusPill status={entry.status} />
        </div>
        {reviewable && (
          <div className="flex gap-2">
            <AdminButton size="sm" variant="success" loading={busy === 'approve'} disabled={busy !== null} onClick={() => review('approve')}>
              Approve
            </AdminButton>
            <AdminButton size="sm" variant="danger" loading={busy === 'reject'} disabled={busy !== null} onClick={() => review('reject')}>
              Reject
            </AdminButton>
          </div>
        )}
      </div>
    </li>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'mt-1 inline-block text-[10px] font-extrabold uppercase tracking-[0.14em]',
        status === 'COMPLETED' && 'text-money',
        status === 'REJECTED' && 'text-dangerSoft',
        status === 'PENDING' && 'text-[#b08a2e]'
      )}
    >
      {status}
    </span>
  );
}
