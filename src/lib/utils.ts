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

/**
 * Determines whether a staff/user account is active and eligible for task/order assignment.
 * Checks all active flags across the database: isActive !== false, disabled !== true,
 * and status !== 'Inactive' | 'Deactivated' | 'Archived'.
 */
export function isStaffActive(user?: { isActive?: boolean; disabled?: boolean; status?: string } | null): boolean {
  if (!user) return false;
  if (user.isActive === false) return false;
  if (user.disabled === true) return false;
  if (typeof user.status === 'string') {
    const s = user.status.trim().toLowerCase();
    if (s === 'inactive' || s === 'deactivated' || s === 'archived' || s === 'pending setup payment') {
      return false;
    }
  }
  return true;
}

export const ORDER_FULFILLMENT_ROLES = [
  'admin',
  'staff',
  'consultant',
  'senior_accountant',
  'accountant',
  'support_agent'
] as const;

export const NON_ORDER_ROLES = [
  'cap_staff',
  'cap_supervisor',
  'ai_accountant',
  'client',
  'supplier'
] as const;

/**
 * Determines whether a user is an active staff member eligible for order assignment.
 * Explicitly excludes CAP Staff, CAP Supervisor, AI Accountant, Client, and inactive accounts.
 */
export function isEligibleOrderStaff(user?: { role?: string; isActive?: boolean; disabled?: boolean; status?: string } | null): boolean {
  if (!user) return false;
  if (!isStaffActive(user)) return false;
  if (!user.role) return false;
  if (user.role === 'cap_staff' || user.role === 'cap_supervisor' || user.role === 'ai_accountant' || user.role === 'client' || user.role === 'supplier') {
    return false;
  }
  return ORDER_FULFILLMENT_ROLES.includes(user.role as any);
}

/**
 * Detects Next.js Server Action mismatch errors that occur when a user's browser
 * session spans across a new production deployment (outdated action ID hash).
 */
export function isServerActionMismatchError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error || '');
  return (
    msg.includes('failed-to-find-server-action') ||
    msg.includes('was not found on the server') ||
    msg.includes('Failed to find Server Action')
  );
}

/**
 * Deeply strips `undefined` properties from an object or array to prevent
 * Firestore WriteBatch.set() / setDoc() "Unsupported field value: undefined" errors.
 * Preserves Date, Firestore Timestamp, and Firestore FieldValues (serverTimestamp, deleteField, etc).
 */
export function sanitizeFirestoreData<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;
  if (data instanceof Date) return data;
  
  // Preserve Firestore Timestamp or FieldValue objects
  if (
    typeof (data as any)?.toDate === 'function' ||
    typeof (data as any)?.toMillis === 'function' ||
    (data as any)?._methodName !== undefined ||
    (data as any)?._delegate !== undefined ||
    data?.constructor?.name === 'FieldValue' ||
    data?.constructor?.name === 'Timestamp'
  ) {
    return data;
  }

  if (Array.isArray(data)) {
    return data
      .map(item => sanitizeFirestoreData(item))
      .filter(item => item !== undefined) as any;
  }

  const cleaned: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      const sanitized = sanitizeFirestoreData(value);
      if (sanitized !== undefined) {
        cleaned[key] = sanitized;
      }
    }
  }
  return cleaned;
}
