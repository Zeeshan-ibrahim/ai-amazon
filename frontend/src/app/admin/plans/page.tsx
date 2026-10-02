'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { PlanFormModal } from '@/components/admin/plans/PlanFormModal';
import { AddedByBadge, AdminButton, AdminPageHeader, Notice } from '@/components/admin/ui';
import { useSession } from '@/components/layout/SessionProvider';
import { EditIcon, PlusIcon, ShieldIcon, TrashIcon } from '@/components/ui/Icons';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { useApi } from '@/hooks/useApi';
import { api, userMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { AdminPlan, Plan } from '@/lib/types';

/** Dialog state: closed, adding, or editing a plan. */
type Editor = { open: false } | { open: true; plan: Plan | null };

const fetchPlans = () => api.admin.plans();

export default function PlansPage() {
  const { data, loading, error, refetch } = useApi<AdminPlan[]>(fetchPlans);
  const { user } = useSession();
  const isSuperAdmin = user?.role === 'super_admin';

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
    <div className="space-y-6 lg:space-y-8">
      <AdminPageHeader
        title="Plans"
        subtitle={
          isSuperAdmin
            ? "Manage investment tiers — members see only their owner's plans"
            : 'Your plans — the only plans your members see'
        }
        actions={
          <AdminButton
            onClick={() => setEditor({ open: true, plan: null })}
            icon={<PlusIcon className="h-[18px] w-[18px]" />}
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
            <Skeleton key={i} className="h-[440px] rounded-card" />
          ))}
        </PlanGrid>
      ) : plans.length === 0 ? (
        <EmptyState
          title="No plans yet."
          hint="Add one to make it available for members to activate."
        />
      ) : (
        <PlanGrid>
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              showOwner={isSuperAdmin}
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
  return <div className="grid gap-4 md:grid-cols-2 lg:gap-5 xl:grid-cols-3">{children}</div>;
}

function PlanCard({
  plan,
  showOwner,
  deleting,
  onEdit,
  onDelete,
}: {
  plan: AdminPlan;
  showOwner: boolean;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-card border border-line bg-white shadow-card">
      <div className="relative aspect-[16/9] bg-cream">
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
            <ShieldIcon className="h-12 w-12" />
          </div>
        )}
        {showOwner && <AddedByBadge addedBy={plan.addedBy} className="absolute left-4 top-4" />}
        {plan.tag && (
          <span className="absolute right-4 top-4 rounded-md bg-brand-500 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-white">
            {plan.tag}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 title={plan.name} className="truncate text-lg font-medium tracking-tight text-ink">
              {plan.name}
            </h2>
            <p className="tabular mt-1 text-[13px] font-medium text-brand-600">
              {formatCurrency(plan.price)} USDT
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit ${plan.name}`}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white text-muted transition-colors hover:border-ink/25 hover:text-ink"
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
          <p className="mt-4 text-sm leading-relaxed text-muted">{plan.description}</p>
        )}
      </div>
    </article>
  );
}
