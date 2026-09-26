'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems } from '@/lib/nav';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';
import { CrownIcon, LogoutIcon } from '@/components/ui/Icons';
import { Logo } from './Logo';
import { useSession } from './SessionProvider';
import type { User } from '@/lib/types';

export function Sidebar({ user }: { user: User | null }) {
  const pathname = usePathname();
  const { logout } = useSession();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[276px] flex-col bg-sidebar-veil p-4 text-white shadow-panel lg:flex">
      <div className="flex flex-1 flex-col rounded-2xl">
        <Link href="/dashboard" className="mb-6 flex items-center px-3 pt-3">
          <Logo markClassName="text-white" />
        </Link>

        <nav className="flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] transition-colors',
                  isActive
                    ? 'bg-brand-500 font-medium text-white'
                    : 'text-white/65 hover:bg-white/5 hover:text-white'
                )}
              >
                <Icon className="h-[19px] w-[19px]" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-4">
          <div className="flex items-center gap-3 px-2 pb-2">
            <div className="relative shrink-0">
              {user ? (
                <Avatar
                  src={user.avatar}
                  name={user.displayName}
                  size={38}
                  className="h-[38px] w-[38px] ring-2 ring-amber-400/70"
                />
              ) : (
                <div className="h-[38px] w-[38px] rounded-full bg-white/10" />
              )}
              <CrownIcon className="absolute -left-1 -top-1 h-3.5 w-3.5 text-amber-400" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-white">
                {user?.displayName ?? '—'}
              </p>
              <p className="truncate text-[11px] text-white/45">
                {user?.loginEmail ?? ''}
              </p>
            </div>

            <button
              type="button"
              onClick={logout}
              aria-label="Log out"
              className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogoutIcon className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
