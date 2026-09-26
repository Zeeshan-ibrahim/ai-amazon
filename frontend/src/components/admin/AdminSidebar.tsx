'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '@/components/layout/SessionProvider';
import { CloseIcon, LogoMark, LogoutIcon, UserIcon } from '@/components/ui/Icons';
import { cn } from '@/lib/cn';
import { adminNavItems } from '@/lib/nav';

/**
 * Black admin sidebar. Always visible from `lg`; below that it is a drawer
 * that `AdminShell` slides in and out.
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
  const handle = user?.username || user?.loginEmail.split('@')[0] || '';

  return (
    <aside
      id="admin-sidebar"
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-[300px] max-w-[85vw] flex-col border-r border-white/10 bg-black text-white transition-transform duration-300 ease-out lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-gold">
          <LogoMark className="h-5 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold uppercase leading-tight tracking-tight">
            Infinity Vest
          </p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-gold">
            Group Admin
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="rounded-xl border border-gold/70 p-2 text-gold transition-colors hover:bg-gold/10 lg:hidden"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-6">
        {adminNavItems.map(({ slug, label, icon: Icon }) => {
          const href = `/admin/${slug}`;
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={slug}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-4 rounded-2xl border px-5 py-3.5 text-[13px] font-semibold uppercase tracking-[0.16em] transition-colors',
                isActive
                  ? 'border-gold/40 bg-white/[0.08] text-gold shadow-[0_10px_28px_-14px_rgba(217,180,90,0.55)]'
                  : 'border-transparent text-white/70 hover:bg-white/[0.04] hover:text-white'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/40 bg-gold/10 text-gold">
            <UserIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold">@{handle}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold">
              Sysop mode
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Log out"
            className="rounded-xl border border-dangerSoft/40 bg-dangerSoft/10 p-2 text-dangerSoft transition-colors hover:bg-dangerSoft/20"
          >
            <LogoutIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
