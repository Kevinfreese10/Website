import { VatType } from './types';

export const allVatTypes: { name: VatType, label: string, category: 'Output Tax' | 'Input Tax' | 'Other' }[] = [
    { name: 'standard_rated_sales', label: 'Standard-rated supplies (15%)', category: 'Output Tax' },
    { name: 'zero_rated_sales', label: 'Zero-rated supplies (0%)', category: 'Output Tax' },
    { name: 'exempt_sales', label: 'Exempt supplies', category: 'Output Tax' },
    { name: 'standard_rated_purchases', label: 'Standard-rated purchases (15%)', category: 'Input Tax' },
    { name: 'capital_goods_purchases', label: 'Capital goods (15%)', category: 'Input Tax' },
    { name: 'zero_rated_purchases', label: 'Zero-rated purchases (0%)', category: 'Input Tax' },
    { name: 'exempt_purchases', label: 'Exempt purchases', category: 'Input Tax' },
    { name: 'no_vat', label: 'No VAT', category: 'Other' },
];

export type CanonicalVatType = VatType;
export type { VatType };

export const CANONICAL_VAT_TYPES: Set<VatType> = new Set([
  'standard_rated_purchases',
  'zero_rated_purchases',
  'exempt_purchases',
  'capital_goods_purchases',
  'no_vat',
  'standard_rated_sales',
  'zero_rated_sales',
  'exempt_sales'
]);

export function normalizeVatType(raw: string | undefined, isExpense: boolean = true): VatType {
  if (!raw) return 'no_vat';
  const clean = raw.toLowerCase().trim();
  if (CANONICAL_VAT_TYPES.has(clean as VatType)) {
    return clean as VatType;
  }
  if (clean.includes('zero')) return isExpense ? 'zero_rated_purchases' : 'zero_rated_sales';
  if (clean.includes('exempt')) return isExpense ? 'exempt_purchases' : 'exempt_sales';
  if (clean.includes('capital')) return 'capital_goods_purchases';
  if (clean.includes('standard') || clean.includes('15')) return isExpense ? 'standard_rated_purchases' : 'standard_rated_sales';
  return 'no_vat';
}
