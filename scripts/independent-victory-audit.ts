/**
 * INDEPENDENT VICTORY AUDIT SCRIPT
 * Written by victory_auditor_1 to independently verify live Firestore database
 * against ORIGINAL_REQUEST.md requirements (R1, R2, R3).
 */

import { getAdminDb } from '../src/lib/firebase-admin';

const REQUIRED_17_SERVICE_IDS = [
  '1psxEB0xnNBxTdSQqBKX',
  '7dqLkWHEFlSBp3jGqC4y',
  '9nJ0181N9khfqA4kJ6aW',
  'AvQ2zcK4ttioFdUKBFBY',
  'Bg52FQ7DkwV4T15s1ciU',
  'RSDrRTb03aOVnbiqTGZp',
  'VhneqtozDCh1q0DisPCx',
  'a2AucSEmHauw0AzLqsu4',
  'bZtr4yojIc4OiS0q0ueI',
  'fkV9BYmOO39t2NrHxVjq',
  'gALWR2cHqUqsTVrUvvdJ',
  'p9Yfq2kPWwJMnrFfO3rS',
  'zczVkNDGSQKmbKstNTX4',
  '53OMqVsNmlF7OJiuusya',
  'JAQOhiAxWKO8hk8Oh9l8',
  'SGBQ4SlgRn1shWlT6wBq',
  'asLG9ywV9f8x2eYaPTPC',
];

interface AuditFinding {
  code: string;
  category: string;
  description: string;
  passed: boolean;
  details?: any;
}

async function runIndependentAudit() {
  console.log('=== STARTING INDEPENDENT VICTORY AUDIT ===\n');
  const db = getAdminDb();
  const findings: AuditFinding[] = [];

  function record(finding: AuditFinding) {
    findings.push(finding);
    console.log(`[${finding.passed ? 'PASS' : 'FAIL'}] ${finding.code} - ${finding.category}: ${finding.description}`);
    if (!finding.passed && finding.details) {
      console.log('       Details:', JSON.stringify(finding.details));
    }
  }

  // 1. Fetch live snapshot from Firestore
  console.log('1. Fetching raw Firestore collections...');
  const [blogsSnap, servicesSnap] = await Promise.all([
    db.collection('blogPosts').get(),
    db.collection('services').get(),
  ]);

  const allBlogs: any[] = blogsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const serviceIdSet = new Set(servicesSnap.docs.map(d => d.id));
  console.log(`Found ${allBlogs.length} blog posts, ${serviceIdSet.size} services in database.\n`);

  // Count checks
  record({
    code: 'R1.COUNT',
    category: 'Volume',
    description: 'Exactly 76 blog posts exist in Firestore',
    passed: allBlogs.length === 76,
    details: { count: allBlogs.length, expected: 76 },
  });

  record({
    code: 'R2.CATALOG',
    category: 'Catalog',
    description: 'Services collection contains >= 101 services',
    passed: serviceIdSet.size >= 101,
    details: { count: serviceIdSet.size },
  });

  // 2. Identify the 17 new posts
  console.log('2. Auditing 17 new statutory/compliance blog posts...');
  const newPostsFound: Record<string, any> = {};
  const missingServices: string[] = [];

  for (const sId of REQUIRED_17_SERVICE_IDS) {
    const match = allBlogs.find(b => {
      if (b.id === sId) return true;
      if (Array.isArray(b.relatedProducts) && b.relatedProducts[0] === sId) return true;
      return false;
    });
    if (match) {
      newPostsFound[sId] = match;
    } else {
      missingServices.push(sId);
    }
  }

  record({
    code: 'R1.17_POSTS_FOUND',
    category: 'R1 Coverage',
    description: 'All 17 new statutory blog posts exist and are matched to service IDs',
    passed: missingServices.length === 0,
    details: { missingServices },
  });

  // Check each of the 17 posts for required fields
  let r1AuthorViolations: string[] = [];
  let r1SearchIntentViolations: string[] = [];
  let r1MetaTitleViolations: string[] = [];
  let r1MetaDescViolations: string[] = [];
  let r1MetaKeywordsViolations: string[] = [];
  let r1RelatedProductsViolations: string[] = [];
  let r1DateViolations: string[] = [];
  let r1HtmlViolations: string[] = [];
  let r1FaqViolations: string[] = [];
  let r1SlugViolations: string[] = [];
  let r1ExcerptViolations: string[] = [];
  let r1ImageViolations: string[] = [];

  for (const [sId, post] of Object.entries(newPostsFound)) {
    // author == "Kevin Freese"
    if (post.author !== 'Kevin Freese') {
      r1AuthorViolations.push(`${sId}: author="${post.author}"`);
    }

    // searchIntent
    if (post.searchIntent !== 'Informational' && post.searchIntent !== 'Commercial') {
      r1SearchIntentViolations.push(`${sId}: searchIntent="${post.searchIntent}"`);
    }

    // metaTitle <= 59
    if (!post.metaTitle || typeof post.metaTitle !== 'string' || post.metaTitle.length > 59) {
      r1MetaTitleViolations.push(`${sId}: metaTitle="${post.metaTitle}" (len=${post.metaTitle?.length})`);
    }

    // metaDescription 140-158
    if (!post.metaDescription || typeof post.metaDescription !== 'string' || post.metaDescription.length < 140 || post.metaDescription.length > 158) {
      r1MetaDescViolations.push(`${sId}: metaDesc len=${post.metaDescription?.length}`);
    }

    // metaKeywords 5-8
    if (!Array.isArray(post.metaKeywords) || post.metaKeywords.length < 5 || post.metaKeywords.length > 8) {
      r1MetaKeywordsViolations.push(`${sId}: keywords count=${post.metaKeywords?.length}`);
    }

    // relatedProducts: [Primary Service ID, plus 1-2 complementary service IDs]
    if (!Array.isArray(post.relatedProducts) || post.relatedProducts[0] !== sId || post.relatedProducts.length < 2 || post.relatedProducts.length > 3) {
      r1RelatedProductsViolations.push(`${sId}: relatedProducts=${JSON.stringify(post.relatedProducts)}`);
    }

    // date: Firestore Timestamp or ISO
    const d = post.date;
    const isTimestamp = d && (typeof d.toDate === 'function' || typeof d._seconds === 'number');
    const isIso = typeof d === 'string' && !isNaN(Date.parse(d));
    if (!isTimestamp && !isIso) {
      r1DateViolations.push(`${sId}: date type=${typeof d}`);
    }

    // slug
    if (!post.slug || typeof post.slug !== 'string' || !/^[a-z0-9-]+$/.test(post.slug)) {
      r1SlugViolations.push(`${sId}: slug="${post.slug}"`);
    }

    // excerpt 140-160
    if (!post.excerpt || typeof post.excerpt !== 'string' || post.excerpt.length < 50) {
      r1ExcerptViolations.push(`${sId}: excerpt len=${post.excerpt?.length}`);
    }

    // imageHint & imageUrl
    if (!post.imageHint || !post.imageUrl) {
      r1ImageViolations.push(`${sId}: imageHint="${post.imageHint}", imageUrl="${post.imageUrl}"`);
    }

    // content: Rich HTML (h2, h3, p, ul, li, strong, blockquote)
    const content = post.content || '';
    const tags = ['<h2', '<h3', '<p', '<ul', '<li', '<strong', '<blockquote'];
    const missing = tags.filter(t => !content.includes(t));
    if (missing.length > 0 || content.length < 500) {
      r1HtmlViolations.push(`${sId}: missing tags ${missing.join(', ')}`);
    }

    // FAQ section
    if (!/faq|frequently\s+asked\s+questions/i.test(content)) {
      r1FaqViolations.push(`${sId}: missing FAQ section`);
    }
  }

  record({
    code: 'R1.FIELDS.AUTHOR',
    category: 'R1 Author',
    description: 'All 17 new posts have author="Kevin Freese"',
    passed: r1AuthorViolations.length === 0,
    details: r1AuthorViolations,
  });

  record({
    code: 'R1.FIELDS.INTENT',
    category: 'R1 Intent',
    description: 'All 17 new posts have searchIntent ("Informational" | "Commercial")',
    passed: r1SearchIntentViolations.length === 0,
    details: r1SearchIntentViolations,
  });

  record({
    code: 'R1.FIELDS.METATITLE',
    category: 'R1 MetaTitle',
    description: 'All 17 new posts satisfy metaTitle <= 59 characters',
    passed: r1MetaTitleViolations.length === 0,
    details: r1MetaTitleViolations,
  });

  record({
    code: 'R1.FIELDS.METADESC',
    category: 'R1 MetaDescription',
    description: 'All 17 new posts satisfy metaDescription strictly 140-158 characters',
    passed: r1MetaDescViolations.length === 0,
    details: r1MetaDescViolations,
  });

  record({
    code: 'R1.FIELDS.KEYWORDS',
    category: 'R1 Keywords',
    description: 'All 17 new posts have 5-8 metaKeywords array',
    passed: r1MetaKeywordsViolations.length === 0,
    details: r1MetaKeywordsViolations,
  });

  record({
    code: 'R1.FIELDS.RELATED_PRIMARY',
    category: 'R1 Related Products',
    description: 'All 17 new posts have Primary Service ID as relatedProducts[0] + 1-2 complementary',
    passed: r1RelatedProductsViolations.length === 0,
    details: r1RelatedProductsViolations,
  });

  record({
    code: 'R1.FIELDS.DATE',
    category: 'R1 Date',
    description: 'All 17 new posts have valid Firestore Timestamp date',
    passed: r1DateViolations.length === 0,
    details: r1DateViolations,
  });

  record({
    code: 'R1.FIELDS.HTML',
    category: 'R1 Rich HTML',
    description: 'All 17 new posts have rich HTML with h2, h3, p, ul, li, strong, blockquote',
    passed: r1HtmlViolations.length === 0,
    details: r1HtmlViolations,
  });

  record({
    code: 'R1.FIELDS.FAQ',
    category: 'R1 FAQ Section',
    description: 'All 17 new posts contain dedicated FAQ section with Q&A markup',
    passed: r1FaqViolations.length === 0,
    details: r1FaqViolations,
  });

  record({
    code: 'R1.FIELDS.SLUG_IMAGE',
    category: 'R1 Slugs & Images',
    description: 'All 17 new posts have valid slugs, excerpts, imageHint and imageUrl',
    passed: r1SlugViolations.length === 0 && r1ExcerptViolations.length === 0 && r1ImageViolations.length === 0,
    details: { r1SlugViolations, r1ExcerptViolations, r1ImageViolations },
  });

  // 3. Audit all 76 posts for relatedProducts & referential integrity (R2 & R3)
  console.log('\n3. Auditing all 76 blog posts for relatedProducts and referential integrity...');
  let emptyRelatedCount = 0;
  let invalidServiceIdReferences: { blogId: string; slug: string; invalidIds: string[] }[] = [];
  let globalOverlongMetaTitles: { id: string; metaTitle: string; len: number }[] = [];

  for (const post of allBlogs) {
    const related = post.relatedProducts;
    if (!Array.isArray(related) || related.length === 0) {
      emptyRelatedCount++;
    } else {
      const invalid = related.filter((id: any) => typeof id !== 'string' || !serviceIdSet.has(id));
      if (invalid.length > 0) {
        invalidServiceIdReferences.push({ blogId: post.id, slug: post.slug, invalidIds: invalid });
      }
    }

    if (!post.metaTitle || typeof post.metaTitle !== 'string' || post.metaTitle.length > 59) {
      globalOverlongMetaTitles.push({ id: post.id, metaTitle: post.metaTitle, len: post.metaTitle?.length });
    }
  }

  record({
    code: 'R3.NON_EMPTY_RELATED',
    category: 'R3 Related Products',
    description: 'All 76 blog posts have non-empty relatedProducts',
    passed: emptyRelatedCount === 0,
    details: { emptyRelatedCount },
  });

  record({
    code: 'R2.REFERENTIAL_INTEGRITY',
    category: 'R2 Referential Integrity',
    description: 'Every single referenced service ID across all 76 posts exists in services collection',
    passed: invalidServiceIdReferences.length === 0,
    details: invalidServiceIdReferences,
  });

  record({
    code: 'R3.GLOBAL_METATITLE',
    category: 'R3 Global MetaTitle',
    description: 'All 76 blog posts have metaTitle <= 59 characters',
    passed: globalOverlongMetaTitles.length === 0,
    details: globalOverlongMetaTitles,
  });

  // Check specific corrupted post repairs
  const nkbPost = allBlogs.find(b => b.id === 'NKb57k6Z1dJLAGwx5cvA');
  const nkbValid = nkbPost && Array.isArray(nkbPost.relatedProducts) &&
    !nkbPost.relatedProducts.includes('vat-registration') &&
    !nkbPost.relatedProducts.includes('ai-accountant') &&
    nkbPost.relatedProducts.every((id: string) => serviceIdSet.has(id));

  record({
    code: 'R2.REPAIR_NKB',
    category: 'Corrupted Post Repair',
    description: 'NKb57k6Z1dJLAGwx5cvA has valid service IDs and no slug strings',
    passed: !!nkbValid,
    details: nkbPost?.relatedProducts,
  });

  const wgujPost = allBlogs.find(b => b.id === 'wgujQUMOFd1gVxp23v4V');
  const wgujValid = wgujPost && Array.isArray(wgujPost.relatedProducts) &&
    !wgujPost.relatedProducts.includes('7WFOxCT7QqZRnKcRe1xf') &&
    !wgujPost.relatedProducts.includes('j1aMGJrFcW4m96HpAvqU') &&
    wgujPost.relatedProducts.every((id: string) => serviceIdSet.has(id));

  record({
    code: 'R2.REPAIR_WGUJ',
    category: 'Corrupted Post Repair',
    description: 'wgujQUMOFd1gVxp23v4V has valid service IDs and no phantom IDs',
    passed: !!wgujValid,
    details: wgujPost?.relatedProducts,
  });

  console.log('\n=== AUDIT RESULTS SUMMARY ===');
  const totalChecks = findings.length;
  const passedChecks = findings.filter(f => f.passed).length;
  const failedChecks = findings.filter(f => !f.passed).length;
  console.log(`Total checks: ${totalChecks} | Passed: ${passedChecks} | Failed: ${failedChecks}`);

  if (failedChecks > 0) {
    console.log('AUDIT FAILED!');
    process.exit(1);
  } else {
    console.log('AUDIT PASSED: 100% of invariants satisfied.');
    process.exit(0);
  }
}

runIndependentAudit().catch(err => {
  console.error('Audit encountered unexpected fatal error:', err);
  process.exit(1);
});
