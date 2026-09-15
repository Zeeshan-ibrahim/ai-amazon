'use client';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/format';
import type { Plan } from '@/lib/types';

export function PlanCard({
  plan,
  onActivate,
  activating,
}: {
  plan: Plan;
  onActivate: () => void;
  activating?: boolean;
}) {
  const rows = [
    { label: 'Investment', value: formatCurrency(plan.investment) },
    { label: 'Daily yield', value: `+${plan.dailyYield}%`, tone: 'text-money' },
    {
      label: 'Estimated yield',
      value: `+${formatCurrency(plan.estimatedYield)}`,
      tone: 'text-money',
    },
    { label: 'Total payout', value: formatCurrency(plan.totalPayout) },
  ];

  return (
    <article className="flex flex-col rounded-card border border-line bg-white p-5 shadow-card">
      <header className="flex items-start justify-between gap-3">
        <span className="text-[11px] tracking-[0.12em] text-subtle">
          {plan.index}
        </span>
        <Badge tone="outline">{plan.partner}</Badge>
      </header>

      <h3 className="mt-5 text-[22px] font-medium tracking-tight text-ink">
        {plan.name}
      </h3>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-subtle">
        {plan.cycleDays} days cycle length
      </p>

      <dl className="mt-5 divide-y divide-line border-t border-line">
        {rows.map((row) => (
          <div key={row.label} className="detail-row">
            <dt className="text-muted">{row.label}</dt>
            <dd className={`tabular font-medium ${row.tone ?? 'text-ink'}`}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-5 flex-1 text-[13px] leading-relaxed text-muted">
        {plan.description}
      </p>

      <Button
        size="lg"
        fullWidth
        className="mt-6"
        onClick={onActivate}
        loading={activating}
      >
        Submit activation contract
      </Button>
    </article>
  );
}
