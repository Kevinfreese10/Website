'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Floating action bar shown while rows are selected.
 * Render bulk action buttons/menus as children.
 */
export function BulkActionBar({
  count,
  onClear,
  children,
}: {
  count: number;
  onClear: () => void;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border bg-background/95 py-2 pl-4 pr-2 shadow-overlay backdrop-blur animate-fade-up">
        <span className="text-sm font-medium whitespace-nowrap">
          {count} selected
        </span>
        <div className="h-4 w-px bg-border" aria-hidden="true" />
        <div className="flex items-center gap-1.5">{children}</div>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClear} aria-label="Clear selection">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
