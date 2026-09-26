'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Paged } from '@/lib/types';

/**
 * Offset-paginated list with "load more". Reloads from the first page
 * whenever `fetchPage` changes, so build it with `useCallback` over the
 * filters. Responses from superseded requests are dropped.
 */
export function usePagedList<T>(fetchPage: (offset: number) => Promise<Paged<T>>) {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);

  const load = useCallback(
    async (offset: number) => {
      const current = offset === 0 ? ++generation.current : generation.current;
      if (offset === 0) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const page = await fetchPage(offset);
        if (current !== generation.current) return;
        setItems((prev) => (offset === 0 ? page.items : [...prev, ...page.items]));
        setTotal(page.total);
      } catch (err) {
        if (current !== generation.current) return;
        setError(err instanceof Error ? err.message : 'Unable to reach the server.');
      } finally {
        if (current === generation.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [fetchPage]
  );

  useEffect(() => {
    load(0);
  }, [load]);

  return {
    items,
    total,
    loading,
    loadingMore,
    error,
    hasMore: items.length < total,
    loadMore: () => load(items.length),
    reload: () => load(0),
    setItems,
  };
}
