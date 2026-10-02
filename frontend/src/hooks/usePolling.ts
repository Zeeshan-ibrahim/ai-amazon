'use client';

import { useEffect, useRef } from 'react';

/**
 * Calls `fn` every `intervalMs` while the component is mounted, `enabled`
 * is true and the browser tab is visible. A hidden tab doesn't poll; when
 * it becomes visible again `fn` runs straight away. Calls never overlap —
 * the next one is scheduled after the previous one settles. Errors are
 * swallowed, so a failed poll just waits for the next tick.
 */
export function usePolling(fn: () => unknown, intervalMs: number, enabled = true) {
  const latest = useRef(fn);
  useEffect(() => {
    latest.current = fn;
  }, [fn]);

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let running = false;
    let stopped = false;

    const schedule = () => {
      clearTimeout(timer);
      if (!stopped) timer = setTimeout(tick, intervalMs);
    };
    async function tick() {
      if (document.visibilityState !== 'visible') return; // resumed by onVisible
      running = true;
      try {
        await latest.current();
      } catch {
        // Next tick retries.
      } finally {
        running = false;
        schedule();
      }
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !running) {
        clearTimeout(timer);
        tick();
      }
    };

    schedule();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [intervalMs, enabled]);
}
