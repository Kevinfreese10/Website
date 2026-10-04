import { describe, it, expect } from 'vitest';
import {
  formatTurnaround,
  getPopularServices,
  groupForCategory,
  isAutoOpenEligiblePath,
  searchServices,
  toFinderItem,
  LANDING_PAGE_ENTRIES,
} from '@/lib/service-finder';

const items = [
  toFinderItem({ slug: 'vat-registration', title: 'VAT Registration', price: 1800, turnaroundTime: '21-30 working days', category: 'SARS Registrations' }),
  toFinderItem({ slug: 'vat-deregistration', title: 'VAT Deregistration', price: 1150, turnaroundTime: '10-15 working days', category: 'SARS Registrations' }),
  toFinderItem({ slug: 'private-company-registration', title: 'Private Company Registration', price: 950, turnaroundTime: '1-3 working days', category: 'Entity Registrations' }),
  toFinderItem({ slug: 'tax-clearance-pin', title: 'Tax Clearance Pin', price: 350, turnaroundTime: '1-2 working days', category: 'SARS Services' }),
  toFinderItem({ slug: 'bee-affidavit', title: 'BEE Affidavit', price: 450, turnaroundTime: '1 working day', category: 'Accounting Services' }),
  toFinderItem({ slug: 'individual-income-tax-return-itr12-simple', title: 'Individual Income Tax Return ITR12 (Simple)', price: 750, turnaroundTime: '1-2 working days', category: 'SARS Services' }),
  toFinderItem({ slug: 'cipc-annual-fees', title: 'CIPC Annual Fees', price: 100, isPriceTbc: true, turnaroundTime: '1 working day', category: 'CIPC Services' }),
  ...LANDING_PAGE_ENTRIES,
];

const titles = (q: string) => searchServices(items, q).map(i => i.title);

describe('service-finder search', () => {
  it('"VAT" finds VAT registration first and does not match "Private"', () => {
    const r = titles('VAT');
    expect(r[0]).toBe('VAT Registration');
    expect(r).toContain('VAT Deregistration');
    expect(r).not.toContain('Private Company Registration');
  });

  it('is case-insensitive and supports prefixes while typing', () => {
    expect(titles('vat reg')[0]).toBe('VAT Registration');
    expect(titles('comp')).toContain('Private Company Registration');
  });

  it('resolves synonyms (pty, tcs, payroll, bookkeeping)', () => {
    expect(titles('pty')).toContain('Private Company Registration');
    expect(titles('tcs')).toContain('Tax Clearance Pin');
    expect(titles('payroll')).toContain('Monthly Payroll Services');
    expect(titles('bookkeeping')).toContain('Monthly Accounting & Bookkeeping');
  });

  it('matches compact forms such as ITR12 and B-BBEE', () => {
    expect(titles('itr12')[0]).toContain('ITR12');
    expect(titles('bbbee')).toContain('BEE Affidavit');
  });

  it('returns nothing for unknown terms and for empty queries', () => {
    expect(titles('helicopter licence')).toEqual([]);
    expect(titles('   ')).toEqual([]);
  });
});

describe('service-finder formatting and grouping', () => {
  it('normalises turnaround text', () => {
    expect(formatTurnaround('3-5 working days')).toBe('3 to 5 working days');
    expect(formatTurnaround('21 - 30 working days')).toBe('21 to 30 working days');
    expect(formatTurnaround('3-5 business days')).toBe('3 to 5 working days');
    expect(formatTurnaround('3-5 working days upon receipt of all required information.')).toBe('3 to 5 working days');
    expect(formatTurnaround('Approximately 10-15 working days, subject to SARS processing times.')).toBe('About 10 to 15 working days');
    expect(formatTurnaround(undefined)).toBe('Contact us for timing');
  });

  it('maps TBC prices to null and product slugs to product URLs', () => {
    const fees = items.find(i => i.id === 'cipc-annual-fees')!;
    expect(fees.price).toBeNull();
    expect(items[0].href).toBe('/products/vat-registration');
  });

  it('groups categories', () => {
    expect(groupForCategory('SARS Services')).toBe('tax');
    expect(groupForCategory('CIPC Services')).toBe('registration');
    expect(groupForCategory('CIDB Services')).toBe('industry');
    expect(groupForCategory('Something New')).toBe('other');
  });

  it('orders popular services by curated rank', () => {
    const popular = getPopularServices(items, 3).map(i => i.id);
    expect(popular).toEqual(['private-company-registration', 'vat-registration', 'individual-income-tax-return-itr12-simple']);
  });
});

describe('service-finder auto-open eligibility', () => {
  it('allows marketing pages', () => {
    expect(isAutoOpenEligiblePath('/')).toBe(true);
    expect(isAutoOpenEligiblePath('/monthly-accounting')).toBe(true);
    expect(isAutoOpenEligiblePath('/accountant-cape-town')).toBe(true);
  });

  it('never auto-opens where the visitor already has intent', () => {
    for (const p of ['/products', '/products/vat-registration', '/cart', '/checkout', '/contact', '/blog/some-post', '/calculators/vat-calculator', '/login', '/admin/orders']) {
      expect(isAutoOpenEligiblePath(p)).toBe(false);
    }
  });
});
