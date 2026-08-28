'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface FilterChip {
  id: string;
  label: string;
  onRemove: () => void;
}

/** Visible active-filter chips with instant removal and a clear-all action. */
export function FilterChips({
  chips,
  onClearAll,
}: {
  chips: FilterChip[];
  onClearAll?: () => void;
}) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 animate-fade-in">
      <span className="text-xs text-muted-foreground">Filters:</span>
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={chip.onRemove}
          className="group inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary transition-colors hover:border-primary/40 hover:bg-primary/10"
        >
          {chip.label}
          <X className="h-3 w-3 opacity-60 transition-opacity group-hover:opacity-100" />
        </button>
      ))}
      {chips.length > 1 && onClearAll && (
        <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={onClearAll}>
          Clear all
        </Button>
      )}
    </div>
  );
}
