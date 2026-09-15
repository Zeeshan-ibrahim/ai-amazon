'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems } from '@/lib/nav';
import { cn } from '@/lib/cn';

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2">
        {navItems.map(({ href, mobileLabel, mobileIcon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 transition-colors',
                isActive ? 'text-ink' : 'text-subtle'
              )}
            >
              <Icon className={cn('h-[21px] w-[21px]', isActive && 'scale-105')} />
              <span
                className={cn(
                  'text-[10px]',
                  isActive ? 'font-medium text-ink' : 'text-subtle'
                )}
              >
                {mobileLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
