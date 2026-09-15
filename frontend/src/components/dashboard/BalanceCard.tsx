'use client';

import { Button } from '@/components/ui/Button';
import { ShieldIcon } from '@/components/ui/Icons';
import { splitCurrency } from '@/lib/format';

export function BalanceCard({
  balance,
  onDeposit,
  onWithdraw,
}: {
  balance: number;
  onDeposit: () => void;
  onWithdraw: () => void;
}) {
  const { whole, decimals } = splitCurrency(balance);

  return (
    <section className="relative overflow-hidden rounded-card bg-balance-veil p-5 text-white shadow-panel sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 text-brand-300">
          <ShieldIcon className="h-4 w-4" />
          <span className="text-[11px] font-medium uppercase tracking-[0.1em]">
            Insured Capital Reserves
          </span>
        </div>
        <span className="shrink-0 rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-white/70">
          USD Ledger
        </span>
      </div>

      <p className="text-[13px] text-white/60">Total Available Balance</p>

      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="text-2xl font-medium text-brand-400">$</span>
        <span className="tabular text-[44px] font-medium leading-none tracking-tight sm:text-[52px]">
          {whole}.{decimals}
        </span>
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button variant="light" size="lg" onClick={onDeposit}>
          Deposit Funds
        </Button>
        <Button variant="secondary" size="lg" onClick={onWithdraw}>
          Withdraw USD
        </Button>
      </div>
    </section>
  );
}
