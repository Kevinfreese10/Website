import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format as formatDateFns } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Coerces the many date shapes found across this codebase (Firestore Timestamp objects with a
 * .toDate() method, JS Date instances, ISO strings, epoch numbers) into a single JS Date, or
 * null if the value can't be parsed. Centralizing this avoids each call site reinventing its
 * own (sometimes inconsistent) parsing logic.
 */
function coerceToDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as any).toDate === 'function') {
    const d = (value as any).toDate();
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Unified date formatting across the user-facing site, mirroring formatPrice(). Two sanctioned
 * variants (per the UX audit recommendation, replacing the six-plus ad hoc formats previously
 * in circulation):
 *  - 'short' (default): "15 Aug 2026" — for tables, lists, compact UI.
 *  - 'long': "15 August 2026" — for headings, formal documents, invoices.
 *  - 'datetime': "15 Aug 2026, 14:32" — where the time also matters.
 * Returns a fallback string (default "—") for missing/invalid input instead of throwing.
 */
export function formatDate(value: unknown, variant: 'short' | 'long' | 'datetime' = 'short', fallback: string = '—'): string {
  const date = coerceToDate(value);
  if (!date) return fallback;

  switch (variant) {
    case 'long':
      return formatDateFns(date, 'd MMMM yyyy');
    case 'datetime':
      return formatDateFns(date, 'd MMM yyyy, HH:mm');
    case 'short':
    default:
      return formatDateFns(date, 'd MMM yyyy');
  }
}

/**
 * Unified price formatting across the user-facing site.
 * Enforces "R 1 950" format (space-separated, no decimals) as requested.
 */
export function formatPrice(price: number): string {
  const formatted = new Intl.NumberFormat('en-ZA', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
  
  // Replace commas or normal spaces with non-breaking spaces to prevent line breaks
  return `R\u00A0${formatted.replace(/,/g, '\u00A0').replace(/\s/g, '\u00A0')}`;
}
