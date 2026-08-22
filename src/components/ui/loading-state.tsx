import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A loading indicator that assistive technology can actually perceive.
 *
 * The application had 351 `animate-spin` elements and 506 `Loader2` references, and ZERO
 * `aria-live`, `aria-busy` or `role="progressbar"` anywhere. A screen-reader user therefore got
 * complete silence during every data load and every form submission, then content appeared with
 * no announcement — indistinguishable from a page that had simply broken.
 *
 * `role="status"` creates a polite live region, so the label is announced when it appears and
 * again when it is removed. The spinner itself is hidden from the accessibility tree, since the
 * text carries the meaning.
 */
export function LoadingState({
  label = 'Loading…',
  className,
  size = 'md',
}: {
  /** Announced to screen readers. Be specific where you can, e.g. "Loading orders". */
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const spinnerSize = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-10 w-10' : 'h-8 w-8';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn('flex min-h-40 flex-col items-center justify-center gap-3', className)}
    >
      <Loader2 className={cn(spinnerSize, 'animate-spin text-primary')} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * Inline variant for use inside a button or next to a control, where the surrounding label
 * already describes what is happening.
 */
export function InlineSpinner({ label = 'Working…' }: { label?: string }) {
  return (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
      <span className="sr-only" role="status" aria-live="polite">{label}</span>
    </>
  );
}
