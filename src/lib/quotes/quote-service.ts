import { getAdminDb } from '@/lib/firebase-admin';
import { services as defaultServices } from '@/lib/data';
import { Service } from '@/lib/types';

export interface QuotationLineItem {
  serviceId?: string;
  slug?: string;
  title: string;
  quotedPrice: number;
  quantity?: number;
}

export interface QuoteValidationResult {
  valid: boolean;
  totalQuoted: number;
  totalCatalog: number;
  items: Array<{
    title: string;
    quotedPrice: number;
    catalogPrice: number;
    matchesCatalog: boolean;
    difference: number;
  }>;
  errors: string[];
}

/**
 * Validates formal quotation prices against the live Firestore services catalog
 * to guarantee that quotes sent to prospective clients reflect authentic pricing.
 */
export async function validateQuotationPricing(
  items: QuotationLineItem[]
): Promise<QuoteValidationResult> {
  const db = getAdminDb();
  let liveServices: Service[] = [];

  try {
    const snap = await db.collection('services').get();
    if (!snap.empty) {
      liveServices = snap.docs.map(d => ({ id: d.id, ...d.data() } as Service));
    }
  } catch (err) {
    console.warn('[quote-service] Could not fetch live services from Firestore, falling back to local dataset:', err);
    liveServices = defaultServices as Service[];
  }

  if (liveServices.length === 0) {
    liveServices = defaultServices as Service[];
  }

  const errors: string[] = [];
  let totalQuoted = 0;
  let totalCatalog = 0;

  const itemResults = items.map(item => {
    const qty = item.quantity || 1;
    totalQuoted += item.quotedPrice * qty;

    // Find service in catalog by ID, slug, or normalized title
    const matchedService = liveServices.find(s => 
      (item.serviceId && s.id === item.serviceId) ||
      (item.slug && s.slug === item.slug) ||
      s.title.toLowerCase().trim() === item.title.toLowerCase().trim()
    );

    if (!matchedService) {
      errors.push(`Service "${item.title}" was not found in the official services catalog.`);
      return {
        title: item.title,
        quotedPrice: item.quotedPrice,
        catalogPrice: 0,
        matchesCatalog: false,
        difference: item.quotedPrice,
      };
    }

    const catalogPrice = matchedService.price;
    totalCatalog += catalogPrice * qty;
    const matchesCatalog = Math.abs(item.quotedPrice - catalogPrice) < 0.01;

    if (!matchesCatalog) {
      errors.push(
        `Price mismatch for "${matchedService.title}": Quoted R${item.quotedPrice.toFixed(2)}, but official catalog price is R${catalogPrice.toFixed(2)}.`
      );
    }

    return {
      title: matchedService.title,
      quotedPrice: item.quotedPrice,
      catalogPrice,
      matchesCatalog,
      difference: item.quotedPrice - catalogPrice,
    };
  });

  return {
    valid: errors.length === 0,
    totalQuoted,
    totalCatalog,
    items: itemResults,
    errors,
  };
}
