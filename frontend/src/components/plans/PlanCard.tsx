'use client';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PlanIcon } from '@/components/ui/Icons';
import { formatCurrency } from '@/lib/format';
import type { Plan } from '@/lib/types';

export function PlanCard({
  plan,
  balance,
  pending,
  onActivate,
  activating,
}: {
  plan: Plan;
  /** The trader's available balance; decides whether the plan can be activated. */
  balance: number;
  /** True while this plan already has a pending request. */
  pending?: boolean;
  onActivate: () => void;
  activating?: boolean;
}) {
  const missing = Math.max(plan.price - balance, 0);
  const affordable = missing === 0;

  return (
    <article className="flex flex-col overflow-hidden rounded-card border border-line bg-white shadow-card">
      <div className="relative aspect-[16/9] bg-black/[0.03]">
        {plan.image ? (
          // Plain <img>: admins paste plan images from any host.
          <img
            src={plan.image}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-black/15">
            <PlanIcon className="h-12 w-12" />
          </div>
        )}
        {plan.tag && (
          <Badge tone="outline" className="absolute right-3 top-3">
            {plan.tag}
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[20px] font-medium tracking-tight text-ink">{plan.name}</h3>
        <p className="tabular mt-1 text-[15px] font-medium text-money">
          {formatCurrency(plan.price)} <span className="text-[11px] tracking-[0.1em]">USDT</span>
        </p>

        {plan.description && (
          <p className="mt-4 flex-1 text-[13px] leading-relaxed text-muted">{plan.description}</p>
        )}

        <Button
          size="lg"
          fullWidth
          className="mt-6"
          onClick={onActivate}
          loading={activating}
          disabled={!affordable || pending}
        >
          {pending ? 'Activation pending' : 'Activate plan'}
        </Button>
        {!affordable && !pending && (
          <p className="mt-2.5 text-center text-[12px] text-subtle">
            Add {formatCurrency(missing)} to your balance to activate.
          </p>
        )}
      </div>
    </article>
  );
}
