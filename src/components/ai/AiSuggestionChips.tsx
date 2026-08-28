'use client';

import * as React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Context-aware suggested next steps rendered as tappable chips
 * (e.g. starter prompts in an AI chat, follow-up actions after a result).
 */
export function AiSuggestionChips({
  suggestions,
  onSelect,
  className,
}: {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  className?: string;
}) {
  if (suggestions.length === 0) return null;
  return (
    <div className={cn('flex flex-wrap gap-1.5 stagger-children', className)}>
      {suggestions.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onSelect(s)}
          className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50/60 px-3 py-1.5 text-xs font-medium text-violet-800 transition-all hover:border-violet-300 hover:bg-violet-100 hover:shadow-surface active:scale-[0.97]"
        >
          <Sparkles className="h-3 w-3 text-violet-500" />
          {s}
        </button>
      ))}
    </div>
  );
}
