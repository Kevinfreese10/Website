import { describe, it, expect } from 'vitest';
import { findBestSlugMatch, buildFallbackRedirectUrl, tokenizeSlug } from '../slug-matcher';

describe('Smart Slug Matcher', () => {
  const mockCandidates = [
    { slug: 'company-income-tax-return-itr14-nil', title: 'Company Income Tax Return (ITR14) - Nil Filing' },
    { slug: 'sole-proprietor-income-tax-return-itr12', title: 'Income Tax Return for Sole Proprietors (ITR12)' },
    { slug: 'provisional-tax-return-irp6-nil', title: 'Provisional Tax Return (IRP6) - Nil Filing' },
    { slug: 'complex-individual-income-tax-return-itr12', title: 'Complex Individual Tax Return' },
    { slug: 'uif-registration', title: 'UIF Registration' },
    { slug: 'ncr-form-40-application-compliance', title: 'NCR Form 40 Compliance' },
    { slug: 'private-company-registration', title: 'Private Company Registration' },
    { slug: 'vat201-return-submission-nil', title: 'VAT201 Nil Return' },
  ];

  it('tokenizes slug and filters stop words correctly', () => {
    const tokens = tokenizeSlug('itr14-company-income-tax-return-nil-filing-and-submission');
    expect(tokens).toEqual(['itr14', 'company', 'income', 'tax', 'return', 'nil']);
  });

  it('matches reversed ITR14 nil slug', () => {
    const match = findBestSlugMatch('itr14-company-income-tax-return-nil', mockCandidates);
    expect(match).toBe('company-income-tax-return-itr14-nil');
  });

  it('matches reversed sole proprietor ITR12 slug', () => {
    const match = findBestSlugMatch('income-tax-return-for-sole-proprietors-itr12', mockCandidates);
    expect(match).toBe('sole-proprietor-income-tax-return-itr12');
  });

  it('matches reversed IRP6 provisional tax nil slug', () => {
    const match = findBestSlugMatch('irp6-provisional-tax-return-nil', mockCandidates);
    expect(match).toBe('provisional-tax-return-irp6-nil');
  });

  it('matches copy of uif registration', () => {
    const match = findBestSlugMatch('copy-of-uif-registration', mockCandidates);
    expect(match).toBe('uif-registration');
  });

  it('builds confident product redirect url when match is found', () => {
    const url = buildFallbackRedirectUrl('itr14-company-income-tax-return-nil', mockCandidates);
    expect(url).toBe('/products/company-income-tax-return-itr14-nil');
  });

  it('builds /products?search=... fallback url when no match is confident', () => {
    const url = buildFallbackRedirectUrl('completely-unknown-random-crypto-consulting', mockCandidates);
    expect(url).toBe('/products?search=completely%20unknown%20random%20crypto%20consulting');
  });
});
