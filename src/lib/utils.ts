import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
