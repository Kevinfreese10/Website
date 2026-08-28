'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { AiConfidenceBadge } from './AiConfidenceBadge';
import { Sparkles } from 'lucide-react';

export interface AiExplanationFactor {
  label: string;
  detail: string;
}

/**
 * "Why did AI do this?" transparency drawer: the decision, its confidence,
 * the reasoning and the factors that drove it.
 */
export function AiExplanationDrawer({
  open,
  onOpenChange,
  title = 'Why did AI do this?',
  decision,
  confidence,
  reasoning,
  factors,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  /** The decision/action taken, e.g. "Allocated to: Office Rent". */
  decision?: string;
  confidence?: number;
  reasoning?: string;
  factors?: AiExplanationFactor[];
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-violet-200 bg-violet-50">
              <Sparkles className="h-3.5 w-3.5 text-violet-600" />
            </span>
            {title}
          </SheetTitle>
          <SheetDescription>
            A transparent breakdown of this automated decision.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-5 space-y-5">
          {(decision || confidence != null) && (
            <div className="space-y-2 rounded-xl border border-violet-200/60 bg-violet-50/40 p-4">
              {decision && <p className="text-sm font-bold text-foreground">{decision}</p>}
              {confidence != null && <AiConfidenceBadge confidence={confidence} />}
            </div>
          )}
          {reasoning && (
            <section className="space-y-1.5">
              <h3 className="text-meta">Reasoning</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{reasoning}</p>
            </section>
          )}
          {factors && factors.length > 0 && (
            <>
              <Separator />
              <section className="space-y-3">
                <h3 className="text-meta">What drove this decision</h3>
                <ul className="space-y-2.5">
                  {factors.map((f) => (
                    <li key={f.label} className="rounded-lg border bg-muted/30 p-3">
                      <p className="text-xs font-bold text-foreground">{f.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{f.detail}</p>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            AI decisions can be wrong. Review before relying on them — you stay in control of what gets applied.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
