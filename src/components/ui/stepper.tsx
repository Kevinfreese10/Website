"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepperStep {
  label: string;
  description?: string;
}

export interface StepperProps extends React.HTMLAttributes<HTMLOListElement> {
  steps: StepperStep[];
  /** Zero-based index of the current step. Steps before it render as complete. */
  currentStep: number;
  orientation?: "horizontal" | "vertical";
}

/**
 * Status stepper for multi-stage workflows (order progress, onboarding).
 * Completed steps get a check, the active step a highlighted ring.
 */
export function Stepper({
  steps,
  currentStep,
  orientation = "horizontal",
  className,
  ...props
}: StepperProps) {
  const horizontal = orientation === "horizontal";
  return (
    <ol
      className={cn(
        "flex",
        horizontal ? "w-full items-start" : "flex-col gap-0",
        className
      )}
      {...props}
    >
      {steps.map((step, i) => {
        const complete = i < currentStep;
        const active = i === currentStep;
        const last = i === steps.length - 1;
        return (
          <li
            key={i}
            className={cn("relative flex", horizontal ? "flex-1 flex-col items-center text-center" : "gap-3 pb-8 last:pb-0")}
            aria-current={active ? "step" : undefined}
          >
            {/* Connector */}
            {!last && horizontal && (
              <span
                className={cn(
                  "absolute left-1/2 top-4 -z-10 h-0.5 w-full transition-colors duration-slow",
                  complete ? "bg-primary" : "bg-border"
                )}
                aria-hidden="true"
              />
            )}
            {!last && !horizontal && (
              <span
                className={cn(
                  "absolute left-4 top-8 -z-10 h-full w-0.5 -translate-x-1/2 transition-colors duration-slow",
                  complete ? "bg-primary" : "bg-border"
                )}
                aria-hidden="true"
              />
            )}
            {/* Marker */}
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-background text-sm font-semibold transition-all duration-base",
                complete && "border-primary bg-primary text-primary-foreground",
                active && "border-primary text-primary ring-4 ring-primary/15",
                !complete && !active && "border-border text-muted-foreground"
              )}
            >
              {complete ? <Check className="h-4 w-4 animate-scale-in" aria-hidden="true" /> : i + 1}
            </span>
            {/* Labels */}
            <span className={cn(horizontal ? "mt-2 px-1" : "pt-1")}>
              <span
                className={cn(
                  "block text-sm font-medium",
                  active || complete ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
              {step.description && (
                <span className="block text-xs text-muted-foreground">{step.description}</span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
