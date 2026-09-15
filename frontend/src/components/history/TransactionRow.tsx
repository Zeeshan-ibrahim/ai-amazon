import { cn } from '@/lib/cn';
import { formatDateTime, formatSignedCurrency } from '@/lib/format';
import type { Transaction } from '@/lib/types';

export function TransactionRow({ transaction }: { transaction: Transaction }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-5 last:border-b-0">
      <div className="min-w-0">
        <p className="text-[14px] font-medium leading-snug text-ink sm:text-[15px]">
          {transaction.title}
        </p>
        <p className="mt-1 text-[12px] text-subtle">
          {formatDateTime(transaction.createdAt)}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-subtle">
          {transaction.status}
        </p>
        <p
          className={cn(
            'tabular mt-1 text-[14px] font-medium sm:text-[15px]',
            transaction.direction === 'credit' ? 'text-money' : 'text-ink'
          )}
        >
          {formatSignedCurrency(transaction.amount, transaction.direction)}
        </p>
      </div>
    </div>
  );
}
