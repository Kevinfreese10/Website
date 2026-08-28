'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDismissible } from './use-dismissible';
import { cn } from '@/lib/utils';

/**
 * Subtle "New" feature-discovery marker. Disappears for good once the
 * user interacts with the feature — call `seen()` from the feature's
 * own handler, or use `dismissOnClick` to clear it when the badge's
 * container is clicked.
 */
export function NewBadge({
  id,
  label = 'New',
  className,
}: {
  id: string;
  label?: string;
  className?: string;
}) {
  const { user } = useAuth();
  const { visible } = useDismissible(`new.${id}`, user?.id);
  if (!visible) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary',
        className
      )}
    >
      {label}
    </span>
  );
}

/** Mark a NewBadge as seen (e.g. when the user opens the feature). */
export function markFeatureSeen(id: string, userId?: string | null) {
  try {
    window.localStorage.setItem(`myacc.dismissed.${userId ?? 'anon'}.new.${id}`, '1');
  } catch {
    /* ignore */
  }
}
