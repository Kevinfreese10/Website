'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Check, CloudUpload, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DraftStatus } from './use-form-draft';

/**
 * "Saving… → Saved" feedback pill for autosaved forms.
 */
export function AutosaveIndicator({
  status,
  savedAt,
  className,
}: {
  status: DraftStatus;
  savedAt?: Date | null;
  className?: string;
}) {
  if (status === 'idle') return null;
  return (
    <span
      role="status"
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground transition-opacity animate-fade-in',
        className
      )}
    >
      {status === 'saving' && (
        <>
          <CloudUpload className="h-3 w-3 animate-pulse" /> Saving draft…
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="h-3 w-3 text-emerald-600" /> Draft saved
          {savedAt ? ` ${format(savedAt, 'HH:mm')}` : ''}
        </>
      )}
      {status === 'restored' && (
        <>
          <History className="h-3 w-3 text-primary" /> Draft restored
        </>
      )}
    </span>
  );
}
