'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type DraftStatus = 'idle' | 'saving' | 'saved' | 'restored';

const PREFIX = 'myacc.draft.';

/**
 * Draft autosave for forms: debounced writes to localStorage keyed by
 * `key`, draft recovery on mount, and a status for AutosaveIndicator.
 *
 * const draft = useFormDraft(`order-note.${orderId}`, watchValue);
 * draft.restored  → value found on mount (offer to restore / auto-fill)
 * draft.clear()   → call after a successful submit
 */
export function useFormDraft(key: string, value: string, enabled = true) {
  const storageKey = PREFIX + key;
  const [status, setStatus] = useState<DraftStatus>('idle');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [restored, setRestored] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);

  // Recover any existing draft once on mount.
  useEffect(() => {
    if (!enabled) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { value: string; ts: number };
        if (parsed.value && parsed.value.trim()) {
          setRestored(parsed.value);
          setStatus('restored');
        }
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, enabled]);

  // Debounced save on change.
  useEffect(() => {
    if (!enabled) return;
    if (first.current) {
      first.current = false;
      return;
    }
    if (!value || !value.trim()) return;
    setStatus('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify({ value, ts: Date.now() }));
        setSavedAt(new Date());
        setStatus('saved');
      } catch {
        setStatus('idle');
      }
    }, 800);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, storageKey, enabled]);

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    setStatus('idle');
    setRestored(null);
    setSavedAt(null);
  }, [storageKey]);

  const dismissRestored = useCallback(() => setRestored(null), []);

  return { status, savedAt, restored, clear, dismissRestored };
}
