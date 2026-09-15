'use client';

import type { ReactNode } from 'react';
import { DepositTicker } from './DepositTicker';
import { MobileTabBar } from './MobileTabBar';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useSession } from './SessionProvider';

/**
 * Desktop: fixed dark sidebar + topbar + ticker.
 * Mobile: ticker pinned to the top, bottom tab bar for navigation.
 */
export function AppShell({
  children,
  title = 'Dashboard',
}: {
  children: ReactNode;
  title?: string;
}) {
  const { user } = useSession();

  return (
    <div className="min-h-screen bg-cream">
      <Sidebar user={user} />

      <div className="lg:pl-[276px]">
        <Topbar user={user} title={title} />

        <div className="sticky top-0 z-30 lg:static">
          <DepositTicker />
        </div>

        <main className="px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-16 lg:pt-8">
          <div className="mx-auto w-full max-w-[1180px]">{children}</div>
        </main>
      </div>

      <MobileTabBar />
    </div>
  );
}
