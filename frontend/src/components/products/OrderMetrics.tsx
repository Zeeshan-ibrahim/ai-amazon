import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/cn';

/** Desktop-only side panel summarising the active order's funding gap. */
export function OrderMetrics({
  required,
  current,
  missing,
}: {
  required: number;
  current: number;
  missing: number;
}) {
  const rows = [
    { label: 'Required balance', value: formatCurrency(required) },
    { label: 'Current balance', value: formatCurrency(current) },
    ...(missing > 0
      ? [
          {
            label: 'Additional needed',
            value: formatCurrency(missing),
            tone: 'text-dangerSoft',
            labelTone: 'text-dangerSoft',
          },
        ]
      : []),
  ];

  return (
    <div className="rounded-card border border-line bg-white px-5 shadow-card">
      <dl className="divide-y divide-line">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between py-4">
            <dt
              className={cn(
                'text-[10px] font-medium uppercase tracking-[0.13em]',
                row.labelTone ?? 'text-subtle'
              )}
            >
              {row.label}
            </dt>
            <dd className={cn('tabular text-[17px] font-medium', row.tone ?? 'text-ink')}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
