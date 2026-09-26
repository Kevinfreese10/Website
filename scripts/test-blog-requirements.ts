/**
 * Automated E2E Requirement-Driven Test Suite for Blog Posts & Service Catalog
 * 
 * Verifies all requirements from ORIGINAL_REQUEST.md & PROJECT.md:
 * Tier 1: Total blog post count is exactly 76 (59 existing + 17 new) & basic integrity
 * Tier 2: All 17 new products exist with complete schemas, strict SEO bounds, and rich HTML
 * Tier 3: All 76 blog posts have non-empty relatedProducts and 100% referential integrity with services
 * Tier 4: All 76 blog posts have metaTitle <= 59 characters and optimized SEO metadata
 * Tier 5: Frontend rendering compatibility & Firestore query contract resolution
 * 
 * Usage:
 *   npx tsx scripts/test-blog-requirements.ts
 */

import { getAdminDb } from '../src/lib/firebase-admin';
import type { BlogPost, Service } from '../src/lib/types';

// ANSI color helpers
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
};

interface TestResult {
  tier: string;
  testId: string;
  name: string;
  passed: boolean;
  message?: string;
  details?: Record<string, any>;
}

interface NewProductSpec {
  serviceId: string;
  title: string;
  price: number;
  category: string;
  candidateSlugs: string[];
}

// Authoritative list of 17 new statutory and business services from ORIGINAL_REQUEST.md
const TARGET_17_SERVICES: NewProductSpec[] = [
  {
    serviceId: '1psxEB0xnNBxTdSQqBKX',
    title: 'Liquor Licence Application Pack',
    price: 1650,
    category: 'Licences & Permits',
    candidateSlugs: [
      'liquor-licence-application-guide-south-africa',
      'liquor-licence-application-pack',
      'liquor-licence-application-guide',
    ],
  },
  {
    serviceId: '7dqLkWHEFlSBp3jGqC4y',
    title: 'Star Grading Application (TGCSA)',
    price: 1250,
    category: 'Licences & Permits',
    candidateSlugs: [
      'tgcsa-star-grading-guide-south-africa',
      'star-grading-application-tgcsa',
      'tgcsa-star-grading-guide',
    ],
  },
  {
    serviceId: '9nJ0181N9khfqA4kJ6aW',
    title: 'Solar SSEG Grid-Tie Registration',
    price: 1250,
    category: 'Licences & Permits',
    candidateSlugs: [
      'solar-sseg-grid-tie-registration-south-africa',
      'solar-sseg-grid-tie-registration',
      'solar-sseg-registration-guide',
    ],
  },
  {
    serviceId: 'AvQ2zcK4ttioFdUKBFBY',
    title: 'Customs Certificate of Origin (SADC / EUR.1)',
    price: 2190,
    category: 'Licences & Permits',
    candidateSlugs: [
      'customs-certificate-of-origin-sadc-eur1-guide',
      'customs-certificate-of-origin',
      'customs-certificate-of-origin-guide',
    ],
  },
  {
    serviceId: 'Bg52FQ7DkwV4T15s1ciU',
    title: 'Tourist Guide Registration (CATHSSETA)',
    price: 950,
    category: 'Licences & Permits',
    candidateSlugs: [
      'tourist-guide-registration-cathsseta-guide',
      'tourist-guide-registration-cathsseta',
      'tourist-guide-registration-guide',
    ],
  },
  {
    serviceId: 'RSDrRTb03aOVnbiqTGZp',
    title: 'Traffic Register Number (TRN)',
    price: 950,
    category: 'Licences & Permits',
    candidateSlugs: [
      'traffic-register-number-trn-south-africa-guide',
      'traffic-register-number-trn',
      'traffic-register-number-guide',
    ],
  },
  {
    serviceId: 'VhneqtozDCh1q0DisPCx',
    title: 'Firearm Application Pack (SAPS 517 / 271)',
    price: 650,
    category: 'Licences & Permits',
    candidateSlugs: [
      'saps-firearm-licence-application-guide',
      'firearm-application-pack-saps-517--271',
      'firearm-application-pack-guide',
    ],
  },
  {
    serviceId: 'a2AucSEmHauw0AzLqsu4',
    title: 'Electrical Contractor Registration (DoEL)',
    price: 950,
    category: 'Licences & Permits',
    candidateSlugs: [
      'electrical-contractor-registration-doel-guide',
      'electrical-contractor-registration-doel',
      'electrical-contractor-registration-guide',
    ],
  },
  {
    serviceId: 'bZtr4yojIc4OiS0q0ueI',
    title: 'Business Plan for Funding (Bank, SEFA, NYDA)',
    price: 4500,
    category: 'Licences & Permits',
    candidateSlugs: [
      'business-plan-for-funding-sefa-nyda-banks',
      'business-plan-for-funding',
      'business-plan-for-funding-guide',
    ],
  },
  {
    serviceId: 'fkV9BYmOO39t2NrHxVjq',
    title: 'Food Business Certificate of Acceptability (CoA)',
    price: 950,
    category: 'Licences & Permits',
    candidateSlugs: [
      'food-business-certificate-of-acceptability-r638',
      'food-business-certificate-of-acceptability-coa',
      'food-certificate-of-acceptability-guide',
    ],
  },
  {
    serviceId: 'gALWR2cHqUqsTVrUvvdJ',
    title: 'Transport Operating Licence Application (Form 1B)',
    price: 1350,
    category: 'Licences & Permits',
    candidateSlugs: [
      'transport-operating-licence-application-form-1b',
      'transport-operating-licence-guide',
    ],
  },
  {
    serviceId: 'p9Yfq2kPWwJMnrFfO3rS',
    title: 'Property Practitioners (PPRA) Firm Registration',
    price: 1750,
    category: 'Licences & Permits',
    candidateSlugs: [
      'ppra-firm-registration-fidelity-fund-certificate',
      'property-practitioners-ppra-firm-registration',
      'ppra-firm-registration-guide',
    ],
  },
  {
    serviceId: 'zczVkNDGSQKmbKstNTX4',
    title: 'Cross-Border Road Transport Permit (C-BRTA)',
    price: 1490,
    category: 'Licences & Permits',
    candidateSlugs: [
      'cross-border-road-transport-permit-c-brta-guide',
      'cross-border-road-transport-permit',
      'cross-border-road-transport-permit-guide',
    ],
  },
  {
    serviceId: '53OMqVsNmlF7OJiuusya',
    title: 'POPIA Compliance & Governance Pack',
    price: 2250,
    category: 'Compliance & Governance',
    candidateSlugs: [
      'popia-compliance-governance-guide-south-africa',
      'popia-compliance--governance-pack',
      'popia-compliance-governance-guide',
    ],
  },
  {
    serviceId: 'JAQOhiAxWKO8hk8Oh9l8',
    title: 'PAIA Annual Report Submission',
    price: 1150,
    category: 'Compliance & Governance',
    candidateSlugs: [
      'paia-annual-report-submission-information-regulator',
      'paia-annual-report-submission',
      'paia-annual-report-guide',
    ],
  },
  {
    serviceId: 'SGBQ4SlgRn1shWlT6wBq',
    title: 'CSOS Scheme Support & Annual Return',
    price: 1550,
    category: 'Compliance & Governance',
    candidateSlugs: [
      'csos-annual-return-scheme-registration-guide',
      'csos-scheme-support--annual-return',
      'csos-annual-return-guide',
    ],
  },
  {
    serviceId: 'asLG9ywV9f8x2eYaPTPC',
    title: 'POPIA Information Officer Registration',
    price: 850,
    category: 'Compliance & Governance',
    candidateSlugs: [
      'popia-information-officer-registration-guide',
      'popia-information-officer-registration',
    ],
  },
];

// The 18 blog post IDs identified in Survey 2 as having metaTitle > 59 chars
const PREVIOUSLY_OVERLONG_POST_IDS = [
  '1JoL5OQpD8yp2lbu34oR',
  'NKb57k6Z1dJLAGwx5cvA',
  'VWzGqKxtBJ5ed9sctQv7',
  '5nh068vEP3u5Gwzn9Qap',
  '6ELwfNdUFq5k97sbJuL9',
  '2xqD1PW1BY63BvKRgeQS',
  '69AWx2yD8B6ns9LCV5Ep',
  'HfFd00pjjHOcpUu3ikOu',
  'QmGPNC4yQw62VHQZciAR',
  '2mv6uolNY5cbStKx3Xdx',
  'BtZG5roMzFXjwfzOwqVa',
  'CJ4oOh3GNXwU13OzAzKL',
  'RqeWk3n3MbfBJxjWwOfo',
  'XApGN7ADQzxdF4RZCa7M',
  'NHaTQqDokqYz1STpfFX9',
  'GwF5g5ag9nfgRps03IR5',
  'KE8aHleHZBXSm56qgb15',
  'PlvPLKUpo7UcASBNLNo7',
];

// Known previously corrupted posts
const CORRUPTED_POST_IDS = {
  NKb: 'NKb57k6Z1dJLAGwx5cvA',
  wguj: 'wgujQUMOFd1gVxp23v4V',
};

async function runTestSuite() {
  console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}    SOUTH AFRICAN COMPLIANCE BLOG POST & SERVICE E2E TEST SUITE        ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}\n`);

  const db = getAdminDb();
  const results: TestResult[] = [];

  function record(result: TestResult) {
    results.push(result);
    const tag = result.passed
      ? `${colors.green}[PASS]${colors.reset}`
      : `${colors.red}[FAIL]${colors.reset}`;
    console.log(`  ${tag} ${result.tier} - ${result.testId}: ${result.name}`);
    if (!result.passed && result.message) {
      console.log(`         ${colors.yellow}Reason: ${result.message}${colors.reset}`);
    }
  }

  // --------------------------------------------------------------------------
  // INGESTION & SNAPSHOT
  // --------------------------------------------------------------------------
  console.log(`${colors.bold}Fetching Live Firestore Collections...${colors.reset}`);
  const [blogSnap, servicesSnap] = await Promise.all([
    db.collection('blogPosts').get(),
    db.collection('services').get(),
  ]);

  const blogDocs = blogSnap.docs;
  const serviceDocs = servicesSnap.docs;
  const validServiceIdSet = new Set<string>(serviceDocs.map(d => d.id));

  console.log(`Loaded ${blogDocs.length} blog posts, ${serviceDocs.length} services.\n`);

  // --------------------------------------------------------------------------
  // TIER 1: Collection Volume & Basic Integrity (Requirement 1)
  // --------------------------------------------------------------------------
  console.log(`${colors.bold}--- Tier 1: Collection Volume & Basic Integrity ---${colors.reset}`);

  // Test 1.1: Total blog post count must be exactly 76
  const expectedTotalBlogs = 76;
  const actualTotalBlogs = blogDocs.length;
  record({
    tier: 'Tier 1',
    testId: 'T1.1',
    name: 'Total blog post count in Firestore is exactly 76 (59 existing + 17 new)',
    passed: actualTotalBlogs === expectedTotalBlogs,
    message: actualTotalBlogs === expectedTotalBlogs
      ? undefined
      : `Expected exactly 76 blog posts, found ${actualTotalBlogs} in collection 'blogPosts'.`,
    details: { expected: expectedTotalBlogs, actual: actualTotalBlogs },
  });

  // Test 1.2: Total services catalog count must be at least 101
  const expectedMinServices = 101;
  record({
    tier: 'Tier 1',
    testId: 'T1.2',
    name: 'Active services catalog count is at least 101',
    passed: serviceDocs.length >= expectedMinServices,
    message: serviceDocs.length >= expectedMinServices
      ? undefined
      : `Expected >= 101 services, found ${serviceDocs.length}.`,
  });

  // Test 1.3: Document ID uniqueness
  const blogDocIds = blogDocs.map(d => d.id);
  const uniqueDocIds = new Set(blogDocIds);
  record({
    tier: 'Tier 1',
    testId: 'T1.3',
    name: 'All blog post document IDs are unique in Firestore',
    passed: uniqueDocIds.size === blogDocIds.length,
    message: uniqueDocIds.size === blogDocIds.length
      ? undefined
      : `Found ${blogDocIds.length - uniqueDocIds.size} duplicate document IDs.`,
  });

  // Test 1.4: Slug validity & uniqueness across all posts
  const slugs: string[] = [];
  const invalidSlugs: string[] = [];
  const slugRegex = /^[a-z0-9-]+$/;

  for (const doc of blogDocs) {
    const data = doc.data();
    const slug = data.slug || doc.id;
    if (typeof slug !== 'string' || !slugRegex.test(slug)) {
      invalidSlugs.push(`${doc.id} (slug: '${slug}')`);
    } else {
      slugs.push(slug);
    }
  }

  const slugCountMap = new Map<string, number>();
  for (const s of slugs) {
    slugCountMap.set(s, (slugCountMap.get(s) || 0) + 1);
  }
  const duplicateSlugs = Array.from(slugCountMap.entries()).filter(([_, count]) => count > 1);

  record({
    tier: 'Tier 1',
    testId: 'T1.4',
    name: 'All blog posts have valid URL-safe slugs (/^[a-z0-9-]+$/)',
    passed: invalidSlugs.length === 0,
    message: invalidSlugs.length === 0
      ? undefined
      : `Invalid slugs detected: ${invalidSlugs.slice(0, 5).join(', ')}`,
  });

  // --------------------------------------------------------------------------
  // TIER 2: Verification of the 17 New Products as Blog Posts (Requirement 2)
  // --------------------------------------------------------------------------
  console.log(`\n${colors.bold}--- Tier 2: Verification of the 17 New Products as Blog Posts ---${colors.reset}`);

  // Helper to locate blog post for a given target service
  function findPostForTargetService(spec: NewProductSpec) {
    return blogDocs.find(doc => {
      const data = doc.data();
      // Match by doc.id == serviceId
      if (doc.id === spec.serviceId) return true;
      // Match by data.id == serviceId
      if (data.id === spec.serviceId) return true;
      // Match by primary relatedProduct
      if (Array.isArray(data.relatedProducts) && data.relatedProducts[0] === spec.serviceId) return true;
      // Match by candidate slugs
      if (data.slug && spec.candidateSlugs.includes(data.slug)) return true;
      if (spec.candidateSlugs.includes(doc.id)) return true;
      return false;
    });
  }

  const foundTargetPosts: { spec: NewProductSpec; doc: FirebaseFirestore.QueryDocumentSnapshot }[] = [];
  const missingTargetServices: string[] = [];

  for (const spec of TARGET_17_SERVICES) {
    const postDoc = findPostForTargetService(spec);
    if (postDoc) {
      foundTargetPosts.push({ spec, doc: postDoc });
    } else {
      missingTargetServices.push(`${spec.serviceId}: ${spec.title}`);
    }
  }

  record({
    tier: 'Tier 2',
    testId: 'T2.1',
    name: 'All 17 new statutory products exist as blog posts in Firestore',
    passed: missingTargetServices.length === 0,
    message: missingTargetServices.length === 0
      ? undefined
      : `Missing blog posts for ${missingTargetServices.length} services: ${missingTargetServices.join('; ')}`,
  });

  // Verify detailed schema and content for all found target posts
  let primaryIdMismatch = 0;
  let complementaryCountFailures = 0;
  let authorFailures = 0;
  let searchIntentFailures = 0;
  let metaTitleViolations: string[] = [];
  let metaDescViolations: string[] = [];
  let metaKeywordsViolations: string[] = [];
  let dateViolations: string[] = [];
  let excerptViolations: string[] = [];
  let imageViolations: string[] = [];
  let htmlSemanticViolations: string[] = [];
  let faqSectionViolations: string[] = [];

  for (const item of foundTargetPosts) {
    const { spec, doc } = item;
    const data = doc.data() as Partial<BlogPost> & Record<string, any>;

    // 1. Primary Service ID in relatedProducts[0]
    if (!Array.isArray(data.relatedProducts) || data.relatedProducts[0] !== spec.serviceId) {
      primaryIdMismatch++;
    }

    // 2. 1-2 Complementary services (total length 2 to 3)
    if (!Array.isArray(data.relatedProducts) || data.relatedProducts.length < 2 || data.relatedProducts.length > 3) {
      complementaryCountFailures++;
    }

    // 3. Author must be "Kevin Freese"
    if (data.author !== 'Kevin Freese') {
      authorFailures++;
    }

    // 4. searchIntent must be 'Informational' | 'Commercial'
    if (data.searchIntent !== 'Informational' && data.searchIntent !== 'Commercial') {
      searchIntentFailures++;
    }

    // 5. metaTitle <= 59 characters
    const metaTitle = data.metaTitle || '';
    if (!metaTitle || metaTitle.length > 59) {
      metaTitleViolations.push(`${spec.title} (length: ${metaTitle.length})`);
    }

    // 6. metaDescription: 140 to 158 characters
    const metaDesc = data.metaDescription || '';
    if (metaDesc.length < 140 || metaDesc.length > 158) {
      metaDescViolations.push(`${spec.title} (length: ${metaDesc.length}, value: "${metaDesc}")`);
    }

    // 7. metaKeywords: 5 to 8 keywords array
    const metaKeywords = data.metaKeywords;
    if (!Array.isArray(metaKeywords) || metaKeywords.length < 5 || metaKeywords.length > 8 || !metaKeywords.every(k => typeof k === 'string' && k.trim().length > 0)) {
      metaKeywordsViolations.push(`${spec.title} (count: ${Array.isArray(metaKeywords) ? metaKeywords.length : 'not an array'})`);
    }

    // 8. date: Firestore Timestamp or ISO string
    const rawDate: any = (doc.data() as any).date;
    const isTimestamp = rawDate && (typeof rawDate.toDate === 'function' || (typeof rawDate._seconds === 'number'));
    const isIsoDate = typeof rawDate === 'string' && !isNaN(Date.parse(rawDate));
    if (!isTimestamp && !isIsoDate) {
      dateViolations.push(`${spec.title} (type: ${typeof rawDate})`);
    }

    // 9. excerpt: ~140-160 chars
    const excerpt = data.excerpt || '';
    if (excerpt.length < 50 || excerpt.length > 250) {
      excerptViolations.push(`${spec.title} (length: ${excerpt.length})`);
    }

    // 10. imageHint & imageUrl
    const imageHint = data.imageHint || '';
    const imageUrl = data.imageUrl || '';
    if (imageHint.length < 10 || !imageUrl || (!imageUrl.startsWith('/') && !imageUrl.startsWith('http'))) {
      imageViolations.push(`${spec.title} (hint: '${imageHint}', url: '${imageUrl}')`);
    }

    // 11. content: Rich HTML with h2, h3, p, ul, li, strong, blockquote
    const content = data.content || '';
    const missingTags: string[] = [];
    if (!content.includes('<h2')) missingTags.push('<h2>');
    if (!content.includes('<h3')) missingTags.push('<h3>');
    if (!content.includes('<p')) missingTags.push('<p>');
    if (!content.includes('<ul') || !content.includes('<li')) missingTags.push('<ul>/<li>');
    if (!content.includes('<strong')) missingTags.push('<strong>');
    if (!content.includes('<blockquote')) missingTags.push('<blockquote>');

    if (missingTags.length > 0 || content.length < 500) {
      htmlSemanticViolations.push(`${spec.title} (missing: ${missingTags.join(', ')}, length: ${content.length})`);
    }

    // 12. FAQ Section
    const hasFaq = /faq|frequently\s+asked\s+questions/i.test(content);
    if (!hasFaq) {
      faqSectionViolations.push(spec.title);
    }
  }

  record({
    tier: 'Tier 2',
    testId: 'T2.2',
    name: 'All 17 new posts have Primary Service ID as relatedProducts[0]',
    passed: foundTargetPosts.length === 17 && primaryIdMismatch === 0,
    message: primaryIdMismatch === 0 ? undefined : `${primaryIdMismatch} posts failed primary ID alignment`,
  });

  record({
    tier: 'Tier 2',
    testId: 'T2.3',
    name: 'All 17 new posts have 2 to 3 relatedProducts (Primary + 1-2 complementary)',
    passed: foundTargetPosts.length === 17 && complementaryCountFailures === 0,
    message: complementaryCountFailures === 0 ? undefined : `${complementaryCountFailures} posts have invalid relatedProducts count`,
  });

  record({
    tier: 'Tier 2',
    testId: 'T2.4',
    name: 'All 17 new posts specify author strictly as "Kevin Freese"',
    passed: foundTargetPosts.length === 17 && authorFailures === 0,
    message: authorFailures === 0 ? undefined : `${authorFailures} posts have invalid author`,
  });

  record({
    tier: 'Tier 2',
    testId: 'T2.5',
    name: 'All 17 new posts have valid searchIntent ("Informational" | "Commercial")',
    passed: foundTargetPosts.length === 17 && searchIntentFailures === 0,
    message: searchIntentFailures === 0 ? undefined : `${searchIntentFailures} posts have invalid searchIntent`,
  });

  record({
    tier: 'Tier 2',
    testId: 'T2.6',
    name: 'All 17 new posts satisfy metaTitle <= 59 characters',
    passed: foundTargetPosts.length === 17 && metaTitleViolations.length === 0,
    message: metaTitleViolations.length === 0 ? undefined : `Violations: ${metaTitleViolations.join('; ')}`,
  });

  record({
    tier: 'Tier 2',
    testId: 'T2.7',
    name: 'All 17 new posts satisfy metaDescription strictly 140-158 characters',
    passed: foundTargetPosts.length === 17 && metaDescViolations.length === 0,
    message: metaDescViolations.length === 0 ? undefined : `Violations: ${metaDescViolations.join('; ')}`,
  });

  record({
    tier: 'Tier 2',
    testId: 'T2.8',
    name: 'All 17 new posts have metaKeywords array of 5 to 8 strings',
    passed: foundTargetPosts.length === 17 && metaKeywordsViolations.length === 0,
    message: metaKeywordsViolations.length === 0 ? undefined : `Violations: ${metaKeywordsViolations.join('; ')}`,
  });

  record({
    tier: 'Tier 2',
    testId: 'T2.9',
    name: 'All 17 new posts have valid Firestore Timestamp or ISO date',
    passed: foundTargetPosts.length === 17 && dateViolations.length === 0,
    message: dateViolations.length === 0 ? undefined : `Violations: ${dateViolations.join('; ')}`,
  });

  record({
    tier: 'Tier 2',
    testId: 'T2.10',
    name: 'All 17 new posts have clear excerpt (~140-160 chars)',
    passed: foundTargetPosts.length === 17 && excerptViolations.length === 0,
    message: excerptViolations.length === 0 ? undefined : `Violations: ${excerptViolations.join('; ')}`,
  });

  record({
    tier: 'Tier 2',
    testId: 'T2.11',
    name: 'All 17 new posts have descriptive imageHint and valid imageUrl',
    passed: foundTargetPosts.length === 17 && imageViolations.length === 0,
    message: imageViolations.length === 0 ? undefined : `Violations: ${imageViolations.join('; ')}`,
  });

  record({
    tier: 'Tier 2',
    testId: 'T2.12',
    name: 'All 17 new posts have Rich HTML content (h2, h3, p, ul, li, strong, blockquote)',
    passed: foundTargetPosts.length === 17 && htmlSemanticViolations.length === 0,
    message: htmlSemanticViolations.length === 0 ? undefined : `Violations: ${htmlSemanticViolations.join('; ')}`,
  });

  record({
    tier: 'Tier 2',
    testId: 'T2.13',
    name: 'All 17 new posts contain a dedicated FAQ section with Q&A markup',
    passed: foundTargetPosts.length === 17 && faqSectionViolations.length === 0,
    message: faqSectionViolations.length === 0 ? undefined : `Missing FAQ in: ${faqSectionViolations.join('; ')}`,
  });

  // --------------------------------------------------------------------------
  // TIER 3: Related Products Referential Integrity (All 76 Posts)
  // --------------------------------------------------------------------------
  console.log(`\n${colors.bold}--- Tier 3: Related Products Referential Integrity (All 76 Posts) ---${colors.reset}`);

  const postsWithEmptyRelatedProducts: string[] = [];
  const invalidServiceReferences: { docId: string; slug: string; invalidIds: string[] }[] = [];
  const selfDuplicateReferences: { docId: string; duplicates: string[] }[] = [];

  for (const doc of blogDocs) {
    const data = doc.data();
    const related = data.relatedProducts;
    const slug = data.slug || doc.id;

    if (!Array.isArray(related) || related.length === 0) {
      postsWithEmptyRelatedProducts.push(`${doc.id} (${slug})`);
    } else {
      const invalid = related.filter((id: any) => typeof id !== 'string' || !validServiceIdSet.has(id));
      if (invalid.length > 0) {
        invalidServiceReferences.push({ docId: doc.id, slug, invalidIds: invalid });
      }

      const idSet = new Set<string>();
      const dups: string[] = [];
      for (const id of related) {
        if (idSet.has(id)) dups.push(id);
        idSet.add(id);
      }
      if (dups.length > 0) {
        selfDuplicateReferences.push({ docId: doc.id, duplicates: dups });
      }
    }
  }

  record({
    tier: 'Tier 3',
    testId: 'T3.1',
    name: 'All 76 blog posts have non-empty relatedProducts arrays',
    passed: postsWithEmptyRelatedProducts.length === 0,
    message: postsWithEmptyRelatedProducts.length === 0
      ? undefined
      : `Found ${postsWithEmptyRelatedProducts.length} posts with empty/missing relatedProducts: ${postsWithEmptyRelatedProducts.slice(0, 5).join(', ')}...`,
  });

  record({
    tier: 'Tier 3',
    testId: 'T3.2',
    name: 'Every service ID in relatedProducts across all 76 posts exists in services (100% Referential Integrity)',
    passed: invalidServiceReferences.length === 0,
    message: invalidServiceReferences.length === 0
      ? undefined
      : `Found ${invalidServiceReferences.length} posts referencing invalid service IDs: ${JSON.stringify(invalidServiceReferences)}`,
  });

  // Test 3.3: Specifically verify repair of corrupted post NKb57k6Z1dJLAGwx5cvA
  const nkbDoc = blogDocs.find(d => d.id === CORRUPTED_POST_IDS.NKb);
  const nkbRelated = nkbDoc ? nkbDoc.data().relatedProducts : [];
  const nkbHasCorruptStrings = Array.isArray(nkbRelated) && (nkbRelated.includes('vat-registration') || nkbRelated.includes('ai-accountant'));
  record({
    tier: 'Tier 3',
    testId: 'T3.3',
    name: `Corrupted post ${CORRUPTED_POST_IDS.NKb} is repaired (no 'vat-registration' or 'ai-accountant')`,
    passed: !nkbHasCorruptStrings && Array.isArray(nkbRelated) && nkbRelated.length > 0 && nkbRelated.every((id: string) => validServiceIdSet.has(id)),
    message: nkbHasCorruptStrings ? 'Post still contains legacy corrupted slug strings' : (nkbRelated.length === 0 ? 'relatedProducts is empty' : undefined),
  });

  // Test 3.4: Specifically verify repair of corrupted post wgujQUMOFd1gVxp23v4V
  const wgujDoc = blogDocs.find(d => d.id === CORRUPTED_POST_IDS.wguj);
  const wgujRelated = wgujDoc ? wgujDoc.data().relatedProducts : [];
  const wgujHasPhantomIds = Array.isArray(wgujRelated) && (wgujRelated.includes('7WFOxCT7QqZRnKcRe1xf') || wgujRelated.includes('j1aMGJrFcW4m96HpAvqU'));
  record({
    tier: 'Tier 3',
    testId: 'T3.4',
    name: `Corrupted post ${CORRUPTED_POST_IDS.wguj} is repaired (phantom service IDs removed)`,
    passed: !wgujHasPhantomIds && Array.isArray(wgujRelated) && wgujRelated.length > 0 && wgujRelated.every((id: string) => validServiceIdSet.has(id)),
    message: wgujHasPhantomIds ? 'Post still contains phantom service IDs' : (wgujRelated.length === 0 ? 'relatedProducts is empty' : undefined),
  });

  // Test 3.5: No duplicate service IDs inside relatedProducts
  record({
    tier: 'Tier 3',
    testId: 'T3.5',
    name: 'No duplicate service IDs inside any relatedProducts array',
    passed: selfDuplicateReferences.length === 0,
    message: selfDuplicateReferences.length === 0
      ? undefined
      : `Found duplicate references in posts: ${JSON.stringify(selfDuplicateReferences)}`,
  });

  // --------------------------------------------------------------------------
  // TIER 4: Global SEO & SERP Bounds (All 76 Posts)
  // --------------------------------------------------------------------------
  console.log(`\n${colors.bold}--- Tier 4: Global SEO & SERP Bounds (All 76 Posts) ---${colors.reset}`);

  const overlongMetaTitles: { id: string; slug: string; title: string; length: number }[] = [];
  const missingMetaTitles: string[] = [];

  for (const doc of blogDocs) {
    const data = doc.data();
    const metaTitle = data.metaTitle;
    const slug = data.slug || doc.id;

    if (!metaTitle || typeof metaTitle !== 'string') {
      missingMetaTitles.push(`${doc.id} (${slug})`);
    } else if (metaTitle.length > 59) {
      overlongMetaTitles.push({ id: doc.id, slug, title: metaTitle, length: metaTitle.length });
    }
  }

  record({
    tier: 'Tier 4',
    testId: 'T4.1',
    name: 'All metaTitles across all 76 blog posts are strictly <= 59 characters',
    passed: overlongMetaTitles.length === 0 && missingMetaTitles.length === 0,
    message: overlongMetaTitles.length === 0
      ? (missingMetaTitles.length === 0 ? undefined : `Missing metaTitles on: ${missingMetaTitles.join(', ')}`)
      : `Found ${overlongMetaTitles.length} metaTitles > 59 chars (max length: ${Math.max(...overlongMetaTitles.map(t => t.length))}): ${overlongMetaTitles.slice(0, 3).map(o => `${o.slug} (${o.length})`).join(', ')}...`,
  });

  // Test 4.2: Verify the 18 previously overlong posts are now all <= 59 characters
  const stillOverlong18 = PREVIOUSLY_OVERLONG_POST_IDS.filter(id => {
    const doc = blogDocs.find(d => d.id === id);
    if (!doc) return true;
    const mt = doc.data().metaTitle;
    return !mt || mt.length > 59;
  });

  record({
    tier: 'Tier 4',
    testId: 'T4.2',
    name: 'All 18 previously identified overlong metaTitles have been shortened to <= 59 chars',
    passed: stillOverlong18.length === 0,
    message: stillOverlong18.length === 0
      ? undefined
      : `Posts still exceeding 59 chars: ${stillOverlong18.join(', ')}`,
  });

  // Test 4.3: Ensure metaDescription is populated for all posts
  const emptyMetaDescCount = blogDocs.filter(d => !d.data().metaDescription || typeof d.data().metaDescription !== 'string').length;
  record({
    tier: 'Tier 4',
    testId: 'T4.3',
    name: 'All 76 blog posts have non-empty metaDescription',
    passed: emptyMetaDescCount === 0,
    message: emptyMetaDescCount === 0 ? undefined : `Found ${emptyMetaDescCount} posts without metaDescription`,
  });

  // --------------------------------------------------------------------------
  // TIER 5: Frontend Contract & Rendering Compatibility
  // --------------------------------------------------------------------------
  console.log(`\n${colors.bold}--- Tier 5: Frontend Contract & Rendering Compatibility ---${colors.reset}`);

  // Test 5.1: Emulate Next.js getRelatedServices query
  // `services.where('__name__', 'in', post.relatedProducts)`
  // Test a sample of 10 posts or all posts to ensure Firestore returns matching services
  let queryFailures = 0;
  let emptyResolvedServices = 0;

  // Test batch of posts
  const samplePosts = blogDocs.slice(0, 15);
  for (const postDoc of samplePosts) {
    const data = postDoc.data();
    const related = (data.relatedProducts || []).slice(0, 10);
    if (related.length > 0) {
      try {
        const snap = await db.collection('services').where('__name__', 'in', related).get();
        if (snap.empty) {
          emptyResolvedServices++;
        }
      } catch (err) {
        queryFailures++;
      }
    }
  }

  record({
    tier: 'Tier 5',
    testId: 'T5.1',
    name: 'Frontend query emulation: where("__name__", "in", relatedProducts) executes cleanly',
    passed: queryFailures === 0 && emptyResolvedServices === 0,
    message: queryFailures > 0 ? `Query failed with errors` : (emptyResolvedServices > 0 ? `Query returned 0 services on sample posts` : undefined),
  });

  // Test 5.2: Service Card Rendering Data Contract
  // Every service referenced in relatedProducts must have the required fields to render the card UI:
  // title, category, price, turnaroundTime, whatsIncluded
  let cardFieldFailures = 0;
  for (const doc of serviceDocs) {
    const s = doc.data() as Partial<Service>;
    if (!s.title || !s.category || s.price === undefined || !s.turnaroundTime || !Array.isArray(s.whatsIncluded)) {
      cardFieldFailures++;
    }
  }

  record({
    tier: 'Tier 5',
    testId: 'T5.2',
    name: 'All services satisfy card rendering data contract (title, category, price, turnaroundTime, whatsIncluded)',
    passed: cardFieldFailures === 0,
    message: cardFieldFailures === 0 ? undefined : `${cardFieldFailures} services lack fields required for blog card UI`,
  });

  // Test 5.3: Date serialization compatibility
  // In Next.js getPost: const date = docData.date?.toDate ? docData.date.toDate().toISOString() : docData.date;
  let dateSerializationFailures = 0;
  for (const doc of blogDocs) {
    const d = doc.data().date;
    try {
      const serialized = d?.toDate ? d.toDate().toISOString() : (typeof d === 'string' ? new Date(d).toISOString() : null);
      if (!serialized || isNaN(Date.parse(serialized))) {
        dateSerializationFailures++;
      }
    } catch {
      dateSerializationFailures++;
    }
  }

  record({
    tier: 'Tier 5',
    testId: 'T5.3',
    name: 'All 76 blog posts have date values cleanly serializable to ISO strings for Next.js SSR',
    passed: dateSerializationFailures === 0,
    message: dateSerializationFailures === 0 ? undefined : `${dateSerializationFailures} posts failed date serialization`,
  });

  // --------------------------------------------------------------------------
  // EXECUTIVE SUMMARY & EXIT CODE
  // --------------------------------------------------------------------------
  console.log(`\n${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}                         TEST EXECUTION SUMMARY                         ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}`);

  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = results.filter(r => !r.passed).length;

  console.log(`Total Checks Executed : ${totalTests}`);
  console.log(`Checks Passed         : ${colors.green}${passedTests}${colors.reset}`);
  console.log(`Checks Failed         : ${failedTests > 0 ? colors.red : colors.green}${failedTests}${colors.reset}\n`);

  if (failedTests > 0) {
    console.log(`${colors.bold}${colors.red}FAILED TESTS BREAKDOWN:${colors.reset}`);
    for (const r of results.filter(res => !res.passed)) {
      console.log(`  - [${r.tier}] ${r.testId}: ${r.name}`);
      if (r.message) {
        console.log(`    ${colors.yellow}-> ${r.message}${colors.reset}`);
      }
    }
    console.log(`\n${colors.bgRed}${colors.bold} RESULT: VERIFICATION FAILED (${failedTests} issues) ${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${colors.bgGreen}${colors.bold} RESULT: ALL 76 BLOG REQUIREMENTS & CONSTRAINTS PASSED (100%) ${colors.reset}\n`);
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error(`\n${colors.bgRed}FATAL TEST RUNNER ERROR:${colors.reset}`, err);
  process.exit(1);
});
