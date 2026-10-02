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
  PENDING: 'bg-black/5 text-muted',
  ACTIVE: 'bg-brand-50 text-brand-600',
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
    <article className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
      <header className="flex items-center gap-5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <ShieldIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="flex min-w-0 flex-wrap items-baseline gap-x-2">
            <Link
              href={`/admin/members/${request.member.id}`}
              className="truncate text-[17px] font-medium tracking-tight text-ink hover:underline"
            >
              {request.member.displayName}
            </Link>
            <span className="truncate text-[13px] text-subtle">
              • {request.member.email}
            </span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 text-[13px] text-subtle">
              <ClockIcon className="h-4 w-4" />
              {formatDate(request.createdAt)}
            </span>
            <span
              className={cn(
                'rounded-md px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em]',
                STATUS_STYLES[request.status]
              )}
            >
              {request.status}
            </span>
          </div>
        </div>
      </header>

      <p className="mt-6 text-[10px] font-medium uppercase tracking-[0.14em] text-subtle">Amount</p>
      <p className="mt-1 tabular text-[26px] font-medium tracking-tight text-ink sm:text-[28px]">
        {formatCurrency(request.price)} <span className="text-[14px] text-subtle">USDT</span>
      </p>

      {request.status === 'PENDING' && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => review('approve')}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-ink px-5 text-sm font-medium text-white transition-colors hover:bg-black/85 disabled:opacity-60"
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
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-white px-5 text-sm font-medium text-muted transition-colors hover:border-dangerSoft/30 hover:text-dangerSoft disabled:opacity-60"
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

      <div className="mt-6 flex items-center gap-5 rounded-xl bg-[#F4F3EE] p-4 sm:p-5">
        <div className="h-16 w-28 shrink-0 overflow-hidden rounded-xl bg-black/[0.05]">
          {request.image ? (
            // Plain <img>: plan images come from any host.
            <img src={request.image} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-black/20">
              <ShieldIcon className="h-5 w-5" />
            </div>
          )}
        </div>
        <dl className="flex min-w-0 flex-1 flex-wrap gap-x-10 gap-y-4">
          <div className="min-w-0">
            <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-subtle">Plan</dt>
            <dd className="mt-2 truncate text-[17px] font-medium tracking-tight text-ink">{request.planName}</dd>
          </div>
          {request.tag && (
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-subtle">Tag</dt>
              <dd className="mt-2">
                <span className="rounded-md bg-brand-500 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-white">
                  {request.tag}
                </span>
              </dd>
            </div>
          )}
          {request.reviewedAt && (
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-subtle">
                {request.status === 'REJECTED' ? 'Rejected · refunded' : 'Approved'}
              </dt>
              <dd className="mt-2 text-[14px] font-medium text-ink">{formatDateTime(request.reviewedAt)}</dd>
            </div>
          )}
        </dl>
      </div>
    </article>
  );
}
