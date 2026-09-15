'use client';

import * as React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Branded AI working state: sparkle in a soft violet ring, animated
 * thinking dots and an optional status label — instead of a bare spinner.
 */
export function AiThinking({
  label = 'Thinking…',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2.5 animate-fade-in', className)} role="status">
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-violet-200 bg-violet-50">
        <Sparkles className="h-4 w-4 text-violet-600 animate-glow-pulse" />
      </span>
      <span className="flex items-center gap-1.5 rounded-xl rounded-bl-none border bg-muted px-3.5 py-2.5">
        <span className="flex gap-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-violet-500/70"
              style={{
                animation: 'glow-pulse 1.2s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </span>
        <span className="text-xs font-semibold italic text-violet-700">{label}</span>
      </span>
    </div>
  );
}
