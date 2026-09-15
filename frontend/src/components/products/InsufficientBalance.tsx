'use client';

import { Button } from '@/components/ui/Button';
import { AlertIcon } from '@/components/ui/Icons';
import { formatCurrency } from '@/lib/format';

type Props = {
  required: number;
  current: number;
  missing: number;
  onDeposit: () => void;
};

/** Desktop side panel — the required/current figures live in `OrderMetrics` above it. */
export function InsufficientPanel({
  missing,
  onDeposit,
}: Pick<Props, 'missing' | 'onDeposit'>) {
  return (
    <div className="rounded-card border border-dangerSoft/25 bg-dangerSoft/[0.04] p-5">
      <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-dangerSoft">
        Insufficient balance
      </p>
      <p className="mt-2.5 text-[15px] font-medium text-ink">
        Your current balance is insufficient to complete this order.
      </p>
      <p className="mt-1.5 text-[13px] text-muted">
        You are missing{' '}
        <span className="tabular font-medium text-dangerSoft">
          {formatCurrency(missing)}
        </span>
        . Please make a deposit to continue processing.
      </p>
      <Button variant="danger" size="lg" fullWidth className="mt-4" onClick={onDeposit}>
        Deposit now
      </Button>
    </div>
  );
}

/** Mobile banner version — shown above the order card. */
export function InsufficientBanner({ required, current, missing, onDeposit }: Props) {
  return (
    <div className="rounded-card border border-dangerSoft/25 bg-dangerSoft/[0.04] p-4">
      <p className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.13em] text-dangerSoft">
        <AlertIcon className="h-4 w-4" />
        Insufficient balance
      </p>
      <p className="mt-2 text-[13px] text-muted">
        Your current balance is insufficient to complete this order. You are
        missing{' '}
        <span className="tabular font-medium text-dangerSoft">
          {formatCurrency(missing)}
        </span>
        . Please make a deposit to continue processing.
      </p>

      <div className="mt-3.5 grid grid-cols-3 gap-2 border-t border-dangerSoft/15 pt-3.5">
        {[
          { label: 'Required', value: formatCurrency(required), tone: 'text-ink' },
          { label: 'Current', value: formatCurrency(current), tone: 'text-ink' },
          { label: 'Needed', value: formatCurrency(missing), tone: 'text-dangerSoft' },
        ].map((cell) => (
          <div key={cell.label}>
            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-subtle">
              {cell.label}
            </p>
            <p className={`tabular mt-1 text-[13px] font-medium ${cell.tone}`}>
              {cell.value}
            </p>
          </div>
        ))}
      </div>

      <Button variant="danger" size="md" fullWidth className="mt-3.5" onClick={onDeposit}>
        Deposit now
      </Button>
    </div>
  );
}
