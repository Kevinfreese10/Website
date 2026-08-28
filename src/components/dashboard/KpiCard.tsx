'use client';

import * as React from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Sparkline } from '@/components/ui/sparkline';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KpiCardProps {
  label: string;
  value: number;
  format?: (v: number) => string;
  icon?: LucideIcon;
  /** Percentage change vs the comparison period (e.g. 12.5, -3.2). */
  trendPct?: number | null;
  trendLabel?: string;
  /** Series for the sparkline (e.g. weekly totals, oldest first). */
  sparkData?: number[];
  sparkClassName?: string;
  href?: string;
  className?: string;
}

/**
 * Interactive KPI card: animated count-up value, trend vs prior period
 * and a mini sparkline for context. Wrap in a link via `href`.
 */
export function KpiCard({
  label,
  value,
  format,
  icon: Icon,
  trendPct,
  trendLabel = 'vs last month',
  sparkData,
  sparkClassName,
  href,
  className,
}: KpiCardProps) {
  const trend =
    trendPct == null || !isFinite(trendPct) ? null : Math.round(trendPct * 10) / 10;
  const TrendIcon = trend == null ? Minus : trend >= 0 ? TrendingUp : TrendingDown;

  const body = (
    <Card
      className={cn(
        'h-full',
        href && 'hover-lift cursor-pointer',
        className
      )}
    >
      <CardContent className="flex h-full items-start justify-between gap-3 p-5">
        <div className="min-w-0 space-y-1.5">
          <p className="text-meta flex items-center gap-1.5">
            {Icon && <Icon className="h-3.5 w-3.5 text-primary" />} {label}
          </p>
          <p className="text-2xl font-black tabular-nums tracking-tight text-foreground">
            <AnimatedNumber value={value} format={format} />
          </p>
          {trend != null && (
            <p
              className={cn(
                'flex items-center gap-1 text-[11px] font-semibold',
                trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-600' : 'text-muted-foreground'
              )}
            >
              <TrendIcon className="h-3 w-3" />
              {trend > 0 ? '+' : ''}
              {trend}% <span className="font-medium text-muted-foreground">{trendLabel}</span>
            </p>
          )}
        </div>
        {sparkData && sparkData.length > 1 && (
          <Sparkline
            data={sparkData}
            width={84}
            height={30}
            className={cn('mt-1 shrink-0', sparkClassName)}
          />
        )}
      </CardContent>
    </Card>
  );

  return href ? <Link href={href} className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">{body}</Link> : body;
}
