'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { PlanFormModal } from '@/components/admin/plans/PlanFormModal';
import { AdminButton, AdminPageHeader, Notice } from '@/components/admin/ui';
import { EditIcon, PlusIcon, ShieldIcon, TrashIcon } from '@/components/ui/Icons';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { useApi } from '@/hooks/useApi';
import { api, userMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { Plan } from '@/lib/types';

/** Dialog state: closed, adding, or editing a plan. */
type Editor = { open: false } | { open: true; plan: Plan | null };

const fetchPlans = () => api.admin.plans();

export default function PlansPage() {
  const { data, loading, error, refetch } = useApi<Plan[]>(fetchPlans);

  const [editor, setEditor] = useState<Editor>({ open: false });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const closeEditor = useCallback(() => setEditor({ open: false }), []);

  const remove = async (plan: Plan) => {
    if (
      !window.confirm(
        `Delete “${plan.name}”? Members can no longer activate it; existing contracts are unaffected.`
      )
    ) {
      return;
    }
    setDeletingId(plan.id);
    setActionError(null);
    try {
      await api.admin.deletePlan(plan.id);
      await refetch();
    } catch (err) {
      setActionError(userMessage(err, 'Could not delete this plan.'));
    } finally {
      setDeletingId(null);
    }
  };

  const plans = data ?? [];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Plans"
        subtitle="Manage investment tiers and strategic assets"
        actions={
          <AdminButton
            onClick={() => setEditor({ open: true, plan: null })}
            icon={<PlusIcon className="h-5 w-5" />}
            className="py-4"
          >
            Add plan
          </AdminButton>
        }
      />

      {actionError && <Notice tone="error">{actionError}</Notice>}

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : loading && !data ? (
        <PlanGrid>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[440px] rounded-[36px]" />
          ))}
        </PlanGrid>
      ) : plans.length === 0 ? (
        <EmptyState
          className="border-black/10"
          title="No plans yet."
          hint="Add one to make it available for members to activate."
        />
      ) : (
        <PlanGrid>
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              deleting={deletingId === plan.id}
              onEdit={() => setEditor({ open: true, plan })}
              onDelete={() => remove(plan)}
            />
          ))}
        </PlanGrid>
      )}

      <PlanFormModal
        open={editor.open}
        plan={editor.open ? editor.plan : null}
        onClose={closeEditor}
        onSaved={() => {
          closeEditor();
          refetch();
        }}
      />
    </div>
  );
}

function PlanGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 xl:gap-8">{children}</div>;
}

function PlanCard({
  plan,
  deleting,
  onEdit,
  onDelete,
}: {
  plan: Plan;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-[36px] border border-black/[0.07] bg-white shadow-[0_18px_40px_-28px_rgba(0,0,0,0.25)]">
      <div className="relative aspect-[16/9] bg-[#f7f7f7]">
        {plan.image ? (
          // Plain <img>: admins paste images from any host, which next/image won't allow.
          <img
            src={plan.image}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-black/15">
            <ShieldIcon className="h-16 w-16" />
          </div>
        )}
        {plan.tag && (
          <span className="absolute right-6 top-6 rounded-full bg-gold px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-ink shadow-[0_6px_16px_-8px_rgba(0,0,0,0.5)]">
            {plan.tag}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-8 pb-9 pt-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 title={plan.name} className="truncate text-[19px] font-black uppercase tracking-tight text-ink">
              {plan.name}
            </h2>
            <p className="mt-1 font-mono text-[13px] font-bold uppercase tracking-[0.12em] text-gold">
              {formatCurrency(plan.price)} USDT
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit ${plan.name}`}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-black/[0.06] bg-[#f7f7f7] text-muted transition-colors hover:bg-black/[0.06] hover:text-ink"
            >
              <EditIcon className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              aria-label={`Delete ${plan.name}`}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-dangerSoft/10 text-dangerSoft transition-colors hover:bg-dangerSoft/20 disabled:opacity-50"
            >
              {deleting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <TrashIcon className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>
        </div>
        {plan.description && (
          <p className="mt-5 text-[14px] leading-relaxed text-muted">{plan.description}</p>
        )}
      </div>
    </article>
  );
}
