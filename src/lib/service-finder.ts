/**
 * Service Finder — shared, framework-free logic for the "Which service are you looking for today?"
 * modal. Kept pure (no React, no Firebase) so it can be unit-tested and reused by the API route.
 */

export type ServiceFinderGroupId = 'tax' | 'registration' | 'accounting' | 'industry' | 'licences' | 'other';

export interface ServiceFinderItem {
  /** Unique key (service slug, or `page:<path>` for landing-page entries). */
  id: string;
  title: string;
  /** Destination URL the visitor is taken to when choosing this item. */
  href: string;
  /** Price in ZAR. `null` = quoted on request. */
  price: number | null;
  /** Human-readable completion estimate, already normalised (e.g. "3 to 5 working days"). */
  turnaround: string;
  group: ServiceFinderGroupId;
  /** Lower-cased, pre-normalised search text (synonyms, meta keywords, category, short description). */
  keywords: string;
  /** Position in the curated "popular" list, or undefined if not popular. */
  popularRank?: number;
}

export const SERVICE_FINDER_GROUPS: { id: ServiceFinderGroupId; label: string; categories: string[] }[] = [
  { id: 'tax', label: 'Tax & SARS', categories: ['SARS Services', 'SARS Registrations'] },
  { id: 'registration', label: 'Company Registration & CIPC', categories: ['Entity Registrations', 'CIPC Services'] },
  { id: 'accounting', label: 'Accounting & Payroll', categories: ['Accounting Services', 'COIDA Services'] },
  { id: 'industry', label: 'Industry Registrations', categories: ['NCR Registrations', 'NCCA Registrations', 'NHBRC Registration', 'CIDB Services'] },
  { id: 'licences', label: 'Licences & Compliance', categories: ['Licences & Permits', 'Compliance & Governance'] },
];

export const POPULAR_SERVICE_SLUGS = [
  'private-company-registration',
  'vat-registration',
  'individual-income-tax-return-itr12-simple',
  'tax-clearance-pin',
  'annual-returns',
  'beneficial-ownership-declaration',
  'paye-registration',
  'bee-affidavit',
];

/**
 * Ongoing services that live on landing pages rather than as fixed-price products. Without these,
 * searches like "bookkeeping" or "payroll" would only surface once-off SARS filings.
 */
export const LANDING_PAGE_ENTRIES: ServiceFinderItem[] = [
  {
    id: 'page:/monthly-accounting',
    title: 'Monthly Accounting & Bookkeeping',
    href: '/monthly-accounting',
    price: null,
    turnaround: 'Ongoing monthly service',
    group: 'accounting',
    keywords: 'bookkeeping books monthly accounting accountant retainer management accounts xero sage',
  },
  {
    id: 'page:/monthly-payroll',
    title: 'Monthly Payroll Services',
    href: '/monthly-payroll',
    price: null,
    turnaround: 'Ongoing monthly service',
    group: 'accounting',
    keywords: 'payroll payslips salaries wages employees paye uif sdl emp201 irp5 outsourced',
  },
  {
    id: 'page:/sars-disputes',
    title: 'SARS Disputes & Objections',
    href: '/sars-disputes',
    price: null,
    turnaround: 'Depends on SARS timelines',
    group: 'tax',
    keywords: 'objection dispute appeal nod notice of objection audit verification assessment',
  },
  {
    id: 'page:/liquidations',
    title: 'Voluntary Liquidation',
    href: '/liquidations',
    price: null,
    turnaround: 'Quoted per matter',
    group: 'registration',
    keywords: 'liquidation close company wind up winding cm100 insolvent',
  },
];

/** Search synonyms: if a query token matches a key, the listed phrases are also considered matches. */
const SYNONYMS: Record<string, string[]> = {
  pty: ['company'],
  ltd: ['company'],
  business: ['company'],
  register: ['registration'],
  tcs: ['tax clearance'],
  clearance: ['tax clearance'],
  pin: ['tax clearance'],
  bee: ['bbbee', 'b bbee'],
  bbbee: ['bee'],
  return: ['return', 'itr12', 'itr14'],
  personal: ['individual', 'itr12'],
  salary: ['payroll', 'paye'],
  employee: ['payroll', 'paye', 'uif'],
  books: ['bookkeeping', 'accounting'],
  afs: ['annual financial statements'],
  financials: ['annual financial statements'],
  director: ['director'],
  shareholder: ['share'],
  close: ['deregistration', 'liquidation'],
  dormant: ['nil', 'deregistration'],
  penalty: ['remission', 'penalties'],
  penalties: ['remission'],
  fine: ['remission'],
  npo: ['non profit', 'npo'],
  ngo: ['non profit', 'npo', 'pbo'],
  workmans: ['coida'],
  compensation: ['coida'],
  tender: ['csd', 'tender', 'bee'],
  construction: ['cidb', 'nhbrc'],
  builder: ['nhbrc', 'cidb'],
  credit: ['ncr'],
  loan: ['ncr', 'business plan'],
  funding: ['business plan'],
  liquor: ['liquor'],
  privacy: ['popia', 'paia'],
};

export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** "21 - 30 working days, subject to SARS..." -> "21 to 30 working days" */
export function formatTurnaround(raw: string | undefined | null): string {
  if (!raw) return 'Contact us for timing';
  let t = raw.split(/[.,;(]/)[0].trim();
  t = t.replace(/\bupon receipt.*$/i, '').trim();
  t = t.replace(/^approximately\s+/i, 'About ');
  t = t.replace(/(\d+)\s*[-–]\s*(\d+)/g, '$1 to $2');
  t = t.replace(/\bbusiness days\b/i, 'working days');
  return t || 'Contact us for timing';
}

export function groupForCategory(category: string | undefined): ServiceFinderGroupId {
  const match = SERVICE_FINDER_GROUPS.find(g => g.categories.includes(category || ''));
  return match ? match.id : 'other';
}

export function groupLabel(id: ServiceFinderGroupId): string {
  return SERVICE_FINDER_GROUPS.find(g => g.id === id)?.label ?? 'Other Services';
}

interface RawService {
  slug: string;
  title: string;
  price?: number;
  isPriceTbc?: boolean;
  turnaroundTime?: string;
  category?: string;
  description?: string;
  metaKeywords?: string[];
}

export function toFinderItem(s: RawService): ServiceFinderItem {
  const rank = POPULAR_SERVICE_SLUGS.indexOf(s.slug);
  const keywords = normalise(
    [s.category || '', (s.metaKeywords || []).slice(0, 8).join(' '), (s.description || '').slice(0, 120), s.slug.replace(/-/g, ' ')].join(' ')
  );
  return {
    id: s.slug,
    title: s.title,
    href: `/products/${s.slug}`,
    price: s.isPriceTbc || typeof s.price !== 'number' ? null : s.price,
    turnaround: formatTurnaround(s.turnaroundTime),
    group: groupForCategory(s.category),
    keywords,
    popularRank: rank >= 0 ? rank : undefined,
  };
}

function wordPrefixMatch(words: string[], token: string): boolean {
  return words.some(w => w.startsWith(token));
}

/**
 * Scores a single item against already-normalised query tokens. Returns 0 when any token fails to
 * match (all tokens must match somewhere). Word-prefix matching avoids noise like "vat" -> "private".
 */
function scoreItem(item: ServiceFinderItem, tokens: string[], fullQuery: string): number {
  const titleNorm = normalise(item.title);
  const titleWords = titleNorm.split(' ');
  const titleCompact = titleNorm.replace(/ /g, '');
  const keywordWords = item.keywords.split(' ');
  const groupWords = normalise(groupLabel(item.group)).split(' ');

  let score = 0;
  for (const token of tokens) {
    const alternatives = [token, ...(SYNONYMS[token] || []).map(normalise)];
    let best = 0;
    for (const alt of alternatives) {
      const isSynonym = alt !== token;
      const altWords = alt.split(' ');
      const multi = altWords.length > 1;
      let s = 0;
      if (multi ? titleNorm.includes(alt) : wordPrefixMatch(titleWords, alt)) s = 10;
      else if (alt.length >= 4 && titleCompact.includes(alt.replace(/ /g, ''))) s = 7;
      else if (multi ? item.keywords.includes(alt) : wordPrefixMatch(keywordWords, alt)) s = 4;
      else if (wordPrefixMatch(groupWords, alt)) s = 2;
      if (isSynonym) s = Math.floor(s * 0.6);
      best = Math.max(best, s);
    }
    if (best === 0) return 0;
    score += best;
  }
  if (titleNorm.startsWith(fullQuery)) score += 8;
  if (item.popularRank !== undefined) score += 2;
  return score;
}

export function searchServices(items: ServiceFinderItem[], query: string, limit = 30): ServiceFinderItem[] {
  const fullQuery = normalise(query);
  if (!fullQuery) return [];
  const tokens = fullQuery.split(' ').filter(Boolean);
  return items
    .map(item => ({ item, score: scoreItem(item, tokens, fullQuery) }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .slice(0, limit)
    .map(r => r.item);
}

export function getPopularServices(items: ServiceFinderItem[], count = 6): ServiceFinderItem[] {
  return items
    .filter(i => i.popularRank !== undefined)
    .sort((a, b) => (a.popularRank as number) - (b.popularRank as number))
    .slice(0, count);
}

/** Plain-text summary used for screen readers, e.g. "Company registration, R 950, 1 to 3 working days". */
export function describeItem(item: ServiceFinderItem, formattedPrice: string): string {
  return `${item.title}, ${formattedPrice}, ${item.turnaround}`;
}

// ---------------------------------------------------------------------------------------------
// Open / dismissal state
// ---------------------------------------------------------------------------------------------

export const SERVICE_FINDER_STORAGE_KEY = 'myacc_service_finder_v1';
export const SERVICE_FINDER_OPEN_EVENT = 'myacc:open-service-finder';

declare global {
  interface Window {
    __myaccServiceFinderPending?: boolean;
  }
}

/**
 * Opens the Service Finder from anywhere (header button, CTAs). The modal is lazy-loaded, so if it
 * hasn't mounted yet we leave a pending flag that it consumes on mount.
 */
export function openServiceFinder() {
  if (typeof window === 'undefined') return;
  window.__myaccServiceFinderPending = true;
  window.dispatchEvent(new Event(SERVICE_FINDER_OPEN_EVENT));
}

/** Routes where the modal must never pop up on its own (visitor already has clear intent). */
const AUTO_OPEN_EXCLUDED_PREFIXES = [
  '/products',
  '/cart',
  '/checkout',
  '/login',
  '/signup',
  '/order-confirmation',
  '/payment-success',
  '/contact',
  '/blog/',
  '/calculators',
  '/admin',
  '/dashboard',
  '/partner',
  '/p/',
];

export function isAutoOpenEligiblePath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return !AUTO_OPEN_EXCLUDED_PREFIXES.some(p => pathname === p.replace(/\/$/, '') || pathname.startsWith(p));
}
