import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  generateAccountingHeadTermSchema,
  generateOrganizationSchema,
} from '@/lib/schema/productSchema';
import { SITE_URL } from '@/lib/constants';

const ROOT_DIR = path.resolve(__dirname, '../../..');

describe('Accounting Head Term Schema & Metadata Suite (/accounting-services-south-africa)', () => {
  const PAGE_URL = `${SITE_URL}/accounting-services-south-africa`;

  // =========================================================================
  // 1. JSON-LD Graph Structure & Cross-Entity Linkages
  // =========================================================================
  describe('1. JSON-LD Graph Structure & Cross-Entity Linkages', () => {
    it('1.1: Returns valid JSON-LD with @context and interconnected @graph array', () => {
      const schema: any = generateAccountingHeadTermSchema();

      // Ensure valid JSON serializability
      const jsonStr = JSON.stringify(schema);
      expect(() => JSON.parse(jsonStr)).not.toThrow();

      expect(schema['@context']).toBe('https://schema.org');
      expect(Array.isArray(schema['@graph'])).toBe(true);
      expect(schema['@graph'].length).toBe(3);
    });

    it('1.2: Multi-types service entity as AccountingService and LocalBusiness', () => {
      const schema: any = generateAccountingHeadTermSchema();
      const serviceEntity: any = schema['@graph'].find(
        (node: any) => node['@id'] === `${PAGE_URL}#service`
      );

      expect(serviceEntity).toBeDefined();
      expect(Array.isArray(serviceEntity['@type'])).toBe(true);
      expect(serviceEntity['@type']).toContain('AccountingService');
      expect(serviceEntity['@type']).toContain('LocalBusiness');
      expect(serviceEntity.name).toBe('My Accountant - Accounting Services & Experts South Africa');
      expect(serviceEntity.url).toBe(PAGE_URL);
      expect(serviceEntity.serviceType).toBe('Accounting and Tax Services');
    });

    it('1.3: Emits accurate physical address, geo coordinates, and office hours in Darrenwood', () => {
      const schema: any = generateAccountingHeadTermSchema();
      const serviceEntity: any = schema['@graph'].find(
        (node: any) => node['@id'] === `${PAGE_URL}#service`
      );

      expect(serviceEntity).toBeDefined();

      // PostalAddress
      expect(serviceEntity.address).toBeDefined();
      expect(serviceEntity.address['@type']).toBe('PostalAddress');
      expect(serviceEntity.address.streetAddress).toBe(
        'Ground Floor, Waterstone Building, Stonemill Office Park, 300 Acacia Road'
      );
      expect(serviceEntity.address.addressLocality).toBe('Darrenwood, Johannesburg');
      expect(serviceEntity.address.addressRegion).toBe('Gauteng');
      expect(serviceEntity.address.postalCode).toBe('2195');
      expect(serviceEntity.address.addressCountry).toBe('ZA');

      // GeoCoordinates
      expect(serviceEntity.geo).toBeDefined();
      expect(serviceEntity.geo['@type']).toBe('GeoCoordinates');
      expect(serviceEntity.geo.latitude).toBeCloseTo(-26.1337308, 4);
      expect(serviceEntity.geo.longitude).toBeCloseTo(27.9752252, 4);

      // Maps and Contact
      expect(serviceEntity.hasMap).toContain('google.com/maps');
      expect(serviceEntity.telephone).toBe('+27101091625');
      expect(serviceEntity.email).toBe('info@myacc.co.za');
      expect(serviceEntity.priceRange).toBe('R850 - R4500');

      // Opening hours
      expect(Array.isArray(serviceEntity.openingHoursSpecification)).toBe(true);
      expect(serviceEntity.openingHoursSpecification[0].opens).toBe('08:00');
      expect(serviceEntity.openingHoursSpecification[0].closes).toBe('17:00');

      // Area served
      expect(serviceEntity.areaServed).toEqual({
        '@type': 'Country',
        name: 'South Africa',
      });
    });

    it('1.4: Cross-links service entity to #website and #organization', () => {
      const schema: any = generateAccountingHeadTermSchema();
      const serviceEntity: any = schema['@graph'].find(
        (node: any) => node['@id'] === `${PAGE_URL}#service`
      );

      expect(serviceEntity).toBeDefined();
      expect(serviceEntity.isPartOf).toEqual({
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
      });

      expect(serviceEntity.provider).toEqual({
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'My Accountant',
        url: SITE_URL,
      });
    });
  });

  // =========================================================================
  // 2. AggregateRating & Corroborated Review Specifications
  // =========================================================================
  describe('2. AggregateRating & Corroborated Review Specifications', () => {
    it('2.1: Emits 4.9 rating with integer review count (204) matching on-page evidence', () => {
      const schema: any = generateAccountingHeadTermSchema();
      const serviceEntity: any = schema['@graph'].find(
        (node: any) => node['@id'] === `${PAGE_URL}#service`
      );

      expect(serviceEntity).toBeDefined();
      expect(serviceEntity.aggregateRating).toBeDefined();
      expect(serviceEntity.aggregateRating['@type']).toBe('AggregateRating');
      expect(serviceEntity.aggregateRating.ratingValue).toBe('4.9');
      expect(serviceEntity.aggregateRating.reviewCount).toBe('204');
      expect(serviceEntity.aggregateRating.bestRating).toBe('5');
      expect(serviceEntity.aggregateRating.worstRating).toBe('1');

      // Review count must strictly be numeric integer without '+' symbol
      expect(serviceEntity.aggregateRating.reviewCount).not.toContain('+');
      expect(/^\d+$/.test(serviceEntity.aggregateRating.reviewCount)).toBe(true);
    });

    it('2.2: Includes sample 5-star review from Verified Client via Google Reviews', () => {
      const schema: any = generateAccountingHeadTermSchema();
      const serviceEntity: any = schema['@graph'].find(
        (node: any) => node['@id'] === `${PAGE_URL}#service`
      );

      expect(serviceEntity).toBeDefined();
      expect(Array.isArray(serviceEntity.review)).toBe(true);
      expect(serviceEntity.review.length).toBeGreaterThanOrEqual(1);

      const review = serviceEntity.review[0];
      expect(review['@type']).toBe('Review');
      expect(review.reviewRating).toEqual({
        '@type': 'Rating',
        ratingValue: '5',
        bestRating: '5',
      });
      expect(review.author).toEqual({
        '@type': 'Person',
        name: 'Verified Client',
      });
      expect(review.publisher).toEqual({
        '@type': 'Organization',
        name: 'Google Reviews',
      });
      expect(review.reviewBody).toBeTruthy();
    });
  });

  // =========================================================================
  // 3. BreadcrumbList & FAQPage Schema Nodes
  // =========================================================================
  describe('3. BreadcrumbList & FAQPage Schema Nodes', () => {
    it('3.1: Emits BreadcrumbList with Home and Accounting Services South Africa', () => {
      const schema: any = generateAccountingHeadTermSchema();
      const breadcrumb: any = schema['@graph'].find(
        (node: any) => node['@type'] === 'BreadcrumbList'
      );

      expect(breadcrumb).toBeDefined();
      expect(breadcrumb['@id']).toBe(`${PAGE_URL}#breadcrumb`);
      expect(Array.isArray(breadcrumb.itemListElement)).toBe(true);
      expect(breadcrumb.itemListElement.length).toBe(2);

      expect(breadcrumb.itemListElement[0]).toEqual({
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      });

      expect(breadcrumb.itemListElement[1]).toEqual({
        '@type': 'ListItem',
        position: 2,
        name: 'Accounting Services South Africa',
        item: PAGE_URL,
      });
    });

    it('3.2: Emits FAQPage covering all 3 on-page FAQs and links to #website and #organization', () => {
      const schema: any = generateAccountingHeadTermSchema();
      const faqNode: any = schema['@graph'].find((node: any) => node['@type'] === 'FAQPage');

      expect(faqNode).toBeDefined();
      expect(faqNode['@id']).toBe(`${PAGE_URL}#faq`);
      expect(faqNode.isPartOf).toEqual({
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
      });
      expect(faqNode.publisher).toEqual({
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
      });

      expect(Array.isArray(faqNode.mainEntity)).toBe(true);
      expect(faqNode.mainEntity.length).toBe(3);

      const questionNames = faqNode.mainEntity.map((q: any) => q.name);
      expect(questionNames).toContain('Do I need a dedicated accountant for my small business?');
      expect(questionNames).toContain('What accounting software do you use?');
      expect(questionNames).toContain('Can you help with historical or overdue accounting?');

      for (const question of faqNode.mainEntity) {
        expect(question['@type']).toBe('Question');
        expect(question.acceptedAnswer['@type']).toBe('Answer');
        expect(question.acceptedAnswer.text).toBeTruthy();
      }
    });
  });

  // =========================================================================
  // 4. Google Search Essentials Compliance & Global Org Isolation
  // =========================================================================
  describe('4. Google Search Essentials Compliance & Global Org Isolation', () => {
    it('4.1: Confirms generateOrganizationSchema() remains strictly free of aggregateRating', () => {
      const orgSchema = generateOrganizationSchema() as any;

      // Global Organization schema must NOT have self-serving aggregate reviews
      expect(orgSchema.aggregateRating).toBeUndefined();
      expect(JSON.stringify(orgSchema)).not.toContain('aggregateRating');
    });
  });

  // =========================================================================
  // 5. Page Source Code & Metadata Verification
  // =========================================================================
  describe('5. Page Source Code & Metadata Verification', () => {
    const pagePath = path.join(ROOT_DIR, 'src/app/accounting-services-south-africa/page.tsx');

    it('5.1: Injects JSON-LD script tag with headTermSchema', () => {
      expect(fs.existsSync(pagePath)).toBe(true);
      const source = fs.readFileSync(pagePath, 'utf-8');

      expect(source).toContain('generateAccountingHeadTermSchema');
      expect(source).toMatch(/<script\s+type=["']application\/ld\+json["']/);
      expect(source).toContain('headTermSchema');
    });

    it('5.2: Calibrates title to strictly 58 characters front-loading commercial keywords', () => {
      const source = fs.readFileSync(pagePath, 'utf-8');

      const expectedTitle = 'Accounting Services & Experts South Africa | My Accountant';
      expect(source).toContain(`title: '${expectedTitle}'`);
      expect(expectedTitle.length).toBe(58);
      expect(expectedTitle.length).toBeLessThanOrEqual(60);
    });

    it('5.3: Calibrates description to 156 characters featuring social proof hook', () => {
      const source = fs.readFileSync(pagePath, 'utf-8');

      const expectedDesc =
        'Rated 4.9/5 by 200+ businesses. Expert South African accounting services, monthly bookkeeping, management accounts & SARS tax compliance. Get a quote today.';
      expect(source).toContain(`description: '${expectedDesc}'`);
      expect(expectedDesc.length).toBe(156);
      expect(expectedDesc.length).toBeGreaterThanOrEqual(140);
      expect(expectedDesc.length).toBeLessThanOrEqual(158);
    });
  });
});
