/**
 * Challenger Deep Audit & Empirical Stress Test Suite
 * 
 * Verifies live Firestore collections: blogPosts & services
 * Specifically audits:
 * - blogPosts count === 76
 * - services count >= 101
 * - Every single post:
 *   - relatedProducts non-empty array of strings
 *   - EVERY ID in relatedProducts exists in services collection
 *   - No slugs or invalid IDs (especially NKb57k6Z1dJLAGwx5cvA, wgujQUMOFd1gVxp23v4V)
 *   - No old invalid IDs (7WFOxCT7QqZRnKcRe1xf, j1aMGJrFcW4m96HpAvqU) across ANY post
 *   - metaTitle <= 59 characters
 *   - Content has balanced HTML tags without unclosed containers or broken layout
 *   - 17 new compliance posts satisfy all R1 criteria
 */

import { getAdminDb } from '../src/lib/firebase-admin';

// HTML Void Elements according to W3C / WHATWG HTML5 specification
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

interface HtmlAuditResult {
  unclosedTags: string[];
  mismatchedTags: { expected: string; found: string }[];
  unexpectedClosingTags: string[];
  malformedTagSnippets: string[];
  hasBrokenLayoutRisk: boolean;
}

function auditHtmlIntegrity(html: string): HtmlAuditResult {
  const result: HtmlAuditResult = {
    unclosedTags: [],
    mismatchedTags: [],
    unexpectedClosingTags: [],
    malformedTagSnippets: [],
    hasBrokenLayoutRisk: false,
  };

  if (!html || typeof html !== 'string') {
    result.hasBrokenLayoutRisk = true;
    return result;
  }

  // Strip comments: <!-- ... -->
  const stripped = html.replace(/<!--[\s\S]*?-->/g, '');

  // Regex to match tags
  const tagRegex = /<\/?([a-zA-Z0-9]+)(\s[^>]*)?(\/?)>/g;
  let match: RegExpExecArray | null;

  const stack: { tag: string; raw: string; index: number }[] = [];

  while ((match = tagRegex.exec(stripped)) !== null) {
    const rawTag = match[0];
    const tagName = match[1].toLowerCase();
    const isClosing = rawTag.startsWith('</');
    const isSelfClosing = match[3] === '/' || rawTag.endsWith('/>');

    // Skip void elements (like <img ...>, <br>, <hr>)
    if (VOID_ELEMENTS.has(tagName)) {
      continue;
    }

    // Skip self-closing tags
    if (isSelfClosing) {
      continue;
    }

    if (isClosing) {
      if (stack.length === 0) {
        result.unexpectedClosingTags.push(rawTag);
        result.hasBrokenLayoutRisk = true;
      } else {
        const top = stack[stack.length - 1];
        if (top.tag === tagName) {
          stack.pop();
        } else {
          // Check if this closing tag matches an ancestor in the stack
          const ancestorIdx = stack.map(s => s.tag).lastIndexOf(tagName);
          if (ancestorIdx !== -1) {
            // Unclosed intervening tags
            while (stack.length > ancestorIdx + 1) {
              const popped = stack.pop()!;
              result.unclosedTags.push(popped.tag);
              // Containers unclosed are broken layout risks
              if (['div', 'section', 'article', 'table', 'ul', 'ol', 'blockquote'].includes(popped.tag)) {
                result.hasBrokenLayoutRisk = true;
              }
            }
            // Pop the matching ancestor itself
            stack.pop();
          } else {
            result.unexpectedClosingTags.push(rawTag);
          }
        }
      }
    } else {
      // Opening tag
      stack.push({ tag: tagName, raw: rawTag, index: match.index });
    }
  }

  // Any remaining tags in stack are unclosed
  while (stack.length > 0) {
    const remaining = stack.pop()!;
    result.unclosedTags.push(remaining.tag);
    if (['div', 'section', 'article', 'table', 'ul', 'ol', 'blockquote'].includes(remaining.tag)) {
      result.hasBrokenLayoutRisk = true;
    }
  }

  // Check for suspicious raw unclosed brackets like `<div` at end of content or unclosed `<`
  const danglingOpenTag = /<[a-zA-Z][^>]*$/;
  if (danglingOpenTag.test(stripped)) {
    result.malformedTagSnippets.push('Dangling unclosed tag at end of content');
    result.hasBrokenLayoutRisk = true;
  }

  return result;
}

// 17 statutory services specified in ORIGINAL_REQUEST.md
const REQUIRED_17_SERVICES = [
  { id: '1psxEB0xnNBxTdSQqBKX', name: 'Liquor Licence Application Pack' },
  { id: '7dqLkWHEFlSBp3jGqC4y', name: 'Star Grading Application (TGCSA)' },
  { id: '9nJ0181N9khfqA4kJ6aW', name: 'Solar SSEG Grid-Tie Registration' },
  { id: 'AvQ2zcK4ttioFdUKBFBY', name: 'Customs Certificate of Origin (SADC / EUR.1)' },
  { id: 'Bg52FQ7DkwV4T15s1ciU', name: 'Tourist Guide Registration (CATHSSETA)' },
  { id: 'RSDrRTb03aOVnbiqTGZp', name: 'Traffic Register Number (TRN)' },
  { id: 'VhneqtozDCh1q0DisPCx', name: 'Firearm Application Pack (SAPS 517 / 271)' },
  { id: 'a2AucSEmHauw0AzLqsu4', name: 'Electrical Contractor Registration (DoEL)' },
  { id: 'bZtr4yojIc4OiS0q0ueI', name: 'Business Plan for Funding (Bank, SEFA, NYDA)' },
  { id: 'fkV9BYmOO39t2NrHxVjq', name: 'Food Business Certificate of Acceptability (CoA)' },
  { id: 'gALWR2cHqUqsTVrUvvdJ', name: 'Transport Operating Licence Application (Form 1B)' },
  { id: 'p9Yfq2kPWwJMnrFfO3rS', name: 'Property Practitioners (PPRA) Firm Registration' },
  { id: 'zczVkNDGSQKmbKstNTX4', name: 'Cross-Border Road Transport Permit (C-BRTA)' },
  { id: '53OMqVsNmlF7OJiuusya', name: 'POPIA Compliance & Governance Pack' },
  { id: 'JAQOhiAxWKO8hk8Oh9l8', name: 'PAIA Annual Report Submission' },
  { id: 'SGBQ4SlgRn1shWlT6wBq', name: 'CSOS Scheme Support & Annual Return' },
  { id: 'asLG9ywV9f8x2eYaPTPC', name: 'POPIA Information Officer Registration' },
];

const KNOWN_PHANTOM_IDS = ['7WFOxCT7QqZRnKcRe1xf', 'j1aMGJrFcW4m96HpAvqU'];

async function runChallengerAudit() {
  console.log('========================================================================');
  console.log('         CHALLENGER DEEP AUDIT & EMPIRICAL STRESS TEST');
  console.log('========================================================================\n');

  const db = getAdminDb();
  let totalErrors = 0;
  let totalWarnings = 0;

  // 1. Fetch live collections
  console.log('Fetching live Firestore collections...');
  const [blogSnap, servicesSnap] = await Promise.all([
    db.collection('blogPosts').get(),
    db.collection('services').get(),
  ]);

  const blogDocs = blogSnap.docs;
  const serviceDocs = servicesSnap.docs;
  const serviceIdSet = new Set(serviceDocs.map(d => d.id));

  console.log(`Live blogPosts count: ${blogDocs.length}`);
  console.log(`Live services count: ${serviceDocs.length}\n`);

  // 2. Count Verifications
  console.log('--- 1. COLLECTION COUNTS ---');
  if (blogDocs.length === 76) {
    console.log(`[PASS] blogPosts count is exactly 76.`);
  } else {
    console.error(`[FAIL] blogPosts count is ${blogDocs.length}, expected exactly 76!`);
    totalErrors++;
  }

  if (serviceDocs.length >= 101) {
    console.log(`[PASS] services count is ${serviceDocs.length} (>= 101).`);
  } else {
    console.error(`[FAIL] services count is ${serviceDocs.length}, expected >= 101!`);
    totalErrors++;
  }

  // 3. Document ID and Slug integrity
  console.log('\n--- 2. SLUG & ID INTEGRITY ---');
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  let duplicateSlugs = 0;
  let invalidSlugs = 0;

  for (const doc of blogDocs) {
    const data = doc.data();
    if (seenIds.has(doc.id)) {
      console.error(`[FAIL] Duplicate blog document ID: ${doc.id}`);
      totalErrors++;
    }
    seenIds.add(doc.id);

    const slug = data.slug || doc.id;
    if (typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) {
      console.error(`[FAIL] Invalid slug format in doc ${doc.id}: "${slug}"`);
      invalidSlugs++;
      totalErrors++;
    }
    if (seenSlugs.has(slug)) {
      console.error(`[FAIL] Duplicate slug across blogPosts: "${slug}"`);
      duplicateSlugs++;
      totalErrors++;
    }
    seenSlugs.add(slug);
  }

  if (invalidSlugs === 0 && duplicateSlugs === 0) {
    console.log(`[PASS] All 76 blog posts have unique, valid URL slugs.`);
  }

  // 4. relatedProducts & Referential Integrity
  console.log('\n--- 3. RELATED PRODUCTS & REFERENTIAL INTEGRITY ---');
  let emptyRelated = 0;
  let invalidRelatedIds = 0;
  let nonStringRelated = 0;
  let slugInRelated = 0;
  let phantomIdInRelated = 0;

  for (const doc of blogDocs) {
    const data = doc.data();
    const related = data.relatedProducts;

    if (!Array.isArray(related) || related.length === 0) {
      console.error(`[FAIL] Post ${doc.id} (${data.slug}) has empty or non-array relatedProducts.`);
      emptyRelated++;
      totalErrors++;
      continue;
    }

    for (const relId of related) {
      if (typeof relId !== 'string') {
        console.error(`[FAIL] Post ${doc.id} has non-string in relatedProducts: ${relId}`);
        nonStringRelated++;
        totalErrors++;
        continue;
      }

      // Check if it's a slug instead of an ID (e.g. contains hyphens or words like 'vat-registration')
      if (relId.includes('-') || relId === 'ai-accountant' || relId === 'vat-registration') {
        console.error(`[FAIL] Post ${doc.id} contains slug instead of service ID in relatedProducts: "${relId}"`);
        slugInRelated++;
        totalErrors++;
      }

      // Check if it is one of the known phantom IDs
      if (KNOWN_PHANTOM_IDS.includes(relId)) {
        console.error(`[FAIL] Post ${doc.id} contains known phantom service ID: "${relId}"`);
        phantomIdInRelated++;
        totalErrors++;
      }

      // Check existence in services collection
      if (!serviceIdSet.has(relId)) {
        console.error(`[FAIL] Post ${doc.id} (${data.slug}) references non-existent service ID: "${relId}"`);
        invalidRelatedIds++;
        totalErrors++;
      }
    }
  }

  if (emptyRelated === 0) {
    console.log(`[PASS] All 76 blog posts have non-empty relatedProducts arrays.`);
  }
  if (invalidRelatedIds === 0 && slugInRelated === 0 && phantomIdInRelated === 0) {
    console.log(`[PASS] 100% Referential Integrity: All service IDs exist in 'services', zero slugs, zero phantom IDs.`);
  }

  // 5. Edge case inspections: NKb57k6Z1dJLAGwx5cvA & wgujQUMOFd1gVxp23v4V
  console.log('\n--- 4. TARGETED EDGE CASE VERIFICATION ---');
  const nkbDoc = blogDocs.find(d => d.id === 'NKb57k6Z1dJLAGwx5cvA');
  if (nkbDoc) {
    const nkbRel = nkbDoc.data().relatedProducts;
    console.log(`Document NKb57k6Z1dJLAGwx5cvA relatedProducts:`, nkbRel);
    const hasSlugs = nkbRel.some((s: string) => s === 'vat-registration' || s === 'ai-accountant' || s.includes('-'));
    if (hasSlugs) {
      console.error(`[FAIL] NKb57k6Z1dJLAGwx5cvA still contains corrupted slugs!`);
      totalErrors++;
    } else {
      console.log(`[PASS] NKb57k6Z1dJLAGwx5cvA successfully repaired (contains valid Firestore IDs).`);
    }
  } else {
    console.error(`[FAIL] Document NKb57k6Z1dJLAGwx5cvA not found in Firestore!`);
    totalErrors++;
  }

  const wgujDoc = blogDocs.find(d => d.id === 'wgujQUMOFd1gVxp23v4V');
  if (wgujDoc) {
    const wgujRel = wgujDoc.data().relatedProducts;
    console.log(`Document wgujQUMOFd1gVxp23v4V relatedProducts:`, wgujRel);
    const hasPhantom = wgujRel.some((s: string) => KNOWN_PHANTOM_IDS.includes(s));
    if (hasPhantom) {
      console.error(`[FAIL] wgujQUMOFd1gVxp23v4V still contains phantom IDs!`);
      totalErrors++;
    } else {
      console.log(`[PASS] wgujQUMOFd1gVxp23v4V successfully repaired (phantom IDs removed).`);
    }
  } else {
    console.error(`[FAIL] Document wgujQUMOFd1gVxp23v4V not found in Firestore!`);
    totalErrors++;
  }

  // 6. metaTitle strict <= 59 characters check across ALL 76 posts
  console.log('\n--- 5. METATITLE LENGTH CONSTRAINT (<= 59 CHARACTERS) ---');
  let overlongMetaTitles: { id: string; slug: string; metaTitle: string; length: number }[] = [];
  let missingMetaTitles: string[] = [];

  for (const doc of blogDocs) {
    const data = doc.data();
    const metaTitle = data.metaTitle;
    if (!metaTitle || typeof metaTitle !== 'string') {
      missingMetaTitles.push(doc.id);
      totalErrors++;
    } else if (metaTitle.length > 59) {
      overlongMetaTitles.push({
        id: doc.id,
        slug: data.slug || doc.id,
        metaTitle,
        length: metaTitle.length,
      });
      totalErrors++;
    }
  }

  if (missingMetaTitles.length > 0) {
    console.error(`[FAIL] ${missingMetaTitles.length} posts have missing or non-string metaTitle.`);
  }
  if (overlongMetaTitles.length > 0) {
    console.error(`[FAIL] ${overlongMetaTitles.length} posts violate metaTitle <= 59 chars:`);
    for (const item of overlongMetaTitles) {
      console.error(`  - ${item.id} (${item.slug}): "${item.metaTitle}" (length: ${item.length})`);
    }
  } else {
    console.log(`[PASS] All 76 blog posts have metaTitle strictly <= 59 characters (max observed length: ${Math.max(...blogDocs.map(d => (d.data().metaTitle || '').length))}).`);
  }

  // 7. HTML Tag Balancer & Content Integrity check across ALL 76 posts
  console.log('\n--- 6. HTML CONTENT INTEGRITY & LAYOUT RISK AUDIT ---');
  let brokenLayoutPosts: { id: string; slug: string; issue: string }[] = [];
  let postsWithTagWarnings: { id: string; unclosed: string[]; unexpected: string[] }[] = [];

  for (const doc of blogDocs) {
    const data = doc.data();
    const content = data.content;
    const slug = data.slug || doc.id;

    if (!content || typeof content !== 'string') {
      brokenLayoutPosts.push({ id: doc.id, slug, issue: 'Empty or missing content' });
      totalErrors++;
      continue;
    }

    const audit = auditHtmlIntegrity(content);
    if (audit.hasBrokenLayoutRisk) {
      brokenLayoutPosts.push({
        id: doc.id,
        slug,
        issue: `Broken layout risk: unclosed containers [${audit.unclosedTags.join(', ')}], unexpected closing [${audit.unexpectedClosingTags.join(', ')}]`,
      });
      totalErrors++;
    } else if (audit.unclosedTags.length > 0 || audit.unexpectedClosingTags.length > 0) {
      postsWithTagWarnings.push({
        id: doc.id,
        unclosed: audit.unclosedTags,
        unexpected: audit.unexpectedClosingTags,
      });
      totalWarnings++;
    }
  }

  if (brokenLayoutPosts.length > 0) {
    console.error(`[FAIL] Found ${brokenLayoutPosts.length} posts with broken layout risk or unclosed containers:`);
    for (const p of brokenLayoutPosts) {
      console.error(`  - ${p.id} (${p.slug}): ${p.issue}`);
    }
  } else {
    console.log(`[PASS] Zero posts have unclosed layout containers or broken HTML structures.`);
  }

  if (postsWithTagWarnings.length > 0) {
    console.log(`[INFO] Minor unclosed inline tags (e.g. self-closing or inline text) in ${postsWithTagWarnings.length} posts (non-fatal):`, postsWithTagWarnings.slice(0, 3));
  }

  // 8. Audit the 17 Statutory Compliance Blog Posts
  console.log('\n--- 7. R1: 17 STATUTORY SERVICES BLOG AUDIT ---');
  let missing17 = 0;
  let invalid17Schema = 0;

  for (const req of REQUIRED_17_SERVICES) {
    // Find matching post
    const post = blogDocs.find(d => {
      const data = d.data();
      return (
        d.id === req.id ||
        data.id === req.id ||
        (Array.isArray(data.relatedProducts) && data.relatedProducts[0] === req.id)
      );
    });

    if (!post) {
      console.error(`[FAIL] Missing blog post for required service: ${req.id} (${req.name})`);
      missing17++;
      totalErrors++;
      continue;
    }

    const data = post.data();
    // Validate schema
    const issues: string[] = [];
    if (!data.title) issues.push('missing title');
    if (!data.slug) issues.push('missing slug');
    if (data.author !== 'Kevin Freese') issues.push(`author is "${data.author}", expected "Kevin Freese"`);
    if (data.searchIntent !== 'Informational' && data.searchIntent !== 'Commercial') {
      issues.push(`invalid searchIntent: "${data.searchIntent}"`);
    }
    if (!data.metaTitle || data.metaTitle.length > 59) {
      issues.push(`metaTitle length ${data.metaTitle?.length} > 59`);
    }
    if (!data.metaDescription || data.metaDescription.length < 140 || data.metaDescription.length > 158) {
      issues.push(`metaDescription length ${data.metaDescription?.length} outside 140-158`);
    }
    if (!Array.isArray(data.metaKeywords) || data.metaKeywords.length < 5 || data.metaKeywords.length > 8) {
      issues.push(`metaKeywords count ${data.metaKeywords?.length} outside 5-8`);
    }
    if (!Array.isArray(data.relatedProducts) || data.relatedProducts[0] !== req.id) {
      issues.push(`relatedProducts[0] is not ${req.id}`);
    }
    if (!data.imageHint) issues.push('missing imageHint');
    if (!data.imageUrl) issues.push('missing imageUrl');
    if (!data.content || data.content.length < 500) issues.push('content is short or missing');

    // Rich content elements
    const c = data.content || '';
    if (!c.includes('<h2') || !c.includes('<h3') || !c.includes('<p') || !c.includes('<ul') || !c.includes('<blockquote')) {
      issues.push('content lacks rich semantic tags (h2, h3, p, ul, blockquote)');
    }
    if (!/faq|frequently\s+asked\s+questions/i.test(c)) {
      issues.push('content lacks FAQ section');
    }

    if (issues.length > 0) {
      console.error(`[FAIL] Post for ${req.name} (${req.id}) has schema issues: ${issues.join('; ')}`);
      invalid17Schema++;
      totalErrors++;
    } else {
      console.log(`[PASS] ${req.name} (${post.id}): Verified complete schema, SEO bounds, and rich content.`);
    }
  }

  // 9. Summary Verdict
  console.log('\n========================================================================');
  console.log('                    CHALLENGER AUDIT SUMMARY');
  console.log('========================================================================');
  console.log(`Total Errors Detected  : ${totalErrors}`);
  console.log(`Total Warnings Detected: ${totalWarnings}`);

  if (totalErrors === 0) {
    console.log('\n>>> EMPIRICAL VERDICT: ALL PASS <<<');
    process.exit(0);
  } else {
    console.error(`\n>>> EMPIRICAL VERDICT: FAIL (${totalErrors} blocking errors found) <<<`);
    process.exit(1);
  }
}

runChallengerAudit().catch(err => {
  console.error('Fatal error running challenger audit:', err);
  process.exit(1);
});
