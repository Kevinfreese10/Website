import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { CURATED_BLOG_FAQS } from '@/lib/blog-faqs';
import BlogContextualCta, { hasContextualCta } from '@/components/blog/BlogContextualCta';
import { metadata as vatSearchMetadata } from '@/app/sars-vat-vendor-search-verification/page';
import { getAdminDb } from '@/lib/firebase-admin';

const ROOT_DIR = path.resolve(__dirname, '../../..');

describe('Milestone 2: Snippet CTR Engineering & Blog Conversion Funnels', () => {
  describe('F7: Curated Search-Intent FAQPage Schemas (src/lib/blog-faqs.ts)', () => {
    const requiredSlugs = [
      'find-your-south-african-tax-reference-number-quick-guide',
      'ncr-registration-your-key-to-sa-credit-compliance',
      'start-a-business-in-sa-for-under-r500-your-guide',
      'remission-of-sars-interest--penalties-your-guide',
      'ncr-registration-your-essential-guide-in-south-africa',
    ];

    it('contains curated FAQ entries for all top high-impression slugs', () => {
      for (const slug of requiredSlugs) {
        expect(CURATED_BLOG_FAQS[slug], `Missing FAQs for ${slug}`).toBeDefined();
        expect(CURATED_BLOG_FAQS[slug].length).toBeGreaterThanOrEqual(3);
      }
    });

    it('Tax Number guide has 4 high-intent questions answering user queries', () => {
      const faqs = CURATED_BLOG_FAQS['find-your-south-african-tax-reference-number-quick-guide'];
      expect(faqs).toHaveLength(4);
      expect(faqs.some((f) => f.q.toLowerCase().includes('tax reference number'))).toBe(true);
      expect(faqs.some((f) => f.q.toLowerCase().includes('sms'))).toBe(true);
      expect(faqs.some((f) => f.q.toLowerCase().includes('clearance'))).toBe(true);
      faqs.forEach((f) => {
        expect(f.q.trim().length).toBeGreaterThan(10);
        expect(f.a.trim().length).toBeGreaterThan(30);
      });
    });

    it('NCR Registration guide has 4 high-intent questions', () => {
      const faqs = CURATED_BLOG_FAQS['ncr-registration-your-key-to-sa-credit-compliance'];
      expect(faqs).toHaveLength(4);
      expect(faqs.some((f) => f.q.toLowerCase().includes('national credit regulator'))).toBe(true);
      expect(faqs.some((f) => f.q.toLowerCase().includes('cost'))).toBe(true);
      expect(faqs.some((f) => f.q.toLowerCase().includes('documents'))).toBe(true);
    });

    it('Starting a Business for R500 guide has 3 questions covering startup queries', () => {
      const faqs = CURATED_BLOG_FAQS['start-a-business-in-sa-for-under-r500-your-guide'];
      expect(faqs).toHaveLength(3);
      expect(faqs.some((f) => f.q.toLowerCase().includes('r500'))).toBe(true);
      expect(faqs.some((f) => f.q.toLowerCase().includes('cipc'))).toBe(true);
    });

    it('Remission guide has 3 questions covering TAA grounds and dispute process', () => {
      const faqs = CURATED_BLOG_FAQS['remission-of-sars-interest--penalties-your-guide'];
      expect(faqs).toHaveLength(3);
      expect(faqs.some((f) => f.q.toLowerCase().includes('remission'))).toBe(true);
      expect(faqs.some((f) => f.q.toLowerCase().includes('rfr01'))).toBe(true);
      expect(faqs.some((f) => f.q.toLowerCase().includes('interest'))).toBe(true);
    });
  });

  describe('F6: Static Page Snippet Optimization (/sars-vat-vendor-search-verification)', () => {
    it('front-loads primary keyword "VAT Vendor Search" in title', () => {
      const rawTitle = vatSearchMetadata.title as string;
      expect(rawTitle).toBeDefined();
      expect(rawTitle.startsWith('VAT Vendor Search')).toBe(true);
    });

    it('rendered title with root layout template is strictly <= 59 characters', () => {
      const rawTitle = vatSearchMetadata.title as string;
      const renderedTitle = `${rawTitle} | My Accountant`;
      expect(renderedTitle.length).toBeLessThanOrEqual(59);
      expect(renderedTitle.length).toBeGreaterThanOrEqual(45);
    });

    it('meta description is strictly between 140 and 158 characters', () => {
      const desc = vatSearchMetadata.description as string;
      expect(desc).toBeDefined();
      expect(desc.length).toBeGreaterThanOrEqual(140);
      expect(desc.length).toBeLessThanOrEqual(158);
      expect(desc.toLowerCase()).toContain('sars vat vendor search');
    });

    it('openGraph and canonical metadata are properly configured', () => {
      expect(vatSearchMetadata.alternates?.canonical).toBe(
        'https://www.myacc.co.za/sars-vat-vendor-search-verification'
      );
      const og = vatSearchMetadata.openGraph as any;
      expect(og.title).toContain('VAT Vendor Search');
      expect(og.description).toBe(vatSearchMetadata.description);
    });
  });

  describe('F10: Contextual Product CTA Cards (src/components/blog/BlogContextualCta.tsx)', () => {
    it('correctly detects slugs requiring contextual CTAs', () => {
      expect(hasContextualCta('find-your-south-african-tax-reference-number-quick-guide')).toBe(true);
      expect(hasContextualCta('start-a-business-in-sa-for-under-r500-your-guide')).toBe(true);
      expect(hasContextualCta('ncr-registration-your-key-to-sa-credit-compliance')).toBe(true);
      expect(hasContextualCta('ncr-registration-your-essential-guide-in-south-africa')).toBe(true);
      expect(hasContextualCta('random-unrelated-blog-post-slug')).toBe(false);
    });

    it('renders Tax Number CTA with links to Tax Clearance PIN and ITR12 Simple', () => {
      const html = renderToStaticMarkup(
        React.createElement(BlogContextualCta, {
          slug: 'find-your-south-african-tax-reference-number-quick-guide',
        })
      );
      expect(html).toContain('Found Your Tax Number? Fast-Track Your SARS Compliance');
      expect(html).toContain('/products/tax-clearance-certificate');
      expect(html).toContain('R350');
      expect(html).toContain('/products/individual-income-tax-return-itr12-simple');
      expect(html).toContain('R750');
      expect(html).toContain('SARS Compliance Next Steps');
    });

    it('renders R500 Startup CTA with links to Company Registration and Tender Package', () => {
      const html = renderToStaticMarkup(
        React.createElement(BlogContextualCta, {
          slug: 'start-a-business-in-sa-for-under-r500-your-guide',
        })
      );
      expect(html).toContain('Ready to Make Your Business Official?');
      expect(html).toContain('/products/private-company-registration');
      expect(html).toContain('R950');
      expect(html).toContain('/products/tender-ready-company-registration-package');
      expect(html).toContain('R1,600');
      expect(html).toContain('/company-registration');
    });

    it('renders NCR CTA with links to NCR Fee Calculator and Registration package', () => {
      const html = renderToStaticMarkup(
        React.createElement(BlogContextualCta, {
          slug: 'ncr-registration-your-key-to-sa-credit-compliance',
        })
      );
      expect(html).toContain('Calculate Fees &amp; Register with the National Credit Regulator');
      expect(html).toContain('/calculators/ncr-registration-fee');
      expect(html).toContain('/products/ncr-registration');
      expect(html).toContain('R1,400');
    });

    it('returns null for unmapped slugs', () => {
      const html = renderToStaticMarkup(
        React.createElement(BlogContextualCta, {
          slug: 'general-tax-advice-for-freelancers',
        })
      );
      expect(html).toBe('');
    });
  });

  describe('F5 & F11: Firestore Top Blog Posts Invariants', () => {
    it(
      'verifies all 5 top blog posts in Firestore have calibrated metadata and related products',
      async () => {
        const db = getAdminDb();
        const targetSlugs = [
          'find-your-south-african-tax-reference-number-quick-guide',
          'ncr-registration-your-key-to-sa-credit-compliance',
          'start-a-business-in-sa-for-under-r500-your-guide',
          'remission-of-sars-interest--penalties-your-guide',
          'ncr-registration-your-essential-guide-in-south-africa',
        ];

        const snapshots = await Promise.all(
          targetSlugs.map((slug) =>
            db.collection('blogPosts').where('slug', '==', slug).get()
          )
        );

        for (let i = 0; i < targetSlugs.length; i++) {
          const slug = targetSlugs[i];
          const snap = snapshots[i];
          expect(snap.empty, `Blog post ${slug} not found in Firestore`).toBe(false);

          const data = snap.docs[0].data();

          // 1. Title length constraint
          const rawTitle = data.metaTitle || data.title;
          const renderedTitle = rawTitle.endsWith(' | My Accountant')
            ? rawTitle
            : `${rawTitle} | My Accountant`;
          expect(
            renderedTitle.length,
            `Title for ${slug} exceeds 59 chars rendered: "${renderedTitle}" (${renderedTitle.length})`
          ).toBeLessThanOrEqual(59);

          // 2. Meta description length constraint (strictly 140–158)
          const desc = data.metaDescription || '';
          expect(
            desc.length,
            `Meta description for ${slug} must be 140-158 chars: "${desc}" (${desc.length})`
          ).toBeGreaterThanOrEqual(140);
          expect(
            desc.length,
            `Meta description for ${slug} must be 140-158 chars: "${desc}" (${desc.length})`
          ).toBeLessThanOrEqual(158);

          // 3. Non-empty relatedProducts
          expect(data.relatedProducts, `relatedProducts missing for ${slug}`).toBeDefined();
          expect(data.relatedProducts.length, `relatedProducts empty for ${slug}`).toBeGreaterThan(0);
        }
      },
      20000
    );

    it('verifies specific high-converting products mapped to respective blogs', async () => {
      const db = getAdminDb();

      // Tax number post must link to Tax Clearance (Gep0mXM6phvt0Zsx5Rsa) and ITR12 Simple (126urIq86Tq2m0R17qoZ)
      const taxSnap = await db
        .collection('blogPosts')
        .where('slug', '==', 'find-your-south-african-tax-reference-number-quick-guide')
        .get();
      const taxProducts = taxSnap.docs[0].data().relatedProducts;
      expect(taxProducts).toContain('Gep0mXM6phvt0Zsx5Rsa');
      expect(taxProducts).toContain('126urIq86Tq2m0R17qoZ');

      // R500 startup post must link to Private Company Registration (9TrFE99XEJOOeRAAeRae)
      const startupSnap = await db
        .collection('blogPosts')
        .where('slug', '==', 'start-a-business-in-sa-for-under-r500-your-guide')
        .get();
      const startupProducts = startupSnap.docs[0].data().relatedProducts;
      expect(startupProducts).toContain('9TrFE99XEJOOeRAAeRae');
      expect(startupProducts).toContain('Slc1x2GWdGu9rMne4J86');
    });
  });

  describe('Integration: Blog Page Source Wireframe Verification', () => {
    it('verifies src/app/blog/[slug]/page.tsx integrates CURATED_BLOG_FAQS and BlogContextualCta', () => {
      const pagePath = path.join(ROOT_DIR, 'src/app/blog/[slug]/page.tsx');
      const source = fs.readFileSync(pagePath, 'utf-8');

      expect(source).toContain('CURATED_BLOG_FAQS');
      expect(source).toContain('BlogContextualCta');
      expect(source).toContain('<BlogContextualCta');
      expect(source).toContain('CURATED_BLOG_FAQS[post.slug]');
      expect(source).toContain('hasContextualCta');
    });
  });
});
