'use client';

import { useCallback, useEffect, useState } from 'react';
import { userMessage } from '@/lib/api';

type State<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

/**
 * Fetch-on-mount helper for client components.
 * `fetcher` must be stable (wrap it in `useCallback` or define it outside
 * the component) — it is part of the effect dependency list.
 */
export function useApi<T>(fetcher: () => Promise<T>) {
  const [state, setState] = useState<State<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetcher();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: userMessage(error, "We couldn't load this right now."),
      });
    }
  }, [fetcher]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refetch: load, setData: (data: T) => setState({ data, loading: false, error: null }) };
}
