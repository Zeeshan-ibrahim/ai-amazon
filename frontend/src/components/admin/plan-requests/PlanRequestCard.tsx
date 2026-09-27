'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Notice } from '@/components/admin/ui';
import { CheckIcon, ClockIcon, CloseIcon, ShieldIcon } from '@/components/ui/Icons';
import { api, userMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import type { PlanRequest } from '@/lib/types';

const STATUS_STYLES: Record<PlanRequest['status'], string> = {
  PENDING: 'bg-black/[0.04] text-ink',
  ACTIVE: 'bg-black text-gold',
  REJECTED: 'bg-dangerSoft/10 text-dangerSoft',
};

/** One plan activation in the Plan Requests queue. */
export function PlanRequestCard({
  request,
  onReviewed,
}: {
  request: PlanRequest;
  onReviewed: (id: string) => void;
}) {
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const review = async (decision: 'approve' | 'reject') => {
    if (
      decision === 'reject' &&
      !window.confirm(`Reject this request? ${formatCurrency(request.price)} goes back to ${request.member.displayName}'s balance.`)
    ) {
      return;
    }
    setBusy(decision);
    setError(null);
    try {
      await api.admin.reviewPlanRequest(request.id, decision);
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
          <ShieldIcon className="h-7 w-7" />
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
        {formatCurrency(request.price)} <span className="text-[14px] tracking-[0.12em] text-subtle">USDT</span>
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

      <div className="mt-6 flex items-center gap-5 rounded-3xl border border-black/[0.05] bg-[#fafafa] p-5 sm:p-7">
        <div className="h-16 w-28 shrink-0 overflow-hidden rounded-2xl bg-black/[0.05]">
          {request.image ? (
            // Plain <img>: plan images come from any host.
            <img src={request.image} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-black/20">
              <ShieldIcon className="h-7 w-7" />
            </div>
          )}
        </div>
        <dl className="flex min-w-0 flex-1 flex-wrap gap-x-10 gap-y-4">
          <div className="min-w-0">
            <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-subtle">Plan</dt>
            <dd className="mt-2 truncate text-[17px] font-black uppercase tracking-tight text-ink">{request.planName}</dd>
          </div>
          {request.tag && (
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-subtle">Tag</dt>
              <dd className="mt-2">
                <span className="rounded-lg bg-gold px-2.5 py-1 text-[12px] font-black uppercase tracking-[0.12em] text-ink">
                  {request.tag}
                </span>
              </dd>
            </div>
          )}
          {request.reviewedAt && (
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-subtle">
                {request.status === 'REJECTED' ? 'Rejected · refunded' : 'Approved'}
              </dt>
              <dd className="mt-2 text-[14px] font-semibold text-ink">{formatDateTime(request.reviewedAt)}</dd>
            </div>
          )}
        </dl>
      </div>
    </article>
  );
}
