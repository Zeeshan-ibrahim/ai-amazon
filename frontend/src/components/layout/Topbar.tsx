'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { User } from '@/lib/types';

export function Topbar({ user, title }: { user: User | null; title: string }) {
  return (
    <header className="hidden items-center justify-between px-8 py-4 lg:flex">
      <p className="text-[15px] text-ink">{title}</p>
      <Link href="/settings" aria-label="Open settings">
        {user?.avatar ? (
          <Image
            src={user.avatar}
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover ring-1 ring-line"
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-black/5" />
        )}
      </Link>
    </header>
  );
}
