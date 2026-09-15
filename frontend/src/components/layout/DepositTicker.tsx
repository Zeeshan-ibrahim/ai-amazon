'use client';

import { useCallback } from 'react';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/format';
import type { LiveDeposit } from '@/lib/types';
import { ArrowDownIcon, ArrowUpRightIcon } from '@/components/ui/Icons';

function TickerItem({ deposit }: { deposit: LiveDeposit }) {
  return (
    <div className="flex shrink-0 items-center gap-2.5 px-4 sm:px-6">
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-brand-400/40 text-brand-300">
        <ArrowUpRightIcon className="hidden h-3 w-3 sm:block" />
        <ArrowDownIcon className="h-3 w-3 sm:hidden" />
      </span>
      <span className="whitespace-nowrap text-[12px] text-white/80 sm:text-[13px]">
        New Deposit:
      </span>
      <span className="whitespace-nowrap rounded-md bg-brand-500/20 px-2 py-0.5 text-[12px] font-medium text-brand-300 sm:text-[13px]">
        ${formatNumber(deposit.amount)}
      </span>
      <span className="hidden text-[10px] uppercase tracking-[0.12em] text-white/35 sm:inline">
        {deposit.status}
      </span>
      <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-brand-400" />
    </div>
  );
}

export function DepositTicker() {
  const fetcher = useCallback(() => api.liveDeposits() as Promise<LiveDeposit[]>, []);
  const { data } = useApi<LiveDeposit[]>(fetcher);
  const deposits = data ?? [];

  return (
    <div className="flex items-center overflow-hidden border-b border-white/5 bg-[#070707]">
      <div className="z-10 flex shrink-0 items-center gap-2 bg-[#070707] py-2.5 pl-4 pr-3 sm:pl-6">
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-brand-400" />
        <span className="whitespace-nowrap rounded-md bg-white/5 px-2 py-1 text-[9px] font-medium uppercase tracking-[0.13em] text-brand-300 sm:text-[10px]">
          Live Deposits
        </span>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {deposits.length > 0 && (
          <div className="flex w-max animate-marquee items-center">
            {[...deposits, ...deposits].map((deposit, index) => (
              <TickerItem key={`${deposit.id}-${index}`} deposit={deposit} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
