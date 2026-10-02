'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/layout/Logo';
import { useSession } from '@/components/layout/SessionProvider';
import { CloseIcon, LogoutIcon, UserIcon } from '@/components/ui/Icons';
import { UnreadBadge, useUnread } from '@/components/messages/UnreadProvider';
import { cn } from '@/lib/cn';
import { adminNavFor } from '@/lib/nav';
import { ROLE_LABELS } from './ui';

/**
 * Admin sidebar, styled like the member sidebar. Always visible from `lg`;
 * below that it is a drawer that `AdminShell` slides in and out.
 */
export function AdminSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useSession();
  const { counts } = useUnread();
  const handle = user?.username || user?.loginEmail.split('@')[0] || '';

  return (
    <aside
      id="admin-sidebar"
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-[276px] max-w-[85vw] flex-col bg-sidebar-veil p-4 text-white shadow-panel transition-transform duration-300 ease-out lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="mb-6 flex items-center justify-between gap-3 px-3 pt-3">
        <Link href="/admin/analytics" className="min-w-0">
          <Logo markClassName="text-white" />
          <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-brand-300">
            Admin portal
          </p>
        </Link>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      <nav className="-mx-1 flex flex-1 flex-col gap-1 overflow-y-auto px-1 scrollbar-none">
        {adminNavFor(user?.role).map(({ slug, label, icon: Icon, unread }) => {
          const href = `/admin/${slug}`;
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={slug}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] transition-colors',
                isActive
                  ? 'bg-brand-500 font-medium text-white'
                  : 'text-white/65 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon className="h-[19px] w-[19px] shrink-0" />
              <span className="flex-1">{label}</span>
              {unread && <UnreadBadge count={counts.count} />}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-white/10 pt-4">
        <div className="flex items-center gap-3 px-2 pb-2">
          <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-white/10 text-brand-300">
            <UserIcon className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-white">@{handle}</p>
            <p className="truncate text-[11px] text-white/45">{user ? ROLE_LABELS[user.role] : ''}</p>
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
    </aside>
  );
}
