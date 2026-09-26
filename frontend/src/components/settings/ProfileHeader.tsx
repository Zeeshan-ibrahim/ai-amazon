'use client';

import { useSession } from '@/components/layout/SessionProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { LogoutIcon } from '@/components/ui/Icons';
import { formatCurrency } from '@/lib/format';
import type { User } from '@/lib/types';

export function ProfileHeader({ user }: { user: User }) {
  const { logout } = useSession();

  return (
    <section className="rounded-card bg-balance-veil p-5 text-white shadow-panel sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Avatar
            src={user.avatar}
            name={user.displayName}
            size={60}
            className="h-14 w-14 sm:h-[60px] sm:w-[60px]"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[26px] font-medium tracking-tight sm:text-[32px]">
                {user.firstName} {user.lastName}
              </h1>
              <Badge className="border border-white/15 bg-white/10 text-white">
                {user.status === 'active' ? 'Active trader' : 'Suspended'}
              </Badge>
            </div>
            <p className="mt-0.5 text-[12px] text-white/45">UID: {user.id}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-5 border-t border-white/10 pt-4 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-white/45">
              Available funds
            </p>
            <p className="tabular mt-1 text-[26px] font-medium tracking-tight sm:text-[30px]">
              {formatCurrency(user.balance)}
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-white/10"
          >
            <LogoutIcon className="h-4 w-4" />
            Log out
          </button>
        </div>
      </div>

      {user.doubleLedgerPassword && (
        <p className="mt-5 flex items-center gap-2 text-[12px] text-white/55 sm:text-[13px]">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
          Double Ledger Password Enabled
        </p>
      )}
    </section>
  );
}
