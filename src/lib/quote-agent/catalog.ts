/**
 * Live catalog access for the quote agent. Prices ONLY ever come from the Firestore `services`
 * collection. Gemini picks slugs from the list we give it; this module validates them and builds
 * the fee schedule, adding any services that the requested ones require.
 *
 * `serviceWarnings` is shared with .agents/skills/quote-generator/scripts/lookup_price.ts so the
 * manual tool and the cloud agent refuse the same prices.
 */
import { getAdminDb } from '@/lib/firebase-admin';
import { QUOTE_POLICY } from './config';
import type { CatalogService, QuoteLine, ResolvedQuote } from './types';

type RawService = Record<string, any>;

function toTextList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(v => (typeof v === 'string' ? v : v && typeof v === 'object' ? (v as any).label || (v as any).text || (v as any).title || '' : ''))
    .map(s => String(s).trim())
    .filter(Boolean);
}

/** Reasons a service must not be quoted. Empty array = safe to quote. */
export function serviceWarnings(data: RawService, today = new Date().toISOString().slice(0, 10)): string[] {
  const price = Number(data.price) || 0;
  const isPriceTbc = data.isPriceTbc === true;
  const available = !data.availability || data.availability === 'in_stock';
  const validUntil = data.priceValidUntilOverride ? String(data.priceValidUntilOverride) : undefined;
  const w: string[] = [];
  if (isPriceTbc) w.push('PRICE TBC - do not quote; route to Kevin.');
  if (!isPriceTbc && price <= 0) w.push('Price is R0 - confirm this is a free service before quoting.');
  if (!Number.isInteger(price)) w.push(`Unusual price (${price}) - likely a data error; confirm with Kevin.`);
  if (!available) w.push(`Service availability is "${data.availability}" - do not quote.`);
  if (validUntil && validUntil.slice(0, 10) < today) w.push(`Price validity expired on ${validUntil.slice(0, 10)} - confirm with Kevin.`);
  if (data.currency && data.currency !== 'ZAR') w.push(`Currency is ${data.currency}, not ZAR.`);
  return w;
}

export class Catalog {
  private constructor(private readonly byId: Map<string, RawService>, private readonly bySlug: Map<string, string>) {}

  static async load(): Promise<Catalog> {
    const snap = await getAdminDb().collection('services').get();
    const byId = new Map<string, RawService>();
    const bySlug = new Map<string, string>();
    for (const d of snap.docs) {
      const data = d.data();
      byId.set(d.id, data);
      bySlug.set(String(data.slug || d.id).toLowerCase(), d.id);
    }
    return new Catalog(byId, bySlug);
  }

  /** For tests and dry runs. */
  static fromRecords(records: Array<{ id: string } & RawService>): Catalog {
    const byId = new Map(records.map(r => [r.id, r] as [string, RawService]));
    const bySlug = new Map(records.map(r => [String(r.slug || r.id).toLowerCase(), r.id] as [string, string]));
    return new Catalog(byId, bySlug);
  }

  get size(): number {
    return this.byId.size;
  }

  /** Compact list for the classifier prompt: slug | title | category. No prices (the AI never sees or writes them). */
  promptList(): string {
    return [...this.byId.entries()]
      .filter(([, d]) => !d.availability || d.availability === 'in_stock')
      .map(([id, d]) => `${d.slug || id} | ${d.title || d.name || ''} | ${d.category || ''}`)
      .sort()
      .join('\n');
  }

  get(slugOrId: string): CatalogService | null {
    const key = slugOrId.trim().toLowerCase();
    const id = this.bySlug.get(key) || (this.byId.has(slugOrId) ? slugOrId : undefined);
    if (!id) return null;
    const data = this.byId.get(id)!;
    const slug = String(data.slug || id);
    const requiredServices = (Array.isArray(data.requiredProductIds) ? data.requiredProductIds : [])
      .filter((rid: string) => this.byId.has(rid))
      .map((rid: string) => {
        const r = this.byId.get(rid)!;
        return { id: rid, title: String(r.title || r.name || ''), price: Number(r.price) || 0, slug: String(r.slug || rid) };
      });
    return {
      id,
      slug,
      title: String(data.title || data.name || ''),
      price: Number(data.price) || 0,
      url: `https://www.myacc.co.za/products/${slug}`,
      category: data.category,
      turnaroundTime: data.turnaroundTime || data.estimatedDays || undefined,
      shortDescription: String(data.shortDescription || data.description || '').slice(0, 160),
      priceValidUntil: data.priceValidUntilOverride ? String(data.priceValidUntilOverride).slice(0, 10) : undefined,
      whatsIncluded: toTextList(data.whatsIncluded),
      clientRequirements: toTextList(data.clientRequirements),
      prerequisites: toTextList(data.prerequisites),
      requiredServices,
      warnings: serviceWarnings(data),
    };
  }

  /** Builds the fee schedule from AI-selected slugs. Never invents a price. */
  resolve(slugs: string[], now = new Date()): ResolvedQuote {
    const requested: CatalogService[] = [];
    const unknownSlugs: string[] = [];
    const seen = new Set<string>();
    for (const s of slugs) {
      const svc = this.get(s);
      if (!svc) { unknownSlugs.push(s); continue; }
      if (seen.has(svc.id)) continue;
      seen.add(svc.id);
      requested.push(svc);
    }

    const lines: QuoteLine[] = [];
    const warnings: string[] = [];
    const add = (svc: CatalogService, requiredBy?: string) => {
      lines.push({ slug: svc.slug, title: svc.title, price: svc.price, url: svc.url, turnaround: svc.turnaroundTime || 'See service page', requiredBy });
      for (const w of svc.warnings) warnings.push(`${svc.title}: ${w}`);
    };
    for (const svc of requested) add(svc);
    // Required add-ons go on the fee schedule too (SKILL.md §Mandatory Pre-Quotation Catalog Query, rule 4).
    for (const svc of requested) {
      for (const r of svc.requiredServices) {
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        const req = this.get(r.id);
        if (req) add(req, svc.title);
      }
    }

    const dates = [...requested, ...lines.map(l => this.get(l.slug)).filter(Boolean) as CatalogService[]]
      .map(s => s.priceValidUntil)
      .filter(Boolean) as string[];
    const fallback = new Date(now.getTime() + QUOTE_POLICY.defaultValidityDays * 86_400_000).toISOString().slice(0, 10);
    const validUntil = dates.length ? dates.sort()[0] : fallback;

    const clientRequirements = [...new Set(requested.flatMap(s => s.clientRequirements))].slice(0, 6);
    const total = lines.reduce((sum, l) => sum + l.price, 0);
    return { lines, requested, unknownSlugs, warnings, total, validUntil, clientRequirements };
  }
}
