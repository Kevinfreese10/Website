import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Skeleton for data tables: header row + n body rows. */
export function TableSkeleton({
  rows = 8,
  columns = 5,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("w-full space-y-3 animate-fade-in", className)} aria-busy="true">
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className={cn("h-8 flex-1", c === 0 && "max-w-[40px]")} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Skeleton mimicking a standard content card. */
export function CardSkeleton({ className, lines = 3 }: { className?: string; lines?: number }) {
  return (
    <Card className={cn("animate-fade-in", className)} aria-busy="true">
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full last:w-2/3" />
        ))}
      </CardContent>
    </Card>
  );
}

/** Skeleton for a KPI/stat card. */
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("animate-fade-in", className)} aria-busy="true">
      <CardContent className="space-y-3 p-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

/** Full-page skeleton: title bar + stat row + table. */
export function PageSkeleton({ withStats = true }: { withStats?: boolean }) {
  return (
    <div className="space-y-6 animate-fade-in" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      {withStats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      )}
      <TableSkeleton />
    </div>
  );
}

/** Skeleton for vertical lists (activity feeds, notifications). */
export function ListSkeleton({ items = 5, className }: { items?: number; className?: string }) {
  return (
    <div className={cn("space-y-4 animate-fade-in", className)} aria-busy="true">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
