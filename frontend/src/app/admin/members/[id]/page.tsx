'use client';

import { useCallback, useState, type ComponentType, type SVGProps } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AuditsTab } from '@/components/admin/members/AuditsTab';
import { LedgerTab } from '@/components/admin/members/LedgerTab';
import { OrdersTab } from '@/components/admin/members/OrdersTab';
import { ParticularsTab } from '@/components/admin/members/ParticularsTab';
import { MemberInitial, RoleBadge } from '@/components/admin/ui';
import {
  CartIcon,
  ChevronLeftIcon,
  HistoryIcon,
  ShieldIcon,
  WalletIcon,
} from '@/components/ui/Icons';
import { ErrorState, LoadingBlock } from '@/components/ui/States';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import type { Member } from '@/lib/types';

type TabId = 'particulars' | 'ledger' | 'orders' | 'audits';

const TABS: { id: TabId; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { id: 'particulars', label: 'Particulars', icon: ShieldIcon },
  { id: 'ledger', label: 'Ledger', icon: WalletIcon },
  { id: 'orders', label: 'Orders', icon: CartIcon },
  { id: 'audits', label: 'Audits', icon: HistoryIcon },
];

export default function MemberPage() {
  const { id } = useParams<{ id: string }>();
  const fetcher = useCallback(() => api.admin.member(id), [id]);
  const { data: member, loading, error, refetch, setData } = useApi<Member>(fetcher);
  const [tab, setTab] = useState<TabId>('particulars');

  if (loading && !member) return <LoadingBlock rows={3} />;
  if (error || !member) {
    return <ErrorState message={error ?? 'Member unavailable.'} onRetry={refetch} />;
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 border-b border-black/[0.06] pb-7 sm:flex-row sm:items-center">
        <Link
          href="/admin/members"
          className="inline-flex w-fit items-center gap-3 rounded-2xl bg-[#1c1c1c] px-6 py-4 text-[12px] font-extrabold uppercase tracking-[0.14em] text-gold shadow-[0_12px_24px_-14px_rgba(0,0,0,0.8)] transition-colors hover:bg-black"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to members
        </Link>
        <span aria-hidden className="hidden h-12 w-px bg-black/10 sm:block" />
        <div className="flex min-w-0 items-center gap-4">
          <MemberInitial name={member.displayName} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-[24px] font-black uppercase tracking-tight text-ink sm:text-[28px]">
                {member.displayName}
              </h1>
              <RoleBadge role={member.role} outlined />
            </div>
            <p className="mt-1 text-[12px] font-bold uppercase tracking-[0.14em] text-subtle sm:text-[13px]">
              Audit ref: {member.inviteCode} • Balance: {formatCurrency(member.balance)}
            </p>
          </div>
        </div>
      </header>

      <nav
        role="tablist"
        aria-label="Member sections"
        className="flex overflow-x-auto border-b-[1.5px] border-ink"
      >
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            role="tab"
            type="button"
            aria-selected={tab === tabId}
            onClick={() => setTab(tabId)}
            className={cn(
              '-mb-[1.5px] flex shrink-0 items-center gap-3 border-b-[3px] px-6 py-4 text-[13px] font-extrabold uppercase tracking-[0.16em] transition-colors sm:px-9',
              tab === tabId
                ? 'border-ink text-ink'
                : 'border-transparent text-ink/60 hover:text-ink'
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </nav>

      {tab === 'particulars' && <ParticularsTab member={member} onSaved={setData} />}
      {tab === 'ledger' && <LedgerTab member={member} onBalanceChange={refetch} />}
      {tab === 'orders' && <OrdersTab member={member} onGoToLedger={() => setTab('ledger')} />}
      {tab === 'audits' && <AuditsTab member={member} />}
    </div>
  );
}
