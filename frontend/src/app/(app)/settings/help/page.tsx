'use client';

import { useCallback, useState } from 'react';
import { SubPageHeader } from '@/components/settings/SubPageHeader';
import { ChevronRightIcon } from '@/components/ui/Icons';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/States';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import type { FaqItem } from '@/lib/types';

const fetchFaq = () => api.faq();

export default function HelpPage() {
  const fetcher = useCallback(fetchFaq, []);
  const { data, loading, error, refetch } = useApi<FaqItem[]>(fetcher);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-6 lg:space-y-8">
      <SubPageHeader
        title="Help & platform FAQ"
        description="How deposits, orders and withdrawals work."
      />

      {loading ? (
        <LoadingBlock rows={4} />
      ) : error || !data ? (
        <ErrorState message={error ?? 'Help is unavailable.'} onRetry={refetch} />
      ) : data.length === 0 ? (
        <EmptyState title="No help articles yet." />
      ) : (
        <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-white shadow-card">
          {data.map((item) => {
            const open = openId === item.id;
            return (
              <div key={item.id}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : item.id)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-cream sm:px-5"
                >
                  <span className="text-[15px] font-medium text-ink">{item.question}</span>
                  <ChevronRightIcon
                    className={cn(
                      'h-4 w-4 shrink-0 text-subtle transition-transform',
                      open && 'rotate-90'
                    )}
                  />
                </button>
                {open && (
                  <p className="px-4 pb-5 text-[14px] leading-relaxed text-muted sm:px-5">
                    {item.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
