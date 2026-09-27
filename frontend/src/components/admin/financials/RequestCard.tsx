'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Notice, RoleBadge } from '@/components/admin/ui';
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CheckIcon,
  ClockIcon,
  CloseIcon,
} from '@/components/ui/Icons';
import { api, userMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDate } from '@/lib/format';
import type { FinancialRequest } from '@/lib/types';
import { ReceiptViewer } from './ReceiptViewer';

const STATUS_STYLES: Record<FinancialRequest['status'], string> = {
  PENDING: 'bg-black/[0.04] text-ink',
  COMPLETED: 'bg-black text-gold',
  REJECTED: 'bg-dangerSoft/10 text-dangerSoft',
};

/** One deposit or withdrawal in the Financials queue. */
export function RequestCard({
  request,
  onReviewed,
}: {
  request: FinancialRequest;
  onReviewed: (id: string) => void;
}) {
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState(false);
  const isDeposit = request.type === 'deposit';
  const Arrow = isDeposit ? ArrowUpRightIcon : ArrowDownLeftIcon;

  const review = async (decision: 'approve' | 'reject') => {
    setBusy(decision);
    setError(null);
    try {
      await api.admin.reviewTransaction(request.id, decision);
      onReviewed(request.id);
    } catch (err) {
      setError(userMessage(err, 'Could not update this request.'));
      setBusy(null);
    }
  };

  return (
    <article className="rounded-[32px] border border-black/[0.07] bg-white p-5 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.25)] sm:p-8">
      <header className="flex items-center gap-5">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-black text-gold sm:h-[72px] sm:w-[72px]">
          <Arrow className="h-7 w-7" />
        </span>
        <div className="min-w-0">
          <p className="flex min-w-0 flex-wrap items-baseline gap-x-2">
            <Link
              href={`/admin/members/${request.member.id}`}
              className="truncate text-[18px] font-black uppercase tracking-tight text-ink hover:underline sm:text-[20px]"
            >
              {request.member.displayName}
            </Link>
            <span className="truncate text-[12px] font-bold uppercase tracking-[0.12em] text-subtle">
              • {request.member.email}
            </span>
          </p>
          {request.member.role === 'sub_admin' && (
            <p className="mt-2">
              <RoleBadge role="sub_admin" />
              <span className="ml-2 text-[12px] font-bold uppercase tracking-[0.12em] text-subtle">
                Own balance request
              </span>
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 text-[13px] font-bold tracking-[0.1em] text-subtle">
              <ClockIcon className="h-4 w-4" />
              {formatDate(request.createdAt)}
            </span>
            <span
              className={cn(
                'rounded-lg px-3 py-1 text-[12px] font-extrabold uppercase tracking-[0.14em]',
                STATUS_STYLES[request.status]
              )}
            >
              {request.status}
            </span>
          </div>
        </div>
      </header>

      <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.16em] text-subtle">Amount</p>
      <p className="mt-1 text-[28px] font-black tracking-tight text-ink sm:text-[32px]">
        {formatCurrency(request.amount)}
      </p>

      {request.status === 'PENDING' && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => review('approve')}
            className="flex items-center justify-center gap-3 rounded-2xl bg-black px-6 py-4 text-[13px] font-extrabold uppercase tracking-[0.16em] text-gold shadow-[0_14px_28px_-16px_rgba(0,0,0,0.9)] transition-colors hover:bg-black/85 disabled:opacity-60"
          >
            {busy === 'approve' ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <CheckIcon className="h-5 w-5" />
            )}
            Approve
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => review('reject')}
            className="flex items-center justify-center gap-3 rounded-2xl border border-black/[0.05] bg-[#fafafa] px-6 py-4 text-[13px] font-extrabold uppercase tracking-[0.16em] text-subtle transition-colors hover:text-dangerSoft disabled:opacity-60"
          >
            {busy === 'reject' ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <CloseIcon className="h-5 w-5" />
            )}
            Reject
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      <div className="mt-6 rounded-3xl border border-black/[0.05] bg-[#fafafa] p-5 sm:p-7">
        <dl className="flex flex-wrap gap-x-10 gap-y-5">
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-subtle">Coin</dt>
            <dd className="mt-2 text-[17px] font-black text-ink">{request.coin ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-subtle">Network</dt>
            <dd className="mt-2">
              <span className="rounded-lg bg-black/[0.07] px-2.5 py-1 font-mono text-[12px] font-bold tracking-[0.1em] text-ink/70">
                {request.network ?? '—'}
              </span>
            </dd>
          </div>
          <div className="min-w-0 flex-1 basis-64">
            <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-subtle">
              {isDeposit ? 'Receipt wallet address' : 'Destination wallet address'}
            </dt>
            <dd className="mt-2 break-all font-mono text-[14px] font-semibold text-ink sm:text-[15px]">
              {request.address ?? '—'}
            </dd>
          </div>
        </dl>

        {request.hasReceipt && (
          <button
            type="button"
            onClick={() => setViewing(true)}
            className="mt-6 rounded-2xl bg-[#1c1c1c] px-7 py-4 text-[12px] font-extrabold uppercase tracking-[0.16em] text-gold transition-colors hover:bg-black"
          >
            View screenshot
          </button>
        )}
      </div>

      {viewing && <ReceiptViewer entry={request} onClose={() => setViewing(false)} />}
    </article>
  );
}
