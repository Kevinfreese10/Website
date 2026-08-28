'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDismissible } from './use-dismissible';
import { Button } from '@/components/ui/button';
import { Lightbulb, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Contextual onboarding tip shown where the feature actually lives.
 * Dismissed permanently per user via `id`.
 *
 * <FeatureTip id="cmdk" title="Try the command palette">
 *   Press Ctrl/⌘ K to jump to any client, order or page.
 * </FeatureTip>
 */
export function FeatureTip({
  id,
  title,
  children,
  action,
  className,
  variant = 'inline',
}: {
  id: string;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  /** 'inline' sits in the flow; 'floating' is a compact bubble for tight spots. */
  variant?: 'inline' | 'floating';
}) {
  const { user } = useAuth();
  const { visible, dismiss } = useDismissible(`tip.${id}`, user?.id);
  if (!visible) return null;

  return (
    <div
      role="note"
      className={cn(
        'relative flex items-start gap-2.5 rounded-lg border border-primary/25 bg-primary/[0.04] animate-fade-up',
        variant === 'inline' ? 'p-3.5 pr-9' : 'p-2.5 pr-8 text-xs shadow-raised',
        className
      )}
    >
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className={cn('font-semibold text-foreground', variant === 'inline' ? 'text-sm' : 'text-xs')}>
          {title}
        </p>
        {children && (
          <div className={cn('text-muted-foreground', variant === 'inline' ? 'text-xs' : 'text-[11px]')}>
            {children}
          </div>
        )}
        {action && <div className="pt-1">{action}</div>}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-1.5 top-1.5 h-6 w-6 text-muted-foreground hover:text-foreground"
        onClick={dismiss}
        aria-label="Dismiss tip"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
