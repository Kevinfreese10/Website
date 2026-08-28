'use client';

import { useCallback, useEffect, useState } from 'react';

export type RecentItemType = 'order' | 'client' | 'page';

export interface RecentItem {
  type: RecentItemType;
  id: string;
  label: string;
  href: string;
  sublabel?: string;
  ts: number;
}

const STORAGE_KEY = 'myacc.recent-items';
const MAX_ITEMS = 12;

function read(): RecentItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecentItem[]) : [];
  } catch {
    return [];
  }
}

/** Record a visited record (order, client, page) for "Recently viewed". */
export function recordRecentItem(item: Omit<RecentItem, 'ts'>) {
  if (typeof window === 'undefined') return;
  try {
    const items = read().filter((i) => !(i.type === item.type && i.id === item.id));
    items.unshift({ ...item, ts: Date.now() });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
    window.dispatchEvent(new Event('recent-items-changed'));
  } catch {
    /* storage unavailable — ignore */
  }
}

/** Live list of recently viewed items, most recent first. */
export function useRecentItems() {
  const [items, setItems] = useState<RecentItem[]>([]);

  const refresh = useCallback(() => setItems(read()), []);

  useEffect(() => {
    refresh();
    window.addEventListener('recent-items-changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('recent-items-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  return items;
}
