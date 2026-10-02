'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePolling } from '@/hooks/usePolling';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import type { UnreadCounts } from '@/lib/types';

/** How often the sidebar badge checks for new messages. */
const UNREAD_POLL_MS = 20_000;

const EMPTY: UnreadCounts = { own: 0, inbox: 0, count: 0 };

type UnreadValue = {
  counts: UnreadCounts;
  /** Replace the counts with a fresher copy, e.g. from a mark-read response. */
  setCounts: (counts: UnreadCounts) => void;
  refresh: () => Promise<void>;
};

const UnreadContext = createContext<UnreadValue>({
  counts: EMPTY,
  setCounts: () => {},
  refresh: async () => {},
});

/**
 * Unread message counts for the shell's sidebar badge. Polls in the
 * background (only while the tab is visible); the Messages page pushes
 * fresh counts in as it marks threads read, so the badge clears at once.
 */
export function UnreadProvider({ children }: { children: ReactNode }) {
  const [counts, setCounts] = useState<UnreadCounts>(EMPTY);

  const refresh = useCallback(async () => {
    setCounts(await api.messages.unread());
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);
  usePolling(refresh, UNREAD_POLL_MS);

  const value = useMemo(() => ({ counts, setCounts, refresh }), [counts, refresh]);
  return <UnreadContext.Provider value={value}>{children}</UnreadContext.Provider>;
}

export const useUnread = () => useContext(UnreadContext);

/** Small count pill for nav items; renders nothing at 0. */
export function UnreadBadge({ count, className }: { count: number; className?: string }) {
  if (!count) return null;
  return (
    <span
      aria-label={`${count} unread`}
      className={cn(
        'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gold px-1.5 text-[11px] font-semibold leading-none text-ink',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
