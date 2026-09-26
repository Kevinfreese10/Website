/**
 * Independent Forensic Integrity Verification Script (Iteration 2)
 *
 * Authored by: auditor_iter2_1
 * Purpose: Independently query live Firestore without relying on prior test files,
 *          verifying 100% of claims, constraints, and requirements empirically.
 */

import { getAdminDb } from '../src/lib/firebase-admin';

const R1_TARGET_SERVICES = [
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

const PREVIOUSLY_CORRUPTED = ['NKb57k6Z1dJLAGwx5cvA', 'wgujQUMOFd1gVxp23v4V'];

const PREVIOUSLY_OVERLONG_18 = [
  '1JoL5OQpD8yp2lbu34oR', 'NKb57k6Z1dJLAGwx5cvA', 'VWzGqKxtBJ5ed9sctQv7',
  '5nh068vEP3u5Gwzn9Qap', '6ELwfNdUFq5k97sbJuL9', '2xqD1PW1BY63BvKRgeQS',
  '69AWx2yD8B6ns9LCV5Ep', 'HfFd00pjjHOcpUu3ikOu', 'QmGPNC4yQw62VHQZciAR',
  '2mv6uolNY5cbStKx3Xdx', 'BtZG5roMzFXjwfzOwqVa', 'CJ4oOh3GNXwU13OzAzKL',
  'RqeWk3n3MbfBJxjWwOfo', 'XApGN7ADQzxdF4RZCa7M', 'NHaTQqDokqYz1STpfFX9',
  'GwF5g5ag9nfgRps03IR5', 'KE8aHleHZBXSm56qgb15', 'PlvPLKUpo7UcASBNLNo7',
];

interface Finding {
  category: string;
  item: string;
  status: 'PASS' | 'FAIL';
  detail: string;
}

async function runForensicAudit() {
  const db = getAdminDb();
  const findings: Finding[] = [];

  console.log('=== FORENSIC AUDITOR INDEPENDENT DATABASE AUDIT ===\n');

  // Fetch Firestore snapshots
  console.log('1. Querying live Firestore collections...');
  const blogSnap = await db.collection('blogPosts').get();
  const serviceSnap = await db.collection('services').get();

  const blogCount = blogSnap.size;
  const serviceCount = serviceSnap.size;
  console.log(`Live counts: blogPosts = ${blogCount}, services = ${serviceCount}\n`);

  // Check 1: Blog post count exactly 76
  findings.push({
    category: 'Volume & Integrity',
    item: 'Total blog post count === 76',
    status: blogCount === 76 ? 'PASS' : 'FAIL',
    detail: `Found ${blogCount} documents in collection 'blogPosts'. Expected 76.`,
  });

  // Check 2: Service count >= 101
  findings.push({
    category: 'Volume & Integrity',
    item: 'Total service count >= 101',
    status: serviceCount >= 101 ? 'PASS' : 'FAIL',
    detail: `Found ${serviceCount} documents in collection 'services'. Expected >= 101.`,
  });

  const validServiceIds = new Set(serviceSnap.docs.map(d => d.id));
  const blogDocs = blogSnap.docs;

  // Check 3: Document ID & Slug uniqueness
  const docIds = new Set<string>();
  const slugs = new Set<string>();
  let dupDocIds = 0;
  let dupSlugs = 0;
  let invalidSlugs = 0;
  const slugRegex = /^[a-z0-9-]+$/;

  for (const doc of blogDocs) {
    if (docIds.has(doc.id)) dupDocIds++;
    docIds.add(doc.id);

    const s = doc.data().slug || doc.id;
    if (typeof s !== 'string' || !slugRegex.test(s)) {
      invalidSlugs++;
      console.error(`Invalid slug: ${doc.id} -> ${s}`);
    }
    if (slugs.has(s)) {
      dupSlugs++;
      console.error(`Duplicate slug detected: ${s} in doc ${doc.id}`);
    }
    slugs.add(s);
  }

  findings.push({
    category: 'Volume & Integrity',
    item: 'Doc ID and Slug uniqueness',
    status: (dupDocIds === 0 && dupSlugs === 0 && invalidSlugs === 0) ? 'PASS' : 'FAIL',
    detail: `Duplicate Doc IDs: ${dupDocIds}, Duplicate Slugs: ${dupSlugs}, Invalid Slugs: ${invalidSlugs}`,
  });

  // Check 4: R1 - 17 New Compliance Posts
  console.log('2. Auditing 17 New Compliance Posts...');
  let r1Missing = 0;
  let r1PrimaryMismatch = 0;
  let r1ComplementaryInvalid = 0;
  let r1AuthorInvalid = 0;
  let r1IntentInvalid = 0;
  let r1MetaTitleOverlong = 0;
  let r1MetaDescInvalid = 0;
  let r1KeywordsInvalid = 0;
  let r1DateInvalid = 0;
  let r1HtmlMissingTags = 0;
  let r1MissingFaq = 0;
  let r1LowWordCount = 0;

  for (const target of R1_TARGET_SERVICES) {
    const postDoc = blogDocs.find(d => {
      const data = d.data();
      return (
        d.id === target.id ||
        data.id === target.id ||
        (Array.isArray(data.relatedProducts) && data.relatedProducts[0] === target.id)
      );
    });

    if (!postDoc) {
      r1Missing++;
      console.error(`Missing post for target: ${target.id} (${target.name})`);
      continue;
    }

    const data = postDoc.data();

    // Primary ID
    if (!Array.isArray(data.relatedProducts) || data.relatedProducts[0] !== target.id) {
      r1PrimaryMismatch++;
    }

    // Complementary count (2 to 3 total)
    if (!Array.isArray(data.relatedProducts) || data.relatedProducts.length < 2 || data.relatedProducts.length > 3) {
      r1ComplementaryInvalid++;
    }

    // Check all related IDs exist in services
    for (const rid of (data.relatedProducts || [])) {
      if (!validServiceIds.has(rid)) {
        r1ComplementaryInvalid++;
        console.error(`Post ${postDoc.id} references non-existent service ID: ${rid}`);
      }
    }

    // Author
    if (data.author !== 'Kevin Freese') {
      r1AuthorInvalid++;
    }

    // Search Intent
    if (data.searchIntent !== 'Informational' && data.searchIntent !== 'Commercial') {
      r1IntentInvalid++;
    }

    // metaTitle <= 59
    if (!data.metaTitle || data.metaTitle.length > 59) {
      r1MetaTitleOverlong++;
      console.error(`R1 metaTitle overlong: ${data.metaTitle} (${data.metaTitle?.length})`);
    }

    // metaDescription 140-158
    if (!data.metaDescription || data.metaDescription.length < 140 || data.metaDescription.length > 158) {
      r1MetaDescInvalid++;
      console.error(`R1 metaDescription out of bounds: "${data.metaDescription}" (${data.metaDescription?.length})`);
    }

    // metaKeywords 5-8
    if (!Array.isArray(data.metaKeywords) || data.metaKeywords.length < 5 || data.metaKeywords.length > 8) {
      r1KeywordsInvalid++;
    }

    // Date
    const d = data.date;
    const isTimestamp = d && (typeof d.toDate === 'function' || typeof d._seconds === 'number');
    const isIso = typeof d === 'string' && !isNaN(Date.parse(d));
    if (!isTimestamp && !isIso) {
      r1DateInvalid++;
    }

    // HTML Content
    const content = data.content || '';
    const hasH2 = content.includes('<h2');
    const hasH3 = content.includes('<h3');
    const hasP = content.includes('<p');
    const hasUl = content.includes('<ul') && content.includes('<li');
    const hasStrong = content.includes('<strong');
    const hasBlockquote = content.includes('<blockquote');
    if (!hasH2 || !hasH3 || !hasP || !hasUl || !hasStrong || !hasBlockquote) {
      r1HtmlMissingTags++;
      console.error(`Post ${postDoc.id} missing rich HTML tags: h2=${hasH2}, h3=${hasH3}, p=${hasP}, ul=${hasUl}, strong=${hasStrong}, blockquote=${hasBlockquote}`);
    }

    // FAQ section
    if (!/faq|frequently\s+asked\s+questions/i.test(content)) {
      r1MissingFaq++;
    }

    // Content length (> 500 words / authentic content)
    const words = content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
    if (words < 500) {
      r1LowWordCount++;
    }
  }

  findings.push({
    category: 'R1 - 17 Compliance Posts',
    item: '17 Posts Presence & Primary Service Match',
    status: (r1Missing === 0 && r1PrimaryMismatch === 0) ? 'PASS' : 'FAIL',
    detail: `Missing: ${r1Missing}, Primary Service ID Mismatch: ${r1PrimaryMismatch}`,
  });

  findings.push({
    category: 'R1 - 17 Compliance Posts',
    item: '1-2 Complementary Service IDs & Referential Integrity',
    status: r1ComplementaryInvalid === 0 ? 'PASS' : 'FAIL',
    detail: `Complementary invalid / non-existent count: ${r1ComplementaryInvalid}`,
  });

  findings.push({
    category: 'R1 - 17 Compliance Posts',
    item: 'Author "Kevin Freese" & Valid searchIntent',
    status: (r1AuthorInvalid === 0 && r1IntentInvalid === 0) ? 'PASS' : 'FAIL',
    detail: `Author invalid: ${r1AuthorInvalid}, Intent invalid: ${r1IntentInvalid}`,
  });

  findings.push({
    category: 'R1 - 17 Compliance Posts',
    item: 'metaTitle <= 59 & metaDescription 140-158',
    status: (r1MetaTitleOverlong === 0 && r1MetaDescInvalid === 0) ? 'PASS' : 'FAIL',
    detail: `metaTitle overlong: ${r1MetaTitleOverlong}, metaDesc out of bounds: ${r1MetaDescInvalid}`,
  });

  findings.push({
    category: 'R1 - 17 Compliance Posts',
    item: 'Rich HTML (h2, h3, p, ul, li, strong, blockquote) & FAQ Section',
    status: (r1HtmlMissingTags === 0 && r1MissingFaq === 0 && r1LowWordCount === 0) ? 'PASS' : 'FAIL',
    detail: `Missing semantic tags: ${r1HtmlMissingTags}, Missing FAQ: ${r1MissingFaq}, Low word count: ${r1LowWordCount}`,
  });

  // Check 5: R2 - 59 Existing Posts Audited
  console.log('3. Auditing 59 Existing Posts...');
  // Find all posts that are NOT one of the 17 new posts
  const existingPosts = blogDocs.filter(d => {
    const data = d.data();
    return !R1_TARGET_SERVICES.some(t =>
      d.id === t.id || data.id === t.id || (Array.isArray(data.relatedProducts) && data.relatedProducts[0] === t.id)
    );
  });

  console.log(`Found ${existingPosts.length} existing posts.`);
  findings.push({
    category: 'R2 - Existing Posts',
    item: 'Existing posts count === 59',
    status: existingPosts.length === 59 ? 'PASS' : 'FAIL',
    detail: `Found ${existingPosts.length} existing posts. Total = ${blogCount} (59 + 17 = 76).`,
  });

  // Existing posts relatedProducts check
  let existingEmptyRelated = 0;
  let existingInvalidReferential = 0;
  for (const doc of existingPosts) {
    const rel = doc.data().relatedProducts;
    if (!Array.isArray(rel) || rel.length === 0) {
      existingEmptyRelated++;
    } else {
      for (const id of rel) {
        if (!validServiceIds.has(id)) {
          existingInvalidReferential++;
          console.error(`Existing doc ${doc.id} has invalid service ID: ${id}`);
        }
      }
    }
  }

  findings.push({
    category: 'R2 - Existing Posts',
    item: 'All 59 existing posts have non-empty valid relatedProducts',
    status: (existingEmptyRelated === 0 && existingInvalidReferential === 0) ? 'PASS' : 'FAIL',
    detail: `Empty related: ${existingEmptyRelated}, Invalid service references: ${existingInvalidReferential}`,
  });

  // Repair checks on NKb57k6Z1dJLAGwx5cvA and wgujQUMOFd1gVxp23v4V
  const nkb = blogDocs.find(d => d.id === 'NKb57k6Z1dJLAGwx5cvA')?.data();
  const nkbCorrupt = nkb && Array.isArray(nkb.relatedProducts) && (nkb.relatedProducts.includes('vat-registration') || nkb.relatedProducts.includes('ai-accountant'));
  findings.push({
    category: 'R2 - Existing Posts',
    item: 'NKb57k6Z1dJLAGwx5cvA corrupt slug strings removed',
    status: (!nkbCorrupt && nkb && Array.isArray(nkb.relatedProducts) && nkb.relatedProducts.length > 0) ? 'PASS' : 'FAIL',
    detail: `Current relatedProducts: ${JSON.stringify(nkb?.relatedProducts)}`,
  });

  const wguj = blogDocs.find(d => d.id === 'wgujQUMOFd1gVxp23v4V')?.data();
  const wgujCorrupt = wguj && Array.isArray(wguj.relatedProducts) && (wguj.relatedProducts.includes('7WFOxCT7QqZRnKcRe1xf') || wguj.relatedProducts.includes('j1aMGJrFcW4m96HpAvqU'));
  findings.push({
    category: 'R2 - Existing Posts',
    item: 'wgujQUMOFd1gVxp23v4V phantom service IDs removed',
    status: (!wgujCorrupt && wguj && Array.isArray(wguj.relatedProducts) && wguj.relatedProducts.length > 0) ? 'PASS' : 'FAIL',
    detail: `Current relatedProducts: ${JSON.stringify(wguj?.relatedProducts)}`,
  });

  // Check 18 previously overlong metaTitles
  let overlong18StillBad = 0;
  for (const pid of PREVIOUSLY_OVERLONG_18) {
    const post = blogDocs.find(d => d.id === pid)?.data();
    if (!post || !post.metaTitle || post.metaTitle.length > 59) {
      overlong18StillBad++;
      console.error(`Post ${pid} still overlong: "${post?.metaTitle}" (${post?.metaTitle?.length})`);
    }
  }
  findings.push({
    category: 'R2 - Existing Posts',
    item: '18 previously overlong metaTitles fixed (all <= 59 chars)',
    status: overlong18StillBad === 0 ? 'PASS' : 'FAIL',
    detail: `Still overlong: ${overlong18StillBad} of 18`,
  });

  // Check 6: R3 - Global Verification across ALL 76 Blog Posts
  console.log('4. Auditing All 76 Posts Globally for R3 Constraints...');
  let globalEmptyRelated = 0;
  let globalInvalidServiceIds = 0;
  let globalDuplicateIdsInArray = 0;
  let globalOverlongMetaTitle = 0;
  let globalMissingMetaDesc = 0;
  let maxMetaTitleLen = 0;
  let maxMetaTitleSlug = '';

  for (const doc of blogDocs) {
    const data = doc.data();
    const rel = data.relatedProducts;

    if (!Array.isArray(rel) || rel.length === 0) {
      globalEmptyRelated++;
    } else {
      const seen = new Set<string>();
      for (const id of rel) {
        if (!validServiceIds.has(id)) {
          globalInvalidServiceIds++;
        }
        if (seen.has(id)) {
          globalDuplicateIdsInArray++;
        }
        seen.add(id);
      }
    }

    const mt = data.metaTitle;
    if (!mt || typeof mt !== 'string' || mt.length > 59) {
      globalOverlongMetaTitle++;
      console.error(`Global metaTitle violation in ${doc.id}: "${mt}" (${mt?.length})`);
    }
    if (mt && mt.length > maxMetaTitleLen) {
      maxMetaTitleLen = mt.length;
      maxMetaTitleSlug = data.slug || doc.id;
    }

    if (!data.metaDescription || typeof data.metaDescription !== 'string') {
      globalMissingMetaDesc++;
    }
  }

  findings.push({
    category: 'R3 - Global Verification',
    item: 'All 76 posts have non-empty relatedProducts',
    status: globalEmptyRelated === 0 ? 'PASS' : 'FAIL',
    detail: `Empty relatedProducts: ${globalEmptyRelated} of 76`,
  });

  findings.push({
    category: 'R3 - Global Verification',
    item: '100% referential integrity with services collection (0 orphaned IDs)',
    status: (globalInvalidServiceIds === 0 && globalDuplicateIdsInArray === 0) ? 'PASS' : 'FAIL',
    detail: `Invalid IDs: ${globalInvalidServiceIds}, Duplicate IDs: ${globalDuplicateIdsInArray}`,
  });

  findings.push({
    category: 'R3 - Global Verification',
    item: 'All 76 posts have metaTitle strictly <= 59 characters',
    status: globalOverlongMetaTitle === 0 ? 'PASS' : 'FAIL',
    detail: `Violations: ${globalOverlongMetaTitle} of 76. Maximum length: ${maxMetaTitleLen} (${maxMetaTitleSlug})`,
  });

  // Check 7: Next.js Query Emulation Test
  console.log('5. Emulating Next.js Related Products Query Resolution...');
  let queryErrors = 0;
  let emptyResolutions = 0;
  for (const doc of blogDocs.slice(0, 20)) {
    const rel = doc.data().relatedProducts;
    if (Array.isArray(rel) && rel.length > 0) {
      try {
        const snap = await db.collection('services').where('__name__', 'in', rel.slice(0, 10)).get();
        if (snap.empty) {
          emptyResolutions++;
        }
      } catch (e: any) {
        queryErrors++;
        console.error(`Query emulation failed for doc ${doc.id}:`, e.message);
      }
    }
  }

  findings.push({
    category: 'Frontend Contract',
    item: 'Firestore query emulation where("__name__", "in", relatedProducts)',
    status: (queryErrors === 0 && emptyResolutions === 0) ? 'PASS' : 'FAIL',
    detail: `Query errors: ${queryErrors}, Empty resolutions: ${emptyResolutions} (tested on 20 posts)`,
  });

  // Check 8: HTML Quality and Structure (Adversarial stress-test)
  console.log('6. Adversarial HTML syntax and semantic inspection...');
  let unbalancedTagsCount = 0;
  for (const doc of blogDocs) {
    const c = doc.data().content;
    if (typeof c === 'string') {
      const openOl = (c.match(/<ol/gi) || []).length;
      const closeOl = (c.match(/<\/ol>/gi) || []).length;
      const openUl = (c.match(/<ul/gi) || []).length;
      const closeUl = (c.match(/<\/ul>/gi) || []).length;
      if (openOl !== closeOl || openUl !== closeUl) {
        unbalancedTagsCount++;
        console.error(`Unbalanced list tags in ${doc.id}: ol(${openOl}/${closeOl}), ul(${openUl}/${closeUl})`);
      }
    }
  }

  findings.push({
    category: 'Adversarial Stress Test',
    item: 'HTML markup balance (ol, ul tags)',
    status: unbalancedTagsCount === 0 ? 'PASS' : 'FAIL',
    detail: `Posts with unbalanced list tags: ${unbalancedTagsCount}`,
  });

  // Summary
  console.log('\n=== AUDIT SUMMARY RESULTS ===');
  let passCount = 0;
  let failCount = 0;
  for (const f of findings) {
    const symbol = f.status === 'PASS' ? '✅' : '❌';
    console.log(`${symbol} [${f.category}] ${f.item}: ${f.status} - ${f.detail}`);
    if (f.status === 'PASS') passCount++;
    else failCount++;
  }

  console.log(`\nTotal Checks: ${findings.length}`);
  console.log(`PASS: ${passCount}`);
  console.log(`FAIL: ${failCount}`);

  if (failCount > 0) {
    console.error(`\nVERDICT: INTEGRITY VIOLATION / CHEATING DETECTED (${failCount} failures)`);
    process.exit(1);
  } else {
    console.log('\nVERDICT: CLEAN (All integrity checks passed)');
    process.exit(0);
  }
}

runForensicAudit().catch(err => {
  console.error('Fatal audit runner error:', err);
  process.exit(1);
});
