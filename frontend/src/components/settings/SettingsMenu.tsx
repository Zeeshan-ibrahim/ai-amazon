'use client';

import Link from 'next/link';
import type { ComponentType, SVGProps } from 'react';
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  ChevronRightIcon,
  HelpIcon,
  LogoutIcon,
  SettingsIcon,
  UserIcon,
} from '@/components/ui/Icons';
import { cn } from '@/lib/cn';

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const ITEMS: { href: string; label: string; icon: Icon }[] = [
  { href: '/settings/profile', label: 'Edit particulars', icon: UserIcon },
  { href: '/settings/deposits', label: 'Deposit records', icon: ArrowUpRightIcon },
  { href: '/settings/withdrawals', label: 'Withdrawal records', icon: ArrowDownLeftIcon },
  { href: '/settings/security', label: 'Manage settings', icon: SettingsIcon },
  { href: '/settings/help', label: 'Help & platform FAQ', icon: HelpIcon },
];

const rowClass =
  'flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-cream sm:px-5 sm:py-5';

function IconBox({ icon: Icon, danger }: { icon: Icon; danger?: boolean }) {
  return (
    <span
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
        danger
          ? 'border-dangerSoft/15 bg-dangerSoft/[0.06] text-dangerSoft'
          : 'border-line bg-cream text-ink'
      )}
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}

const labelClass = 'flex-1 text-[13px] font-medium uppercase tracking-[0.14em] sm:text-[14px]';

export function SettingsMenu({ onSignOut }: { onSignOut: () => void }) {
  return (
    <nav
      aria-label="Account"
      className="divide-y divide-line overflow-hidden rounded-card border border-line bg-white shadow-card"
    >
      {ITEMS.map((item) => (
        <Link key={item.href} href={item.href} className={rowClass}>
          <IconBox icon={item.icon} />
          <span className={cn(labelClass, 'text-ink')}>{item.label}</span>
          <ChevronRightIcon className="h-4 w-4 text-subtle" />
        </Link>
      ))}
      <button type="button" onClick={onSignOut} className={rowClass}>
        <IconBox icon={LogoutIcon} danger />
        <span className={cn(labelClass, 'text-dangerSoft')}>Sign out account</span>
      </button>
    </nav>
  );
}
