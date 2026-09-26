'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { AdminButton, Notice } from '@/components/admin/ui';
import { BoxIcon, CheckIcon, ClockIcon, EditIcon, TrashIcon } from '@/components/ui/Icons';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { useApi } from '@/hooks/useApi';
import { api, userMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDateTime, orderReturn } from '@/lib/format';
import type { AdminOrder, AdminOrderEdit, Member, OrderStatus } from '@/lib/types';

const STATUS_ORDER: OrderStatus[] = ['assigned', 'purchased', 'completed'];

const STATUS_OPTIONS: Record<OrderStatus, string> = {
  assigned: 'Assigned / Awaiting purchase',
  purchased: 'Purchased / Awaiting sale',
  completed: 'Completed / Sold',
};

const STATUS_BADGES: Record<OrderStatus, { label: string; className: string }> = {
  assigned: { label: 'Assigned', className: 'border-gold/40 bg-gold/10 text-[#8a6d1f]' },
  purchased: { label: 'Purchased', className: 'border-black/15 bg-black/[0.04] text-ink' },
  completed: { label: 'Completed', className: 'border-blue-200 bg-blue-50 text-blue-700' },
};

/**
 * The member's orders with the admin's Custom Edit panel. The API enforces
 * the rules; the panel only offers what it will accept (price until purchase,
 * profit until sale, status forward only).
 */
export function AssignedOrders({
  member,
  reloadKey,
  onReleased,
  onBalanceChange,
}: {
  member: Member;
  /** Bump to refetch after a new assignment. */
  reloadKey: number;
  /** A product is free to assign again (its order was removed or sold). */
  onReleased: (productId: string) => void;
  onBalanceChange: () => void;
}) {
  const fetcher = useCallback(
    () => api.admin.orders(member.id),
    [member.id, reloadKey]
  );
  const { data: orders, loading, error, refetch, setData } = useApi<AdminOrder[]>(fetcher);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const replace = (next: AdminOrder) =>
    setData((orders ?? []).map((o) => (o.id === next.id ? next : o)));

  const remove = async (order: AdminOrder) => {
    if (!window.confirm(`Remove “${order.title}” from this member?`)) return;
    setRemovingId(order.id);
    setActionError(null);
    try {
      await api.admin.removeOrder(member.id, order.id);
      setData((orders ?? []).filter((o) => o.id !== order.id));
      onReleased(order.productId);
    } catch (err) {
      setActionError(userMessage(err, 'Could not remove this contract.'));
    } finally {
      setRemovingId(null);
    }
  };

  const list = orders ?? [];
  const totals = list.reduce(
    (sum, o) => ({ price: sum.price + o.price, profit: sum.profit + o.profit }),
    { price: 0, profit: 0 }
  );
  const open = list.filter((o) => o.status !== 'completed').length;

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-2 gap-5 rounded-[24px] border-2 border-ink p-5 sm:grid-cols-4">
        <Summary label="Assigned count" value={`${list.length} contracts`} hint={`${open} open`} />
        <Summary label="Allocated capital" value={formatCurrency(totals.price)} />
        <Summary label="Projected profit" value={`+${formatCurrency(totals.profit)}`} money />
        <Summary label="Total realizable" value={formatCurrency(totals.price + totals.profit)} />
      </div>

      {actionError && <Notice tone="error">{actionError}</Notice>}

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : loading && !orders ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-3xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState title="No contracts assigned to this member yet." />
      ) : (
        <ul className="space-y-5">
          {list.map((order) => (
            <OrderItem
              key={order.id}
              order={order}
              editing={editingId === order.id}
              removing={removingId === order.id}
              onEdit={() => setEditingId(editingId === order.id ? null : order.id)}
              onRemove={() => remove(order)}
              onSave={async (edit) => {
                const next = await api.admin.updateOrder(member.id, order.id, edit);
                replace(next);
                setEditingId(null);
                if (next.status !== order.status) {
                  onBalanceChange();
                  if (next.status === 'completed') onReleased(next.productId);
                }
              }}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function Summary({ label, value, hint, money }: { label: string; value: string; hint?: string; money?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-subtle">{label}</p>
      <p className={cn('mt-1 truncate text-[16px] font-black', money ? 'text-money' : 'text-ink')}>{value}</p>
      {hint && <p className="text-[11px] font-semibold text-subtle">{hint}</p>}
    </div>
  );
}

function OrderItem({
  order,
  editing,
  removing,
  onEdit,
  onRemove,
  onSave,
}: {
  order: AdminOrder;
  editing: boolean;
  removing: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onSave: (edit: AdminOrderEdit) => Promise<void>;
}) {
  const badge = STATUS_BADGES[order.status];
  const settled = order.status === 'completed';

  return (
    <li
      className={cn(
        'overflow-hidden rounded-3xl border bg-white',
        editing ? 'border-ink/20' : 'border-black/[0.08]',
        order.status !== 'completed' && 'border-l-4 border-l-blue-600'
      )}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-black/[0.06]">
            {order.image ? (
              <Image src={order.image} alt="" width={56} height={56} className="h-full w-full object-cover" />
            ) : (
              <BoxIcon className="h-6 w-6 text-subtle" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-black uppercase leading-snug tracking-tight text-ink">{order.title}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/70">
              <ClockIcon className="h-3.5 w-3.5" />
              Allocated: {formatDateTime(order.assignedAt)}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span
              className={cn(
                'rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em]',
                badge.className
              )}
            >
              {badge.label}
            </span>
            <div className="flex items-center gap-2">
              {!settled && (
                <AdminButton
                  size="sm"
                  variant={editing ? 'primary' : 'outline'}
                  icon={<EditIcon className="h-3.5 w-3.5" />}
                  onClick={onEdit}
                >
                  Custom edit
                </AdminButton>
              )}
              {order.status === 'assigned' && (
                <button
                  type="button"
                  onClick={onRemove}
                  disabled={removing}
                  aria-label={`Remove ${order.title}`}
                  className="rounded-xl border border-dangerSoft/30 p-2 text-dangerSoft transition-colors hover:bg-dangerSoft/10 disabled:opacity-50"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-4 rounded-2xl border border-black/[0.12] p-4 sm:grid-cols-4">
          <Metric label="Price amount" value={formatCurrency(order.price)} />
          <Metric label="Profit % margin" value={`+${order.profitPercentage}%`} />
          <Metric label="Calculated profit" value={`+${formatCurrency(order.profit)}`} money />
          <Metric label="Total net return" value={formatCurrency(order.totalReturn)} />
        </dl>
      </div>

      {editing && <EditPanel order={order} onCancel={onEdit} onSave={onSave} />}
    </li>
  );
}

function Metric({ label, value, money }: { label: string; value: string; money?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-subtle">{label}</dt>
      <dd className={cn('mt-1 truncate font-mono text-[14px] font-semibold', money ? 'text-money' : 'text-ink')}>
        {value}
      </dd>
    </div>
  );
}

function EditPanel({
  order,
  onCancel,
  onSave,
}: {
  order: AdminOrder;
  onCancel: () => void;
  onSave: (edit: AdminOrderEdit) => Promise<void>;
}) {
  const [price, setPrice] = useState(String(order.price));
  const [percent, setPercent] = useState(String(order.profitPercentage));
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceLocked = order.status !== 'assigned';
  const priceValue = Number(price);
  const percentValue = Number(percent);
  const valid = priceValue > 0 && percentValue >= 0 && percent.trim() !== '';
  const preview = valid ? orderReturn(priceValue, percentValue) : null;

  const edit: AdminOrderEdit = {};
  if (!priceLocked && priceValue !== order.price) edit.price = priceValue;
  if (percentValue !== order.profitPercentage) edit.profitPercentage = percentValue;
  if (status !== order.status) edit.status = status;
  const changed = Object.keys(edit).length > 0;

  // What applying will do to the member's balance, step by step.
  const from = STATUS_ORDER.indexOf(order.status);
  const to = STATUS_ORDER.indexOf(status);
  const debit = from < 1 && to >= 1 && preview ? priceValue : null;
  const credit = to === 2 && preview ? preview.total : null;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(edit);
    } catch (err) {
      setError(userMessage(err, 'Could not apply these changes.'));
      setSaving(false);
    }
  };

  return (
    <div className="border-t border-gold/40 bg-[#fdf6ea] p-5">
      <p className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-ink">Tuning financial metrics</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Stepper
          label="Product price ($)"
          value={price}
          onChange={setPrice}
          step={10}
          min={0.01}
          disabled={priceLocked}
          hint={priceLocked ? 'Locked — the member paid this price.' : undefined}
        />
        <Stepper label="Profit percentage (%)" value={percent} onChange={setPercent} step={0.01} min={0} />
        <label className="block">
          <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-subtle">Current status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-[13px] font-extrabold uppercase text-ink focus:border-black focus:outline-none"
          >
            {STATUS_ORDER.slice(from).map((s) => (
              <option key={s} value={s}>
                {STATUS_OPTIONS[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {(debit !== null || credit !== null) && (
        <p className="mt-4 rounded-xl bg-white/70 px-4 py-3 text-[12px] font-semibold text-ink/80">
          Applying settles this through the member’s ledger:
          {debit !== null && <> debits <b>{formatCurrency(debit)}</b> (purchase)</>}
          {debit !== null && credit !== null && ', then'}
          {credit !== null && <> credits <b>{formatCurrency(credit)}</b> (sale)</>}.
        </p>
      )}

      {error && (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-subtle">
          {preview ? (
            <>
              Calculated preview: profit is <span className="text-money">{formatCurrency(preview.profit)}</span> • total
              net is {formatCurrency(preview.total)}
            </>
          ) : (
            'Enter a price above $0 and a profit of 0% or more.'
          )}
        </p>
        <div className="flex shrink-0 gap-2">
          <AdminButton size="sm" variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </AdminButton>
          <AdminButton
            size="sm"
            loading={saving}
            disabled={!valid || !changed}
            icon={<CheckIcon className="h-4 w-4" />}
            onClick={save}
          >
            Apply changes
          </AdminButton>
        </div>
      </div>
    </div>
  );
}

function Stepper({
  label,
  value,
  onChange,
  step,
  min,
  disabled,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  step: number;
  min: number;
  disabled?: boolean;
  hint?: string;
}) {
  const bump = (dir: 1 | -1) => {
    const next = Math.max(min, (Number(value) || 0) + dir * step);
    onChange(String(Math.round(next * 1000) / 1000));
  };
  const btn =
    'px-3 text-[18px] font-semibold text-ink/60 transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40';
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-subtle">{label}</span>
      <span className="flex items-stretch rounded-xl border border-black/15 bg-white">
        <button type="button" className={btn} disabled={disabled} onClick={() => bump(-1)} aria-label="Decrease">
          −
        </button>
        <input
          type="number"
          inputMode="decimal"
          value={value}
          min={min}
          step={step}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 border-x border-black/10 bg-transparent px-3 py-2.5 font-mono text-[14px] font-semibold text-ink focus:outline-none disabled:opacity-60"
        />
        <button type="button" className={btn} disabled={disabled} onClick={() => bump(1)} aria-label="Increase">
          +
        </button>
      </span>
      {hint && <span className="mt-1.5 block text-[11px] text-subtle">{hint}</span>}
    </label>
  );
}
