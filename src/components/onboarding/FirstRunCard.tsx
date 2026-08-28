'use client';

import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDismissible } from './use-dismissible';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FirstRunStep {
  icon?: LucideIcon;
  title: string;
  description?: string;
  done?: boolean;
}

/**
 * First-use experience for a feature that has never been configured:
 * a short "here's how this works" card with optional checklist steps
 * and a primary CTA. Dismissed permanently per user.
 */
export function FirstRunCard({
  id,
  title,
  description,
  steps,
  action,
  className,
}: {
  id: string;
  title: string;
  description?: string;
  steps?: FirstRunStep[];
  action?: React.ReactNode;
  className?: string;
}) {
  const { user } = useAuth();
  const { visible, dismiss } = useDismissible(`firstrun.${id}`, user?.id);
  if (!visible) return null;

  return (
    <Card className={cn('relative overflow-hidden border-primary/20 animate-fade-up', className)}>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/[0.07] to-transparent"
        aria-hidden="true"
      />
      <CardContent className="relative space-y-4 p-5 pr-10">
        <div className="space-y-1">
          <h3 className="text-section-title">{title}</h3>
          {description && <p className="text-support">{description}</p>}
        </div>
        {steps && steps.length > 0 && (
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {steps.map((step) => (
              <li key={step.title} className="flex items-start gap-2.5 rounded-lg border bg-muted/30 p-3">
                <span
                  className={cn(
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                    step.done ? 'bg-emerald-100 text-emerald-700' : 'bg-primary/10 text-primary'
                  )}
                >
                  {step.done ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : step.icon ? (
                    <step.icon className="h-3.5 w-3.5" />
                  ) : null}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-foreground">{step.title}</span>
                  {step.description && (
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">{step.description}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
        {action && <div className="flex flex-wrap gap-2 pt-0.5">{action}</div>}
      </CardContent>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-7 w-7 text-muted-foreground hover:text-foreground"
        onClick={dismiss}
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </Button>
    </Card>
  );
}
