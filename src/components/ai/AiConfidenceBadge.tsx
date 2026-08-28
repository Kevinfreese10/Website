'use client';

import * as React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Standard confidence indicator for AI decisions.
 * ≥80 high (emerald), ≥50 medium (amber), <50 low (red); `noMatch`
 * renders a neutral "No match" state. Use everywhere instead of ad-hoc
 * green/yellow badges so confidence always reads the same.
 */
export function AiConfidenceBadge({
  confidence,
  noMatchBelow = 20,
  className,
}: {
  confidence: number;
  /** Below this value the badge reads "No match found". */
  noMatchBelow?: number;
  className?: string;
}) {
  const pct = Math.round(confidence);
  const noMatch = pct < noMatchBelow;
  const tone = noMatch
    ? 'border-border bg-muted text-muted-foreground'
    : pct >= 80
      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
      : pct >= 50
        ? 'border-amber-300 bg-amber-50 text-amber-800'
        : 'border-red-300 bg-red-50 text-red-700';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap',
        tone,
        className
      )}
      title={noMatch ? 'AI could not find a confident match' : `AI confidence: ${pct}%`}
    >
      <Sparkles className="h-2.5 w-2.5" />
      {noMatch ? 'No match found' : `${pct}% confidence`}
    </span>
  );
}
