'use client';

import { useCallback, useState } from 'react';

/** Copy-to-clipboard with a short-lived "copied" flag for button feedback. */
export function useCopy(resetAfter = 1800) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (value: string) => {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), resetAfter);
      } catch {
        setCopied(false);
      }
    },
    [resetAfter]
  );

  return { copied, copy };
}
