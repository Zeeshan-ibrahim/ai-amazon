'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { LogoMark, MenuIcon } from '@/components/ui/Icons';
import { cn } from '@/lib/cn';
import { AdminSidebar } from './AdminSidebar';

/**
 * Desktop: fixed black sidebar.
 * Mobile: black top bar with a menu button that opens the sidebar as a drawer.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-[#f7f7f6]">
      <div
        aria-hidden
        onClick={() => setMenuOpen(false)}
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden',
          menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />
      <AdminSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="lg:pl-[300px]">
        <header className="sticky top-0 z-30 flex items-center justify-between bg-black px-4 py-3 text-white shadow-[0_10px_24px_-12px_rgba(0,0,0,0.6)] lg:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-gold">
              <LogoMark className="h-4 w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold uppercase leading-tight tracking-tight">
                Infinity Vest
              </p>
              <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-gold">
                Group Admin Portal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="admin-sidebar"
            className="rounded-xl border border-white/10 bg-white/[0.06] p-2.5 text-gold"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </header>

        <main className="px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
          <div className="mx-auto w-full max-w-[1180px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
