import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/format';

/** Available balance + completed order count. */
export function BalanceSummary({
  balance,
  completed,
}: {
  balance: number;
  completed: number;
}) {
  return (
    <Card tone="muted" className="flex items-center justify-between gap-6">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-subtle">
          Available balance
        </p>
        <p className="tabular mt-1.5 text-2xl font-medium tracking-tight text-ink sm:text-[28px]">
          {formatCurrency(balance)}
        </p>
      </div>

      <div className="text-right lg:text-left">
        <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-subtle">
          Completed
        </p>
        <p className="tabular mt-1.5 text-2xl font-medium tracking-tight text-ink sm:text-[28px]">
          {completed}
        </p>
      </div>
    </Card>
  );
}
