'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDate, formatPercent } from '@/lib/format';
import type { Product } from '@/lib/types';

type Row = { label: string; value: string; tone?: string; emphasis?: boolean };

export function OrderCard({
  product,
  balance,
  position,
  total,
  onPurchase,
  purchasing,
}: {
  product: Product;
  balance: number;
  position: number;
  total: number;
  onPurchase: () => void;
  purchasing?: boolean;
}) {
  const missing = Math.max(0, +(product.amount - balance).toFixed(2));

  const rows: Row[] = [
    { label: 'Product amount', value: formatCurrency(product.amount), emphasis: true },
    { label: 'Current balance', value: formatCurrency(balance) },
    { label: 'Required balance', value: formatCurrency(product.amount) },
    ...(missing > 0
      ? [
          {
            label: 'Additional deposit needed',
            value: formatCurrency(missing),
            tone: 'text-dangerSoft',
          },
        ]
      : []),
    {
      label: 'Profit percentage',
      value: formatPercent(product.profitPercentage),
      tone: 'text-money',
    },
    {
      label: 'Expected profit',
      value: `+${formatCurrency(product.expectedProfit)}`,
      tone: 'text-money',
    },
  ];

  return (
    <article className="overflow-hidden rounded-card border border-line bg-white shadow-card">
      <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-subtle">
          Active order queue
        </p>
        <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-brand-600">
          Active task {position} of {total}
        </p>
      </header>

      <div className="flex items-center justify-center bg-white px-6 py-8">
        <Image
          src={product.image}
          alt={product.name}
          width={420}
          height={420}
          className="h-[220px] w-auto object-contain mix-blend-multiply sm:h-[300px]"
        />
      </div>

      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-brand-600">
          Available order
        </p>
        <h3 className="mt-2.5 text-xl font-medium leading-snug tracking-tight text-ink sm:text-[22px]">
          {product.name}
        </h3>
        <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-subtle">
          Assigned date: {formatDate(product.assignedDate)}
        </p>

        <dl className="mt-5 divide-y divide-line border-t border-line">
          {rows.map((row) => (
            <div key={row.label} className="detail-row">
              <dt className="text-muted">{row.label}</dt>
              <dd
                className={cn(
                  'tabular font-medium',
                  row.tone ?? 'text-ink',
                  row.emphasis && 'text-ink'
                )}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-1 flex items-center justify-between border-t-2 border-ink/80 py-3.5">
          <span className="text-[15px] font-medium text-ink sm:text-base">
            Total return
          </span>
          <span className="tabular text-xl font-medium tracking-tight text-ink sm:text-[22px]">
            {formatCurrency(product.totalReturn)}
          </span>
        </div>

        <Button
          size="lg"
          fullWidth
          className="mt-2"
          onClick={onPurchase}
          loading={purchasing}
        >
          Purchase now
        </Button>
      </div>
    </article>
  );
}
