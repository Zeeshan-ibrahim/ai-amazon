'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from '@/components/layout/SessionProvider';
import { Logo } from '@/components/layout/Logo';
import { MenuIcon } from '@/components/ui/Icons';
import { EmptyState } from '@/components/ui/States';
import { cn } from '@/lib/cn';
import { adminSectionOf } from '@/lib/nav';
import { AdminSidebar } from './AdminSidebar';

/**
 * Desktop: fixed dark sidebar, as in the member app.
 * Mobile: light top bar with a menu button that opens the sidebar as a drawer.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  // Sections for the other admin role aren't in the sidebar; a typed URL
  // lands here instead of on a page whose API calls would all be refused.
  const section = adminSectionOf(pathname);
  const allowed = !section?.only || section.only === user?.role;

  // Navigating closes the drawer.
  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-cream">
      <div
        aria-hidden
        onClick={() => setMenuOpen(false)}
        className={cn(
          'fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden',
          menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />
      <AdminSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="lg:pl-[276px]">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="min-w-0">
            <Logo className="gap-2.5 text-ink" markClassName="h-6 w-9 text-brand-600" />
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="admin-sidebar"
            className="rounded-xl border border-line bg-white p-2.5 text-ink transition-colors hover:bg-cream"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </header>

        <main className="px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
          <div className="mx-auto w-full max-w-[1180px]">
            {allowed ? (
              children
            ) : (
              <EmptyState
                className="mt-10"
                title="You don't have access to this section."
                hint="Pick one from the menu."
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
