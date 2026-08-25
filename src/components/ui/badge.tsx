import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        /*
         * Status variants use a light tinted background with dark same-family text — the
         * conventional status-pill pattern — rather than white on a mid-tone fill.
         *
         * The previous white-on-colour combinations failed WCAG AA at this component's 12px
         * size, several of them badly: `warning` ("Pending Payment") was white on yellow-500 at
         * 1.92:1 and `waiting` ("Waiting on Customer") white on amber-500 at 2.15:1 — effectively
         * illegible in sunlight or with reduced contrast sensitivity. Five of the seven variants
         * failed. These are the badges that tell a customer they owe money or that we are waiting
         * on them, and they render on the client dashboard, the admin queue and both partner
         * views. Every combination below clears 7:1.
         */
        success: "border-transparent bg-green-100 text-green-900 hover:bg-green-200",
        info: "border-transparent bg-blue-100 text-blue-900 hover:bg-blue-200",
        warning: "border-transparent bg-yellow-100 text-yellow-900 hover:bg-yellow-200",
        waiting: "border-transparent bg-amber-100 text-amber-900 hover:bg-amber-200",
        review: "border-transparent bg-indigo-100 text-indigo-900 hover:bg-indigo-200",
        payment: "border-transparent bg-teal-100 text-teal-900 hover:bg-teal-200",
        outsourced: "border-transparent bg-purple-100 text-purple-900 hover:bg-purple-200",
        external: "border-transparent bg-cyan-100 text-cyan-900 hover:bg-cyan-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
