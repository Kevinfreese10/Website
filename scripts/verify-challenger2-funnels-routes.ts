import { getAdminDb } from '../src/lib/firebase-admin';
import fs from 'fs';
import path from 'path';
import { CURATED_BLOG_FAQS } from '../src/lib/blog-faqs';
import { hasContextualCta } from '../src/components/blog/BlogContextualCta';

async function verifyAll() {
  const db = getAdminDb();
  console.log('=== CHALLENGER 2 EMPIRICAL VERIFICATION ===\n');

  let failureCount = 0;
  const recordFailure = (msg: string) => {
    console.error(`[FAIL] ${msg}`);
    failureCount++;
  };
  const recordSuccess = (msg: string) => {
    console.log(`[PASS] ${msg}`);
  };

  // -------------------------------------------------------------
  // TEST 1: Destination Route Validation for BlogContextualCta
  // -------------------------------------------------------------
  console.log('--- TEST 1: CTA Destination Route Validation ---');

  const ctaLinks = [
    { url: '/products/tax-clearance-certificate', type: 'product', slug: 'tax-clearance-certificate', expectedPrice: 350 },
    { url: '/products/individual-income-tax-return-itr12-simple', type: 'product', slug: 'individual-income-tax-return-itr12-simple', expectedPrice: 750 },
    { url: '/products/private-company-registration', type: 'product', slug: 'private-company-registration', expectedPrice: 950 },
    { url: '/products/tender-ready-company-registration-package', type: 'product', slug: 'tender-ready-company-registration-package', expectedPrice: 1600 },
    { url: '/products/ncr-registration', type: 'product', slug: 'ncr-registration', expectedPrice: 1400 },
    { url: '/company-registration', type: 'page', diskPath: 'src/app/company-registration/page.tsx' },
    { url: '/calculators/ncr-registration-fee', type: 'page', diskPath: 'src/app/calculators/ncr-registration-fee/page.tsx' },
  ];

  for (const item of ctaLinks) {
    if (item.type === 'page' && item.diskPath) {
      const fullPath = path.resolve(process.cwd(), item.diskPath);
      if (fs.existsSync(fullPath)) {
        recordSuccess(`Route ${item.url} exists on disk at ${item.diskPath}`);
      } else {
        recordFailure(`Route ${item.url} MISSING on disk at ${item.diskPath}`);
      }
    } else if (item.type === 'product' && item.slug) {
      // Query Firestore services collection to confirm the product slug exists
      const snap = await db.collection('services').where('slug', '==', item.slug).get();
      if (snap.empty) {
        recordFailure(`Product slug "${item.slug}" for route ${item.url} NOT FOUND in Firestore services collection!`);
      } else {
        const doc = snap.docs[0];
        const data = doc.data();
        const price = data.price;
        if (price !== item.expectedPrice) {
          recordFailure(`Product "${item.slug}" price mismatch! Expected R${item.expectedPrice}, found R${price}`);
        } else {
          recordSuccess(`Product route ${item.url} resolves to service "${data.title}" (R${price}, docId: ${doc.id})`);
        }
      }
    }
  }

  // Also check /sars-vat-vendor-search-verification CTA routes
  console.log('\n--- Additional Verification: SARS VAT Vendor Search CTAs ---');
  const vatPageLinks = [
    { url: '/products/vat201-vat-return-submission-filing', slug: 'vat201-vat-return-submission-filing', expectedPrice: 650 },
    { url: '/products/vat-registration', slug: 'vat-registration' },
    { url: '/contact', diskPath: 'src/app/contact/page.tsx' },
  ];

  for (const item of vatPageLinks) {
    if (item.diskPath) {
      const fullPath = path.resolve(process.cwd(), item.diskPath);
      if (fs.existsSync(fullPath)) {
        recordSuccess(`Route ${item.url} exists on disk at ${item.diskPath}`);
      } else {
        recordFailure(`Route ${item.url} MISSING on disk at ${item.diskPath}`);
      }
    } else if (item.slug) {
      const snap = await db.collection('services').where('slug', '==', item.slug).get();
      if (snap.empty) {
        recordFailure(`Product slug "${item.slug}" for route ${item.url} NOT FOUND in Firestore!`);
      } else {
        const doc = snap.docs[0];
        const data = doc.data();
        recordSuccess(`Product route ${item.url} resolves to service "${data.title}" (R${data.price})`);
      }
    }
  }

  // -------------------------------------------------------------
  // TEST 2: Firestore Top 5 Blog Posts Data Verification
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Firestore Top 5 Blog Posts Data Verification ---');

  const topSlugs = [
    { slug: 'find-your-south-african-tax-reference-number-quick-guide', expectedKeyProducts: ['Gep0mXM6phvt0Zsx5Rsa', '126urIq86Tq2m0R17qoZ'] },
    { slug: 'ncr-registration-your-key-to-sa-credit-compliance', expectedKeyProducts: ['eiVENszgiQaDcgYC6ZVc'] },
    { slug: 'start-a-business-in-sa-for-under-r500-your-guide', expectedKeyProducts: ['9TrFE99XEJOOeRAAeRae', 'Slc1x2GWdGu9rMne4J86'] },
    { slug: 'remission-of-sars-interest--penalties-your-guide', expectedKeyProducts: ['ZcTUdYjTqKGkF8IM3k4n'] },
    { slug: 'ncr-registration-your-essential-guide-in-south-africa', expectedKeyProducts: ['eiVENszgiQaDcgYC6ZVc'] },
  ];

  for (const t of topSlugs) {
    const snap = await db.collection('blogPosts').where('slug', '==', t.slug).get();
    if (snap.empty) {
      recordFailure(`Blog post not found in Firestore: ${t.slug}`);
      continue;
    }
    const doc = snap.docs[0];
    const post = doc.data();

    // 1. Check metaTitle length
    const rawTitle = post.metaTitle || post.title || '';
    const renderedTitle = rawTitle.endsWith(' | My Accountant') ? rawTitle : `${rawTitle} | My Accountant`;
    if (renderedTitle.length > 59) {
      recordFailure(`${t.slug}: Rendered title exceeds 59 chars ("${renderedTitle}", len: ${renderedTitle.length})`);
    } else {
      recordSuccess(`${t.slug}: Title is "${rawTitle}" (rendered: ${renderedTitle.length} chars <= 59)`);
    }

    // 2. Check metaDescription length (strictly 140 - 158)
    const desc = post.metaDescription || '';
    if (desc.length < 140 || desc.length > 158) {
      recordFailure(`${t.slug}: metaDescription len is ${desc.length} (must be 140-158): "${desc}"`);
    } else {
      recordSuccess(`${t.slug}: metaDescription length is ${desc.length} chars (valid 140-158)`);
    }

    // 3. Check relatedProducts
    if (!Array.isArray(post.relatedProducts) || post.relatedProducts.length === 0) {
      recordFailure(`${t.slug}: relatedProducts is empty or not an array`);
    } else {
      recordSuccess(`${t.slug}: has ${post.relatedProducts.length} relatedProducts: ${post.relatedProducts.join(', ')}`);
      // Verify every product ID exists in Firestore
      for (const pid of post.relatedProducts) {
        const sDoc = await db.collection('services').doc(pid).get();
        if (!sDoc.exists) {
          recordFailure(`${t.slug}: relatedProduct ID "${pid}" DOES NOT EXIST in services collection!`);
        } else {
          const sData = sDoc.data();
          if (!sData?.slug || sData?.price === undefined) {
            recordFailure(`${t.slug}: service ${pid} missing required fields (slug/price)!`);
          }
        }
      }

      // Check expected key products are present
      for (const expectedPid of t.expectedKeyProducts) {
        if (!post.relatedProducts.includes(expectedPid)) {
          recordFailure(`${t.slug}: expected key product ${expectedPid} is missing from relatedProducts!`);
        }
      }
    }

    // 4. Check Curated FAQs existence
    if (CURATED_BLOG_FAQS[t.slug]) {
      recordSuccess(`${t.slug}: has ${CURATED_BLOG_FAQS[t.slug].length} curated search-intent FAQs`);
    } else {
      recordFailure(`${t.slug}: missing entry in CURATED_BLOG_FAQS!`);
    }

    // 5. Check Contextual CTA detection
    if (t.slug !== 'remission-of-sars-interest--penalties-your-guide') {
      if (!hasContextualCta(t.slug)) {
        recordFailure(`${t.slug}: hasContextualCta returned false, expected true!`);
      } else {
        recordSuccess(`${t.slug}: hasContextualCta correctly returned true`);
      }
    }
  }

  // -------------------------------------------------------------
  // TEST 3: Sitewide Blog Posts Audit (All blog posts in Firestore)
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Sitewide Blog Posts Invariants Check ---');
  const allBlogSnap = await db.collection('blogPosts').get();
  recordSuccess(`Fetched total of ${allBlogSnap.size} blog posts from Firestore.`);

  let emptyRelatedCount = 0;
  let invalidServiceRefCount = 0;
  let missingSlugCount = 0;

  for (const doc of allBlogSnap.docs) {
    const post = doc.data();
    if (!post.slug) {
      recordFailure(`Blog post ${doc.id} is missing slug!`);
      missingSlugCount++;
    }
    if (!Array.isArray(post.relatedProducts) || post.relatedProducts.length === 0) {
      recordFailure(`Blog post ${doc.id} ("${post.slug}") has empty relatedProducts!`);
      emptyRelatedCount++;
    } else {
      for (const pid of post.relatedProducts) {
        if (typeof pid !== 'string' || pid.trim() === '') {
          recordFailure(`Blog post ${doc.id} has invalid product ID: ${pid}`);
          invalidServiceRefCount++;
        }
      }
    }
  }

  if (emptyRelatedCount === 0 && invalidServiceRefCount === 0 && missingSlugCount === 0) {
    recordSuccess(`All ${allBlogSnap.size} blog posts in Firestore satisfy integrity invariants!`);
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Failures: ${failureCount}`);
  if (failureCount > 0) {
    console.error(`Verification FAILED with ${failureCount} errors.`);
    process.exit(1);
  } else {
    console.log(`Verification PASSED 100%. All routes, products, and Firestore records valid.`);
    process.exit(0);
  }
}

verifyAll().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
