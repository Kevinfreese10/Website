'use client';

import { useCallback, useEffect, useState } from 'react';

const PREFIX = 'myacc.dismissed.';

/**
 * Per-user, per-key dismissal state for tips, callouts and first-run cards.
 * Returns `visible: false` until mounted so nothing flashes during hydration.
 */
export function useDismissible(key: string, userId?: string | null) {
  const storageKey = `${PREFIX}${userId ?? 'anon'}.${key}`;
  const [dismissed, setDismissed] = useState(true); // hidden until we know

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(storageKey) === '1');
    } catch {
      setDismissed(false);
    }
  }, [storageKey]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      window.localStorage.setItem(storageKey, '1');
    } catch {
      /* storage unavailable */
    }
  }, [storageKey]);

  const reset = useCallback(() => {
    setDismissed(false);
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  return { visible: !dismissed, dismiss, reset };
}
