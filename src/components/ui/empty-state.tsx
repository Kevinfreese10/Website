import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Primary call to action, e.g. a <Button> or Quick Create link. */
  action?: React.ReactNode;
  /** Compact variant for use inside table bodies / small cards. */
  compact?: boolean;
}

/**
 * Standard empty state: icon in a soft ring, explanation, and a useful CTA.
 * Use instead of bare "No X found." text.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center animate-fade-up",
        compact ? "gap-2 px-4 py-8" : "gap-3 px-6 py-16",
        className
      )}
      {...props}
    >
      {Icon && (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-muted text-muted-foreground ring-8 ring-muted/40",
            compact ? "h-10 w-10" : "h-14 w-14"
          )}
        >
          <Icon className={compact ? "h-5 w-5" : "h-7 w-7"} aria-hidden="true" />
        </div>
      )}
      <div className="space-y-1">
        <p className={cn("font-semibold text-foreground", compact ? "text-sm" : "text-base")}>
          {title}
        </p>
        {description && (
          <p className={cn("mx-auto max-w-sm text-muted-foreground", compact ? "text-xs" : "text-sm")}>
            {description}
          </p>
        )}
      </div>
      {action && <div className={compact ? "mt-1" : "mt-2"}>{action}</div>}
    </div>
  );
}
