"use client";

import * as React from "react";

export interface AnimatedNumberProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  /** Formatter, e.g. (v) => `R${v.toLocaleString()}`. Defaults to locale string. */
  format?: (value: number) => string;
  durationMs?: number;
}

/**
 * Counts up (or down) to a value on mount and when it changes.
 * Respects prefers-reduced-motion by jumping straight to the value.
 */
export function AnimatedNumber({
  value,
  format = (v) => Math.round(v).toLocaleString(),
  durationMs = 800,
  ...props
}: AnimatedNumberProps) {
  const [display, setDisplay] = React.useState(0);
  const fromRef = React.useRef(0);
  const rafRef = React.useRef<number>(0);

  React.useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      fromRef.current = value;
      setDisplay(value);
      return;
    }
    const from = fromRef.current;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 4); // ease-out-quart
      setDisplay(from + (value - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, durationMs]);

  return (
    <span aria-live="polite" {...props}>
      {format(display)}
    </span>
  );
}
