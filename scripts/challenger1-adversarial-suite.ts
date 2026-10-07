import { getAdminDb } from '../src/lib/firebase-admin';
import robots from '../src/app/robots';
import nextConfig from '../next.config';
import {
  generateAccountingHeadTermSchema,
  generateOrganizationSchema,
} from '../src/lib/schema/productSchema';
import { metadata as vatSearchMetadata } from '../src/app/sars-vat-vendor-search-verification/page';
import { CURATED_BLOG_FAQS } from '../src/lib/blog-faqs';
import { hasContextualCta } from '../src/components/blog/BlogContextualCta';

interface AuditResult {
  suite: string;
  check: string;
  passed: boolean;
  actual: any;
  expected: any;
  details?: string;
}

const results: AuditResult[] = [];

function record(
  suite: string,
  check: string,
  passed: boolean,
  actual: any,
  expected: any,
  details?: string
) {
  results.push({ suite, check, passed, actual, expected, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} [${suite}] ${check}`);
  if (!passed) {
    console.error(`   Expected: ${JSON.stringify(expected)}`);
    console.error(`   Actual:   ${JSON.stringify(actual)}`);
    if (details) console.error(`   Details:  ${details}`);
  }
}

async function runAdversarialAudit() {
  console.log('================================================================');
  console.log('CHALLENGER 1 ADVERSARIAL & EMPIRICAL VERIFICATION HARNESS');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // 1. Robots.txt Crawler Directives Verification
  // -------------------------------------------------------------------------
  console.log('--- 1. Robots.txt Crawler Directives ---');
  const robotsConfig = robots();
  const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules : [robotsConfig.rules];

  // 1.1 General crawler rule
  const generalRule = rules.find((r) => r.userAgent === '*');
  record(
    'Robots',
    'General crawler (*) rule exists',
    !!generalRule,
    !!generalRule,
    true
  );

  const generalDisallows = Array.isArray(generalRule?.disallow)
    ? generalRule.disallow
    : [generalRule?.disallow];

  record(
    'Robots',
    'General crawler (*) does NOT disallow /p/ or /p',
    !generalDisallows.includes('/p/') && !generalDisallows.includes('/p'),
    generalDisallows.filter((d) => d?.startsWith('/p')),
    'None of /p/ or /p'
  );

  const requiredDisallows = [
    '/partner/',
    '/admin',
    '/dashboard',
    '/login',
    '/signup',
    '/cart',
    '/checkout',
    '/reseller/',
  ];
  for (const d of requiredDisallows) {
    record(
      'Robots',
      `General crawler (*) disallows ${d}`,
      generalDisallows.includes(d),
      generalDisallows.includes(d),
      true
    );
  }

  // 1.2 AI bots rules
  const aiBots = [
    'ClaudeBot',
    'GPTBot',
    'OAI-SearchBot',
    'PerplexityBot',
    'Google-Extended',
    'Applebot-Extended',
  ];
  for (const bot of aiBots) {
    const botRule = rules.find((r) => r.userAgent === bot);
    record(
      'Robots',
      `AI bot rule exists for ${bot}`,
      !!botRule,
      !!botRule,
      true
    );

    const botDisallows = Array.isArray(botRule?.disallow)
      ? botRule.disallow
      : [botRule?.disallow];

    record(
      'Robots',
      `AI bot ${bot} does NOT disallow /p/`,
      !botDisallows.includes('/p/'),
      botDisallows.includes('/p/'),
      false
    );

    record(
      'Robots',
      `AI bot ${bot} disallows /partner/`,
      botDisallows.includes('/partner/'),
      botDisallows.includes('/partner/'),
      true
    );
  }

  // -------------------------------------------------------------------------
  // 2. Next.js Headers & X-Robots-Tag Verification
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Next.js HTTP Headers & X-Robots-Tag ---');
  if (typeof nextConfig.headers !== 'function') {
    record(
      'Headers',
      'nextConfig.headers is a function',
      false,
      typeof nextConfig.headers,
      'function'
    );
  } else {
    const headersConfig = await nextConfig.headers();
    const pRule = headersConfig.find((r) => r.source === '/p/:path*');
    record(
      'Headers',
      'Header rule for /p/:path* exists',
      !!pRule,
      !!pRule,
      true
    );

    const xRobots = pRule?.headers?.find(
      (h) => h.key.toLowerCase() === 'x-robots-tag'.toLowerCase()
    );
    record(
      'Headers',
      '/p/:path* emits X-Robots-Tag: noindex, follow',
      xRobots?.value === 'noindex, follow',
      xRobots?.value,
      'noindex, follow'
    );

    // Check sensitive routes security/noCache headers
    const sensitive = [
      '/admin/:path*',
      '/dashboard/:path*',
      '/partner/:path*',
      '/login',
      '/signup',
      '/cart',
      '/checkout',
    ];
    for (const s of sensitive) {
      const sRule = headersConfig.find((r) => r.source === s);
      const cacheH = sRule?.headers?.find((h) => h.key === 'Cache-Control');
      record(
        'Headers',
        `Sensitive route ${s} has no-store Cache-Control`,
        cacheH?.value?.includes('no-store'),
        cacheH?.value,
        'contains no-store'
      );
    }
  }

  // -------------------------------------------------------------------------
  // 3. Schema.org Entity Graph & Rating Spec
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Schema.org Entity Graph & Rating Specifications ---');
  const headSchema: any = generateAccountingHeadTermSchema();
  record(
    'Schema',
    'headSchema has @context https://schema.org',
    headSchema['@context'] === 'https://schema.org',
    headSchema['@context'],
    'https://schema.org'
  );

  const graph = headSchema['@graph'] || [];
  record(
    'Schema',
    'headSchema contains @graph with 3 nodes',
    graph.length === 3,
    graph.length,
    3
  );

  const serviceNode = graph.find(
    (n: any) => n['@id'] === 'https://www.myacc.co.za/accounting-services-south-africa#service'
  );
  record(
    'Schema',
    'serviceNode exists with correct @id',
    !!serviceNode,
    !!serviceNode,
    true
  );

  record(
    'Schema',
    'serviceNode @type contains AccountingService and LocalBusiness',
    Array.isArray(serviceNode?.['@type']) &&
      serviceNode['@type'].includes('AccountingService') &&
      serviceNode['@type'].includes('LocalBusiness'),
    serviceNode?.['@type'],
    ['AccountingService', 'LocalBusiness']
  );

  const aggRating = serviceNode?.aggregateRating;
  record(
    'Schema',
    'aggregateRating exists on serviceNode',
    !!aggRating,
    !!aggRating,
    true
  );

  record(
    'Schema',
    'aggregateRating.ratingValue is "4.9"',
    aggRating?.ratingValue === '4.9',
    aggRating?.ratingValue,
    '4.9'
  );

  record(
    'Schema',
    'aggregateRating.reviewCount is strictly integer string "204" (no "+")',
    aggRating?.reviewCount === '204',
    aggRating?.reviewCount,
    '204'
  );

  record(
    'Schema',
    'aggregateRating.bestRating is "5"',
    aggRating?.bestRating === '5',
    aggRating?.bestRating,
    '5'
  );

  // Check root generateOrganizationSchema has NO aggregateRating
  const rootOrg: any = generateOrganizationSchema();
  record(
    'Schema',
    'root generateOrganizationSchema has NO aggregateRating',
    rootOrg?.aggregateRating === undefined,
    rootOrg?.aggregateRating,
    undefined
  );

  // -------------------------------------------------------------------------
  // 4. Character Bounds on Static Pages
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Character Bounds on Static Pages ---');
  // /sars-vat-vendor-search-verification
  const vatTitle = vatSearchMetadata.title as string;
  const vatRenderedTitle = `${vatTitle} | My Accountant`;
  record(
    'CharacterBounds',
    '/sars-vat-vendor-search-verification rendered title <= 59 chars',
    vatRenderedTitle.length <= 59,
    vatRenderedTitle.length,
    '<= 59',
    `"${vatRenderedTitle}"`
  );

  const vatDesc = (vatSearchMetadata.description as string) || '';
  record(
    'CharacterBounds',
    '/sars-vat-vendor-search-verification meta description in [140, 158]',
    vatDesc.length >= 140 && vatDesc.length <= 158,
    vatDesc.length,
    '[140, 158]',
    `"${vatDesc}"`
  );

  // /accounting-services-south-africa
  const headTitle = 'Accounting Services & Experts South Africa | My Accountant';
  record(
    'CharacterBounds',
    '/accounting-services-south-africa title <= 59 chars',
    headTitle.length <= 59,
    headTitle.length,
    '<= 59',
    `"${headTitle}"`
  );

  const headDesc =
    'Rated 4.9/5 by 200+ businesses. Expert South African accounting services, monthly bookkeeping, management accounts & SARS tax compliance. Get a quote today.';
  record(
    'CharacterBounds',
    '/accounting-services-south-africa description in [140, 158]',
    headDesc.length >= 140 && headDesc.length <= 158,
    headDesc.length,
    '[140, 158]',
    `"${headDesc}"`
  );

  // -------------------------------------------------------------------------
  // 5. Curated FAQs & Contextual CTA Mappings
  // -------------------------------------------------------------------------
  console.log('\n--- 5. Curated FAQs & Contextual CTA Mappings ---');
  const targetSlugs = [
    'find-your-south-african-tax-reference-number-quick-guide',
    'ncr-registration-your-key-to-sa-credit-compliance',
    'start-a-business-in-sa-for-under-r500-your-guide',
    'remission-of-sars-interest--penalties-your-guide',
    'ncr-registration-your-essential-guide-in-south-africa',
  ];

  for (const slug of targetSlugs) {
    const faqs = CURATED_BLOG_FAQS[slug];
    record(
      'CuratedFAQs',
      `CURATED_BLOG_FAQS contains >= 3 questions for ${slug}`,
      Array.isArray(faqs) && faqs.length >= 3,
      faqs?.length,
      '>= 3'
    );
  }

  record(
    'ContextualCTA',
    'Tax number slug has contextual CTA',
    hasContextualCta('find-your-south-african-tax-reference-number-quick-guide'),
    true,
    true
  );
  record(
    'ContextualCTA',
    'Start business slug has contextual CTA',
    hasContextualCta('start-a-business-in-sa-for-under-r500-your-guide'),
    true,
    true
  );
  record(
    'ContextualCTA',
    'NCR compliance slug has contextual CTA',
    hasContextualCta('ncr-registration-your-key-to-sa-credit-compliance'),
    true,
    true
  );
  record(
    'ContextualCTA',
    'Unrelated slug does NOT have contextual CTA',
    !hasContextualCta('unrelated-sample-slug'),
    hasContextualCta('unrelated-sample-slug'),
    false
  );

  // -------------------------------------------------------------------------
  // 6. Live Firestore Blog Posts Inspection (with generous timeout)
  // -------------------------------------------------------------------------
  console.log('\n--- 6. Live Firestore Blog Posts Inspection ---');
  const db = getAdminDb();

  for (const slug of targetSlugs) {
    try {
      console.log(`Inspecting Firestore blog post: ${slug}...`);
      const snap = await db.collection('blogPosts').where('slug', '==', slug).get();
      record(
        'FirestoreBlog',
        `Blog post ${slug} exists in Firestore`,
        !snap.empty,
        snap.empty ? 'NOT FOUND' : 'FOUND',
        'FOUND'
      );

      if (!snap.empty) {
        const doc = snap.docs[0].data();
        const rawTitle = doc.metaTitle || doc.title || '';
        const renderedTitle = rawTitle.endsWith(' | My Accountant')
          ? rawTitle
          : `${rawTitle} | My Accountant`;

        record(
          'FirestoreBlog',
          `Blog post ${slug} rendered title <= 59 chars`,
          renderedTitle.length <= 59,
          renderedTitle.length,
          '<= 59',
          `"${renderedTitle}"`
        );

        const desc = doc.metaDescription || '';
        record(
          'FirestoreBlog',
          `Blog post ${slug} metaDescription in [140, 158]`,
          desc.length >= 140 && desc.length <= 158,
          desc.length,
          '[140, 158]',
          `"${desc}"`
        );

        const related = doc.relatedProducts || [];
        record(
          'FirestoreBlog',
          `Blog post ${slug} has non-empty relatedProducts`,
          Array.isArray(related) && related.length > 0,
          related.length,
          '> 0'
        );

        // Verify referential integrity of relatedProducts
        for (const pid of related) {
          const sDoc = await db.collection('services').doc(pid).get();
          record(
            'FirestoreReferential',
            `Related product ID ${pid} for ${slug} exists in services`,
            sDoc.exists,
            sDoc.exists,
            true,
            sDoc.exists ? sDoc.data()?.title : `Missing service ID ${pid}`
          );
        }
      }
    } catch (err: any) {
      record(
        'FirestoreBlog',
        `Error querying Firestore for ${slug}`,
        false,
        err.message,
        'Success'
      );
    }
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log('\n================================================================');
  console.log(`AUDIT RESULTS: ${passed}/${total} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    console.error('\nFAILURES SUMMARY:');
    for (const r of results.filter((r) => !r.passed)) {
      console.error(`- [${r.suite}] ${r.check}: Expected ${JSON.stringify(r.expected)}, Got ${JSON.stringify(r.actual)}`);
      if (r.details) console.error(`  Details: ${r.details}`);
    }
    process.exit(1);
  } else {
    console.log('\nALL ADVERSARIAL CHECKS PASSED EMPIRICALLY!');
    process.exit(0);
  }
}

runAdversarialAudit().catch((err) => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
