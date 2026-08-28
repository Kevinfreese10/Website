import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors",
  {
    variants: {
      tone: {
        neutral: "border-border bg-muted text-muted-foreground",
        info: "border-blue-200 bg-blue-50 text-blue-700",
        success: "border-emerald-200 bg-emerald-50 text-emerald-700",
        warning: "border-amber-200 bg-amber-50 text-amber-800",
        danger: "border-red-200 bg-red-50 text-red-700",
        overdue: "border-red-300 bg-red-100 text-red-800",
        ai: "border-violet-200 bg-violet-50 text-violet-700",
        pending: "border-slate-200 bg-slate-50 text-slate-600",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  icon?: LucideIcon;
  /** Show a small leading status dot instead of an icon. */
  dot?: boolean;
  pulse?: boolean;
}

const dotTone: Record<string, string> = {
  neutral: "bg-muted-foreground",
  info: "bg-blue-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  overdue: "bg-red-600",
  ai: "bg-violet-500",
  pending: "bg-slate-400",
};

/**
 * One consistent badge for status, priority, overdue, AI and risk indicators.
 * Prefer this over ad-hoc <Badge> colour combinations.
 */
export function StatusBadge({
  tone,
  icon: Icon,
  dot = false,
  pulse = false,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ tone }), className)} {...props}>
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && (
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                dotTone[tone ?? "neutral"]
              )}
            />
          )}
          <span
            className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", dotTone[tone ?? "neutral"])}
          />
        </span>
      )}
      {!dot && Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
      {children}
    </span>
  );
}

export { statusBadgeVariants };
