/**
 * @fileOverview Utilities for dynamic director count and numbered director slot linkage.
 * Supports products like Remove Director, Director Resignation, and Company Registrations
 * where the client indicates how many directors are resigning or being registered (1 to 5+),
 * dynamically activating or skipping the corresponding "Director N: Full Name" inputs.
 */

/**
 * Detects if a requirement label is asking for the number/count of directors.
 * Matches: "Number of directors resigning or being removed", "How many directors...",
 * "Number of directors to register", "Number of directors", etc.
 */
export function isDirectorCountRequirement(label: string): boolean {
  if (!label) return false;
  const clean = label.trim();
  return (
    /^(number of directors|how many directors)\b/i.test(clean) ||
    /directors?\s*(resigning|being removed|to register|count)/i.test(clean)
  );
}

/**
 * Parses the numeric count of directors from a string value.
 * Handles "1", "2", "3", "4", "5", "5+", "2 Directors", etc.
 * Returns null if not answered or not a valid number.
 */
export function parseDirectorCount(value?: string | number | null): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return isNaN(value) || value < 1 ? null : Math.floor(value);
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d+)/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  return isNaN(num) || num < 1 ? null : num;
}

/**
 * Detects if a requirement label is for a specific numbered director slot.
 * Matches: "Director 1: Full Name", "Director 2: Full Name", "Director 1 Full Name", etc.
 * Returns the 1-based index (e.g. 1, 2, 3) or null if not a numbered director requirement.
 */
export function getNumberedDirectorIndex(label: string): number | null {
  if (!label || typeof label !== 'string') return null;
  const match = label.trim().match(/^director\s*(\d+)[:\s]/i);
  if (!match) return null;
  const idx = parseInt(match[1], 10);
  return isNaN(idx) || idx < 1 ? null : idx;
}

/**
 * Evaluates whether a numbered director requirement is active, skipped, or pending count selection.
 */
export function evaluateDirectorSlotStatus(
  reqLabel: string,
  sisterCountValue?: string | null
): 'active' | 'skipped' | 'pending_count' | 'not_numbered' {
  const directorIdx = getNumberedDirectorIndex(reqLabel);
  if (directorIdx === null) return 'not_numbered';

  // Director 1 is always active if this service has director requirements
  if (directorIdx === 1) return 'active';

  const count = parseDirectorCount(sisterCountValue);
  if (count === null) {
    return 'pending_count';
  }

  return directorIdx <= count ? 'active' : 'skipped';
}
