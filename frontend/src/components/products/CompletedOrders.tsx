import Image from 'next/image';
import { Badge } from '@/components/ui/Badge';
import { BoxIcon } from '@/components/ui/Icons';
import { formatCurrency, formatDate, formatPercent } from '@/lib/format';
import type { Product } from '@/lib/types';

/** Sold orders, newest first. */
export function CompletedOrders({ items }: { items: Product[] }) {
  const sorted = [...items].sort(
    (a, b) =>
      new Date(b.completedDate ?? b.assignedDate).getTime() -
      new Date(a.completedDate ?? a.assignedDate).getTime()
  );

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-white shadow-card">
      {sorted.map((order) => (
        <li key={order.id} className="flex items-center gap-4 px-4 py-4 sm:px-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-cream">
            {order.image ? (
              <Image
                src={order.image}
                alt={order.name}
                width={56}
                height={56}
                className="h-12 w-12 object-contain mix-blend-multiply"
              />
            ) : (
              <BoxIcon className="h-6 w-6 text-subtle" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium text-ink">{order.name}</p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-subtle">
              {order.completedDate
                ? `Completed ${formatDate(order.completedDate)}`
                : `Assigned ${formatDate(order.assignedDate)}`}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="tabular text-[14px] font-medium text-ink">
              {formatCurrency(order.totalReturn)}
            </p>
            <p className="tabular mt-1 text-[12px] font-medium text-money">
              +{formatCurrency(order.expectedProfit)} · {formatPercent(order.profitPercentage)}
            </p>
          </div>

          <Badge tone="green" className="hidden sm:inline-flex">
            Completed
          </Badge>
        </li>
      ))}
    </ul>
  );
}
