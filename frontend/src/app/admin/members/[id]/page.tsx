'use client';

import { useCallback, useState, type ComponentType, type SVGProps } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AuditsTab } from '@/components/admin/members/AuditsTab';
import { LedgerTab } from '@/components/admin/members/LedgerTab';
import { OrdersTab } from '@/components/admin/members/OrdersTab';
import { ParticularsTab } from '@/components/admin/members/ParticularsTab';
import { AddedByBadge, MemberInitial, RoleBadge } from '@/components/admin/ui';
import { useSession } from '@/components/layout/SessionProvider';
import {
  CartIcon,
  ChatIcon,
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
  const { user } = useSession();
  const fetcher = useCallback(() => api.admin.member(id), [id]);
  const { data: member, loading, error, refetch, setData } = useApi<Member>(fetcher);
  const [tab, setTab] = useState<TabId>('particulars');

  if (loading && !member) return <LoadingBlock rows={3} />;
  if (error || !member) {
    return <ErrorState message={error ?? 'Member unavailable.'} onRetry={refetch} />;
  }

  // The same rule as the API's inbox scope: a sub-admin writes to their own
  // members; a super-admin to sub-admins and members nobody else owns.
  const canMessage =
    member.role === 'sub_admin'
      ? user?.role === 'super_admin'
      : member.role === 'user' && (user?.role === 'sub_admin' || !member.addedBy);

  return (
    <div className="space-y-6 lg:space-y-8">
      <header className="flex flex-col gap-6 border-b border-line pb-6 sm:flex-row sm:items-center">
        <Link
          href="/admin/members"
          className="inline-flex h-9 w-fit items-center gap-2 rounded-xl border border-line bg-white px-3.5 text-[13px] font-medium text-ink transition-colors hover:border-ink/25 hover:bg-cream"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to members
        </Link>
        <span aria-hidden className="hidden h-10 w-px bg-line sm:block" />
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <MemberInitial name={member.displayName} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-[24px] font-medium tracking-tight text-ink lg:text-[28px]">
                {member.displayName}
              </h1>
              <RoleBadge role={member.role} outlined />
              {user?.role === 'super_admin' && member.role === 'user' && (
                <AddedByBadge addedBy={member.addedBy} />
              )}
            </div>
            <p className="mt-1 text-[13px] text-muted">
              Audit ref: {member.inviteCode} • Balance: {formatCurrency(member.balance)}
            </p>
          </div>
        </div>
        {canMessage && (
          <Link
            href={`/admin/messages?with=${member.id}`}
            className="inline-flex h-10 w-fit shrink-0 items-center gap-2 rounded-xl bg-ink px-4 text-[13px] font-medium text-white transition-colors hover:bg-black/85"
          >
            <ChatIcon className="h-4 w-4" />
            Message
          </Link>
        )}
      </header>

      <nav
        role="tablist"
        aria-label="Member sections"
        className="flex gap-5 overflow-x-auto border-b border-line sm:gap-7"
      >
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            role="tab"
            type="button"
            aria-selected={tab === tabId}
            onClick={() => setTab(tabId)}
            className={cn(
              '-mb-px flex shrink-0 items-center gap-2 border-b-2 pb-3 text-[15px] transition-colors',
              tab === tabId
                ? 'border-ink font-medium text-ink'
                : 'border-transparent text-muted hover:text-ink'
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </button>
        ))}
      </nav>

      {tab === 'particulars' && <ParticularsTab member={member} onSaved={setData} />}
      {tab === 'ledger' && <LedgerTab member={member} onBalanceChange={refetch} />}
      {tab === 'orders' && (
        <OrdersTab member={member} onGoToLedger={() => setTab('ledger')} onBalanceChange={refetch} />
      )}
      {tab === 'audits' && <AuditsTab member={member} />}
    </div>
  );
}
