'use client';

import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TimelineItem {
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  timestamp?: string;
  icon?: LucideIcon;
  /** Accent for the marker dot. */
  tone?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
}

const toneClasses: Record<NonNullable<TimelineItem['tone']>, string> = {
  default: 'border-border bg-muted text-muted-foreground',
  primary: 'border-primary/40 bg-primary/10 text-primary',
  success: 'border-emerald-300 bg-emerald-50 text-emerald-600',
  warning: 'border-amber-300 bg-amber-50 text-amber-600',
  destructive: 'border-red-300 bg-red-50 text-red-600',
};

/**
 * Vertical activity timeline for record history (notes, status changes,
 * payments). Items render top-down with a connecting rail.
 */
export function ActivityTimeline({
  items,
  className,
}: {
  items: TimelineItem[];
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <ol className={cn('relative space-y-5 stagger-children', className)}>
      {items.map((item, i) => {
        const Icon = item.icon ?? Circle;
        const last = i === items.length - 1;
        return (
          <li key={item.id} className="relative flex gap-3">
            {!last && (
              <span
                className="absolute left-[13px] top-8 h-[calc(100%-8px)] w-px bg-border"
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border',
                toneClasses[item.tone ?? 'default']
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <div className="text-sm font-medium text-foreground">{item.title}</div>
                {item.timestamp && (
                  <span className="shrink-0 text-[11px] text-muted-foreground">{item.timestamp}</span>
                )}
              </div>
              {item.description && (
                <div className="mt-0.5 text-xs text-muted-foreground">{item.description}</div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
