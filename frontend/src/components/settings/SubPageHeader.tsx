import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronLeftIcon } from '@/components/ui/Icons';

/** Title block for the screens under Settings, with a way back to the menu. */
export function SubPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="space-y-4">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Settings
      </Link>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[26px] font-medium tracking-tight text-ink lg:text-[30px]">
            {title}
          </h1>
          {description && <p className="mt-1.5 text-[14px] text-muted">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
