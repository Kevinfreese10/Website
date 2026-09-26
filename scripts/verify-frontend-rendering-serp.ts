/**
 * Empirical Challenger Verification Harness:
 * Frontend Rendering Compatibility & SERP Bounds for All 76 Blog Posts
 * 
 * Conducts exhaustive empirical testing across all 76 blog posts in Firestore:
 * 1. Exact query emulation of `getRelatedServices` for ALL 76 posts.
 * 2. Complete schema & runtime data contract verification for Rich Product Cards across all resolved services.
 * 3. Exact emulation of `generateMetadata` (rawTitle, suffix stripping, layout title template, og:title, twitter:title).
 * 4. Runtime simulation of all Next.js page components and utility functions in `src/app/blog/[slug]/page.tsx`.
 */

import { getAdminDb } from '../src/lib/firebase-admin';
import type { BlogPost, Service } from '../src/lib/types';
import { format } from 'date-fns';

const SITE_URL = 'https://myacc.co.za';
const GLOBAL_OG_IMAGE = `${SITE_URL}/images/og-default.jpg`;

// Formatting helper mirrored from src/app/blog/[slug]/page.tsx
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(price);
};

// Read time helper mirrored from src/app/blog/[slug]/page.tsx
const calculateReadTime = (content: string | undefined) => {
  if (!content) return 1;
  const words = content.replace(/<[^>]*>?/gm, '').split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
};

interface VerificationFailure {
  category: string;
  postId: string;
  slug: string;
  reason: string;
}

async function runAdversarialVerification() {
  console.log('========================================================================');
  console.log('    ADVERSARIAL VERIFICATION: FRONTEND RENDERING & SERP BOUNDS          ');
  console.log('========================================================================\n');

  const db = getAdminDb();
  const failures: VerificationFailure[] = [];

  console.log('Fetching live blogPosts and services collections...');
  const [blogSnap, servicesSnap] = await Promise.all([
    db.collection('blogPosts').get(),
    db.collection('services').get(),
  ]);

  const blogDocs = blogSnap.docs;
  const serviceDocs = servicesSnap.docs;
  const serviceMap = new Map<string, FirebaseFirestore.DocumentData>();
  for (const s of serviceDocs) {
    serviceMap.set(s.id, s.data());
  }

  console.log(`Live Data: ${blogDocs.length} blog posts, ${serviceDocs.length} services.\n`);

  if (blogDocs.length !== 76) {
    failures.push({
      category: 'Volume',
      postId: 'ALL',
      slug: 'ALL',
      reason: `Expected exactly 76 blog posts, found ${blogDocs.length}`,
    });
  }

  // --------------------------------------------------------------------------
  // TEST 1: Exhaustive getRelatedServices emulation for ALL 76 posts
  // --------------------------------------------------------------------------
  console.log('--- Test 1: Emulating getRelatedServices for ALL 76 posts ---');
  let totalResolvedProducts = 0;
  let postsWithValidResolution = 0;

  for (let i = 0; i < blogDocs.length; i++) {
    const postDoc = blogDocs[i];
    const post = postDoc.data() as Partial<BlogPost>;
    const slug = post.slug || postDoc.id;

    if (!Array.isArray(post.relatedProducts) || post.relatedProducts.length === 0) {
      failures.push({
        category: 'RelatedServices',
        postId: postDoc.id,
        slug,
        reason: 'relatedProducts is missing or empty array',
      });
      continue;
    }

    if (post.relatedProducts.length < 1 || post.relatedProducts.length > 3) {
      failures.push({
        category: 'RelatedServices',
        postId: postDoc.id,
        slug,
        reason: `relatedProducts length is ${post.relatedProducts.length} (expected 1 to 3)`,
      });
    }

    // Execute actual Firestore query exactly as in page.tsx
    try {
      const snap = await db.collection('services').where('__name__', 'in', post.relatedProducts).get();
      const resolvedServices = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));

      if (resolvedServices.length !== post.relatedProducts.length) {
        failures.push({
          category: 'RelatedServices',
          postId: postDoc.id,
          slug,
          reason: `Resolved count mismatch: queried ${post.relatedProducts.length} IDs (${post.relatedProducts.join(', ')}), but Firestore returned ${resolvedServices.length}`,
        });
      }

      // Check each resolved service satisfies Rich Product Card rendering contract
      for (const service of resolvedServices) {
        totalResolvedProducts++;

        // 1. Title
        if (!service.title || typeof service.title !== 'string' || service.title.trim().length === 0) {
          failures.push({
            category: 'ProductCardContract',
            postId: postDoc.id,
            slug,
            reason: `Service ${service.id} has missing or empty title`,
          });
        }

        // 2. Slug
        if (!service.slug || typeof service.slug !== 'string' || !/^[a-z0-9-]+$/.test(service.slug)) {
          failures.push({
            category: 'ProductCardContract',
            postId: postDoc.id,
            slug,
            reason: `Service ${service.id} has invalid slug: '${service.slug}'`,
          });
        }

        // 3. Category
        if (!service.category || typeof service.category !== 'string' || service.category.trim().length === 0) {
          failures.push({
            category: 'ProductCardContract',
            postId: postDoc.id,
            slug,
            reason: `Service ${service.id} has missing or empty category`,
          });
        }

        // 4. Turnaround Time
        if (!service.turnaroundTime || typeof service.turnaroundTime !== 'string' || service.turnaroundTime.trim().length === 0) {
          failures.push({
            category: 'ProductCardContract',
            postId: postDoc.id,
            slug,
            reason: `Service ${service.id} has missing or empty turnaroundTime`,
          });
        }

        // 5. Price & formatPrice compatibility
        if (service.price === undefined || typeof service.price !== 'number' || isNaN(service.price) || service.price < 0) {
          failures.push({
            category: 'ProductCardContract',
            postId: postDoc.id,
            slug,
            reason: `Service ${service.id} has invalid price: ${service.price} (type: ${typeof service.price})`,
          });
        } else {
          try {
            const formatted = formatPrice(service.price);
            if (!formatted || formatted.includes('NaN')) {
              failures.push({
                category: 'ProductCardContract',
                postId: postDoc.id,
                slug,
                reason: `formatPrice returned invalid string '${formatted}' for price ${service.price}`,
              });
            }
          } catch (err: any) {
            failures.push({
              category: 'ProductCardContract',
              postId: postDoc.id,
              slug,
              reason: `formatPrice threw exception for price ${service.price}: ${err.message}`,
            });
          }
        }

        // 6. whatsIncluded or description fallback
        if (Array.isArray(service.whatsIncluded)) {
          try {
            const items = service.whatsIncluded.slice(0, 3);
            for (const item of items) {
              if (typeof item !== 'string') {
                failures.push({
                  category: 'ProductCardContract',
                  postId: postDoc.id,
                  slug,
                  reason: `Service ${service.id} whatsIncluded contains non-string item: ${typeof item}`,
                });
              }
            }
          } catch (err: any) {
            failures.push({
              category: 'ProductCardContract',
              postId: postDoc.id,
              slug,
              reason: `Service ${service.id} whatsIncluded.slice threw exception: ${err.message}`,
            });
          }
        } else if (!service.description || typeof service.description !== 'string') {
          failures.push({
            category: 'ProductCardContract',
            postId: postDoc.id,
            slug,
            reason: `Service ${service.id} has neither valid whatsIncluded array nor description string`,
          });
        }
      }

      postsWithValidResolution++;
    } catch (err: any) {
      failures.push({
        category: 'RelatedServices',
        postId: postDoc.id,
        slug,
        reason: `Firestore query threw exception: ${err.message}`,
      });
    }
  }

  console.log(`Successfully verified getRelatedServices query on all ${postsWithValidResolution}/76 posts (${totalResolvedProducts} total service links checked).\n`);

  // --------------------------------------------------------------------------
  // TEST 2: Emulating generateMetadata for ALL 76 posts
  // --------------------------------------------------------------------------
  console.log('--- Test 2: Emulating generateMetadata for ALL 76 posts ---');
  let metaTitleViolations = 0;
  let metadataExceptions = 0;
  let rawTitlesOver59 = 0;
  let finalTitlesOver59 = 0;

  for (const postDoc of blogDocs) {
    const post = postDoc.data() as Partial<BlogPost>;
    const slug = post.slug || postDoc.id;

    // Emulate generateMetadata logic exactly:
    try {
      const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;
      const rawTitle = post.metaTitle || `${post.title} | My Accountant`;

      // Suffix stripping logic from page.tsx:
      const title = rawTitle.endsWith(' | My Accountant')
        ? rawTitle.slice(0, -' | My Accountant'.length)
        : rawTitle;

      const description = post.metaDescription || post.excerpt;

      let ogImage = post.seoImageUrl || post.imageUrl || GLOBAL_OG_IMAGE;
      if (ogImage.startsWith('/')) {
        ogImage = `${SITE_URL}${ogImage}`;
      }

      // 1. Check rawTitle and metaTitle length constraint (<= 59 chars)
      if (!post.metaTitle || typeof post.metaTitle !== 'string') {
        failures.push({
          category: 'Metadata',
          postId: postDoc.id,
          slug,
          reason: `Missing metaTitle in document`,
        });
      } else if (post.metaTitle.length > 59) {
        metaTitleViolations++;
        failures.push({
          category: 'Metadata',
          postId: postDoc.id,
          slug,
          reason: `metaTitle exceeds 59 chars (actual length: ${post.metaTitle.length}, value: "${post.metaTitle}")`,
        });
      }

      if (rawTitle.length > 59) {
        rawTitlesOver59++;
      }

      if (title.length > 59) {
        finalTitlesOver59++;
      }

      // Check stripped title is not empty
      if (!title || title.trim().length === 0) {
        failures.push({
          category: 'Metadata',
          postId: postDoc.id,
          slug,
          reason: `Stripped title resulted in empty string`,
        });
      }

      // Check openGraph and twitter structure
      const metadataResult = {
        title: title,
        description: description,
        alternates: {
          canonical: canonicalUrl,
        },
        openGraph: {
          title: rawTitle,
          description: description,
          url: canonicalUrl,
          siteName: 'My Accountant',
          locale: 'en_ZA',
          type: 'article',
          images: [{
            url: ogImage,
            width: 1200,
            height: 630,
            alt: post.seoImageLabel || post.title,
          }],
        },
        twitter: {
          card: 'summary_large_image',
          title: rawTitle,
          description: description,
          images: [ogImage],
        },
      };

      if (!metadataResult.title || !metadataResult.description) {
        failures.push({
          category: 'Metadata',
          postId: postDoc.id,
          slug,
          reason: `Metadata generated empty title or description`,
        });
      }
    } catch (err: any) {
      metadataExceptions++;
      failures.push({
        category: 'Metadata',
        postId: postDoc.id,
        slug,
        reason: `generateMetadata emulation threw exception: ${err.message}`,
      });
    }
  }

  console.log(`generateMetadata emulation completed.`);
  console.log(`- metaTitle > 59 chars: ${metaTitleViolations}`);
  console.log(`- rawTitle > 59 chars: ${rawTitlesOver59}`);
  console.log(`- final stripped title > 59 chars: ${finalTitlesOver59}`);
  console.log(`- metadata runtime exceptions: ${metadataExceptions}\n`);

  // --------------------------------------------------------------------------
  // TEST 3: Runtime Page Component Emulation (Date, schemas, headings, images)
  // --------------------------------------------------------------------------
  console.log('--- Test 3: Page Component Runtime Simulation for ALL 76 posts ---');
  let dateErrors = 0;
  let schemaErrors = 0;
  let readTimeErrors = 0;
  let titleSplitErrors = 0;
  let imageErrors = 0;

  for (const postDoc of blogDocs) {
    const post = postDoc.data() as Partial<BlogPost> & Record<string, any>;
    const slug = post.slug || postDoc.id;

    // 1. Date serialization and formatting:
    // page.tsx line 26: const date = docData.date?.toDate ? docData.date.toDate().toISOString() : docData.date;
    // page.tsx line 278: format(new Date(post.date), 'MMMM d, yyyy')
    try {
      const rawDate = (post as any).date;
      const dateString = rawDate?.toDate ? rawDate.toDate().toISOString() : rawDate;
      const parsedDate: Date = (post as any).date?.toDate ? (post as any).date.toDate() : new Date((post as any).date);
      if (isNaN(parsedDate.getTime())) {
        dateErrors++;
        failures.push({
          category: 'PageComponent',
          postId: postDoc.id,
          slug,
          reason: `Date '${dateString}' parsed to NaN`,
        });
      } else {
        const formattedDate = format(parsedDate, 'MMMM d, yyyy');
        if (!formattedDate || formattedDate.includes('Invalid')) {
          dateErrors++;
          failures.push({
            category: 'PageComponent',
            postId: postDoc.id,
            slug,
            reason: `format(new Date(post.date)) produced invalid string '${formattedDate}'`,
          });
        }
      }
    } catch (err: any) {
      dateErrors++;
      failures.push({
        category: 'PageComponent',
        postId: postDoc.id,
        slug,
        reason: `Date formatting threw exception: ${err.message}`,
      });
    }

    // 2. Read time calculation:
    try {
      const readTime = calculateReadTime(post.content);
      if (typeof readTime !== 'number' || isNaN(readTime) || readTime < 1) {
        readTimeErrors++;
        failures.push({
          category: 'PageComponent',
          postId: postDoc.id,
          slug,
          reason: `calculateReadTime returned invalid value: ${readTime}`,
        });
      }
    } catch (err: any) {
      readTimeErrors++;
      failures.push({
        category: 'PageComponent',
        postId: postDoc.id,
        slug,
        reason: `calculateReadTime threw exception: ${err.message}`,
      });
    }

    // 3. Title word split gradient logic:
    // page.tsx line 224: const titleWords = post.title.split(' ');
    try {
      if (!post.title || typeof post.title !== 'string') {
        titleSplitErrors++;
        failures.push({
          category: 'PageComponent',
          postId: postDoc.id,
          slug,
          reason: `Missing or invalid title for word splitting: ${typeof post.title}`,
        });
      } else {
        const titleWords = post.title.split(' ');
        let firstPart = post.title;
        let secondPart = '';
        if (titleWords.length > 1) {
          const splitIndex = Math.ceil(titleWords.length / 2);
          firstPart = titleWords.slice(0, splitIndex).join(' ');
          secondPart = titleWords.slice(splitIndex).join(' ');
        }
        if (!firstPart) {
          titleSplitErrors++;
          failures.push({
            category: 'PageComponent',
            postId: postDoc.id,
            slug,
            reason: `Title split resulted in empty firstPart`,
          });
        }
      }
    } catch (err: any) {
      titleSplitErrors++;
      failures.push({
        category: 'PageComponent',
        postId: postDoc.id,
        slug,
        reason: `Title splitting threw exception: ${err.message}`,
      });
    }

    // 4. Image URL validity:
    if (!post.imageUrl || typeof post.imageUrl !== 'string' || post.imageUrl.trim().length === 0) {
      imageErrors++;
      failures.push({
        category: 'PageComponent',
        postId: postDoc.id,
        slug,
        reason: `Missing or empty imageUrl (Next.js Image will throw)`,
      });
    }

    // 5. FAQ and Article Schema JSON serialization:
    try {
      const titleClean = (post.title || '').replace(/[?.!]/g, "");
      const postFaqs = [
        {
          q: `What is the key takeaway from "${titleClean}"?`,
          a: post.excerpt || `In this article, we explore the essential concepts of "${titleClean}" to help South African businesses and individuals make informed financial decisions.`
        },
        {
          q: `Who can benefit from the advice in "${titleClean}"?`,
          a: `SME owners, freelancers, and taxpayers in South Africa looking to optimize their compliance, reduce tax liability, and streamline their accounting workflows will find this guidance invaluable.`
        },
        {
          q: `How can My Accountant assist with "${titleClean}"?`,
          a: "Our team of qualified Chartered Business Accountants and Tax Practitioners offers complete, online accounting, bookkeeping, VAT submissions, and tax dispute support to keep your business compliant with SARS and CIPC."
        }
      ];

      const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": postFaqs.map(item => ({
          "@type": "Question",
          "name": item.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.a
          }
        }))
      };

      const articleSchema = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": `${SITE_URL}/blog/${post.slug}`
        },
        "headline": post.title,
        "description": post.metaDescription || post.excerpt,
        "image": [
          post.seoImageUrl || post.imageUrl || GLOBAL_OG_IMAGE
        ],
        "datePublished": post.date,
        "dateModified": post.date,
        "author": {
          "@type": "Person",
          "name": "Kevin Freese",
          "jobTitle": "Managing Director & Senior Accountant",
          "url": `${SITE_URL}`,
        },
        "publisher": {
          "@type": "Organization",
          "name": "My Accountant",
          "logo": {
            "@type": "ImageObject",
            "url": `${SITE_URL}/logo.png`
          }
        }
      };

      const faqJson = JSON.stringify(faqSchema);
      const articleJson = JSON.stringify(articleSchema);

      if (!faqJson || !articleJson) {
        schemaErrors++;
        failures.push({
          category: 'PageComponent',
          postId: postDoc.id,
          slug,
          reason: 'Schema JSON stringification failed',
        });
      }
    } catch (err: any) {
      schemaErrors++;
      failures.push({
        category: 'PageComponent',
        postId: postDoc.id,
        slug,
        reason: `Schema stringification threw exception: ${err.message}`,
      });
    }
  }

  console.log(`Page component simulation completed.`);
  console.log(`- Date formatting errors: ${dateErrors}`);
  console.log(`- Read time calculation errors: ${readTimeErrors}`);
  console.log(`- Title split errors: ${titleSplitErrors}`);
  console.log(`- Image URL errors: ${imageErrors}`);
  console.log(`- Schema serialization errors: ${schemaErrors}\n`);

  // --------------------------------------------------------------------------
  // SUMMARY REPORT & EXIT
  // --------------------------------------------------------------------------
  console.log('========================================================================');
  console.log('                       ADVERSARIAL VERDICT                              ');
  console.log('========================================================================');
  console.log(`Total Failures Detected: ${failures.length}`);

  if (failures.length > 0) {
    console.log('\nFAILURES BREAKDOWN:');
    for (const f of failures) {
      console.log(`  [${f.category}] Post: ${f.slug} (${f.postId}) -> ${f.reason}`);
    }
    console.log('\nVERDICT: REJECT\n');
    process.exit(1);
  } else {
    console.log('\nAll 76 blog posts successfully passed:');
    console.log('  1. getRelatedServices Firestore query emulation (100% resolution to 1-3 services)');
    console.log('  2. Rich Product Card data contract & currency formatting (R) without runtime exceptions');
    console.log('  3. generateMetadata emulation: metaTitle <= 59 chars & suffix stripping logic clean');
    console.log('  4. Full page SSR component runtime simulation (dates, schemas, readTime, title gradients)\n');
    console.log('VERDICT: APPROVE\n');
    process.exit(0);
  }
}

runAdversarialVerification().catch(err => {
  console.error('Fatal Harness Error:', err);
  process.exit(1);
});
