'use client';

import { useCallback, useEffect, useState } from 'react';

export interface SavedView<S> {
  name: string;
  state: S;
  createdAt: number;
}

/**
 * Per-user, per-table saved views ("My Orders", "Overdue", …).
 * Stored in localStorage keyed by user + table id, isolated behind this hook
 * so the backing store can move to Firestore without touching callers.
 */
export function useSavedViews<S>(tableId: string, userId?: string | null) {
  const storageKey = `myacc.table-views.${userId ?? 'anon'}.${tableId}`;
  const [views, setViews] = useState<SavedView<S>[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      setViews(raw ? (JSON.parse(raw) as SavedView<S>[]) : []);
    } catch {
      setViews([]);
    }
  }, [storageKey]);

  const persist = useCallback(
    (next: SavedView<S>[]) => {
      setViews(next);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
    },
    [storageKey]
  );

  const saveView = useCallback(
    (name: string, state: S) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      persist([
        ...views.filter((v) => v.name !== trimmed),
        { name: trimmed, state, createdAt: Date.now() },
      ]);
    },
    [views, persist]
  );

  const deleteView = useCallback(
    (name: string) => persist(views.filter((v) => v.name !== name)),
    [views, persist]
  );

  return { views, saveView, deleteView };
}
