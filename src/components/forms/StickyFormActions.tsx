'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Sticky action bar for long forms: Save/Continue stays visible at the
 * bottom of the viewport while the form scrolls. Render buttons as children.
 */
export function StickyFormActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-20 -mx-4 mt-6 flex items-center justify-end gap-2 border-t bg-background/85 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:-mx-6 sm:px-6',
        className
      )}
    >
      {children}
    </div>
  );
}
