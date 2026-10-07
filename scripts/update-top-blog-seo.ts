import { getAdminDb } from '../src/lib/firebase-admin';

interface TargetUpdate {
  slug: string;
  docId: string;
  metaTitle: string;
  metaDescription: string;
  relatedProducts: string[];
}

const TARGETS: TargetUpdate[] = [
  {
    slug: 'find-your-south-african-tax-reference-number-quick-guide',
    docId: 'yvHjOj1gwpiaMZMp8oXA',
    metaTitle: 'SARS Tax Number: How to Find It Online',
    metaDescription:
      'Find your SARS tax number online in minutes. Step-by-step guide to retrieve your 10-digit South African tax reference number via eFiling, SMS, or WhatsApp.',
    relatedProducts: [
      'Gep0mXM6phvt0Zsx5Rsa', // Tax Clearance Certificate (R350)
      '126urIq86Tq2m0R17qoZ', // Individual Income Tax Return ITR12 (Simple) (R750)
      '2HG85hwbhbDsDQsjQE6y', // Tax Representative Appointment (R950)
    ],
  },
  {
    slug: 'ncr-registration-your-key-to-sa-credit-compliance',
    docId: 'F9SeptzT3MmBe07KxAxW',
    metaTitle: 'NCR Registration: 2026 Requirements & Fees',
    metaDescription:
      'Guide to NCR registration for South African credit providers. Check 2026 registration fees, Form 2 requirements, and calculate total compliance costs.',
    relatedProducts: [
      'eiVENszgiQaDcgYC6ZVc', // NCR Registration (R1400)
      '1ZjjFMvNxHe9yprrzgRV', // NCR Form 39 Annual Compliance Submission (R1800)
      'VUznJOHCTORCAUx5Epqe', // NCR Form 40 Application & Compliance (R1950)
    ],
  },
  {
    slug: 'start-a-business-in-sa-for-under-r500-your-guide',
    docId: 'FrIAqhdRw5H3F6L1zA4H',
    metaTitle: 'Start a Business in SA Under R500 (2026)',
    metaDescription:
      'Top business ideas you can start in South Africa for under R500. Practical step-by-step startup costs, low-capital ideas, and CIPC company registration.',
    relatedProducts: [
      '9TrFE99XEJOOeRAAeRae', // Private Company Registration (R950)
      'Slc1x2GWdGu9rMne4J86', // Tender Ready Company Registration Package (R1,600)
    ],
  },
  {
    slug: 'remission-of-sars-interest--penalties-your-guide',
    docId: 'ThgZcHahkTDTPlhNvHYy',
    metaTitle: 'SARS Penalty & Interest Remission (2026)',
    metaDescription:
      'Apply for SARS penalty and interest remission under Section 217/218 of the TAA. Step-by-step RFR01 eFiling dispute guide to reduce or waive tax penalties.',
    relatedProducts: [
      'ZcTUdYjTqKGkF8IM3k4n', // Remission of SARS Interest and Penalties (R1,200)
    ],
  },
  {
    slug: 'ncr-registration-your-essential-guide-in-south-africa',
    docId: 'BmXeaVKj7HlX0hHeis3x',
    metaTitle: 'NCR Registration SA: 2026 Process & Forms',
    metaDescription:
      'Essential guide to NCR registration in South Africa. Step-by-step Form 2 instructions, statutory requirements, fees, and credit provider compliance tips.',
    relatedProducts: [
      'eiVENszgiQaDcgYC6ZVc', // NCR Registration (R1,400)
      '1ZjjFMvNxHe9yprrzgRV', // NCR Form 39 Annual Compliance Submission (R1,800)
      'VUznJOHCTORCAUx5Epqe', // NCR Form 40 Application & Compliance (R1,950)
    ],
  },
];

async function main() {
  const db = getAdminDb();
  console.log('Validating services in target relatedProducts...');

  const allProductIds = new Set<string>();
  for (const t of TARGETS) {
    for (const p of t.relatedProducts) {
      allProductIds.add(p);
    }
  }

  for (const pid of allProductIds) {
    const sDoc = await db.collection('services').doc(pid).get();
    if (!sDoc.exists) {
      throw new Error(`Service ID not found: ${pid}`);
    }
    const data = sDoc.data();
    console.log(`  ✓ Service found: ${pid} -> ${data?.title || data?.name} (R${data?.price})`);
  }

  console.log('\nUpdating target blog posts in Firestore...');
  for (const t of TARGETS) {
    // Validate character lengths
    const renderedTitle = `${t.metaTitle} | My Accountant`;
    if (renderedTitle.length > 59) {
      throw new Error(`Rendered title exceeds 59 chars: "${renderedTitle}" (${renderedTitle.length} chars)`);
    }
    if (t.metaDescription.length < 140 || t.metaDescription.length > 158) {
      throw new Error(`Meta description length invalid: "${t.metaDescription}" (${t.metaDescription.length} chars)`);
    }

    const docRef = db.collection('blogPosts').doc(t.docId);
    const existing = await docRef.get();
    if (!existing.exists) {
      // Try searching by slug
      const qSnap = await db.collection('blogPosts').where('slug', '==', t.slug).get();
      if (qSnap.empty) {
        throw new Error(`Blog post not found by docId ${t.docId} or slug ${t.slug}`);
      }
      const actualDoc = qSnap.docs[0];
      console.log(`  Found post by slug: ${t.slug} (Doc ID: ${actualDoc.id})`);
      await actualDoc.ref.update({
        metaTitle: t.metaTitle,
        metaDescription: t.metaDescription,
        relatedProducts: t.relatedProducts,
      });
    } else {
      console.log(`  Updating doc ${t.docId} (${t.slug})`);
      await docRef.update({
        metaTitle: t.metaTitle,
        metaDescription: t.metaDescription,
        relatedProducts: t.relatedProducts,
      });
    }
    console.log(`  ✓ Updated ${t.slug}:`);
    console.log(`    metaTitle: "${t.metaTitle}" (rendered: "${renderedTitle}", ${renderedTitle.length} chars)`);
    console.log(`    metaDescription: "${t.metaDescription}" (${t.metaDescription.length} chars)`);
    console.log(`    relatedProducts: ${JSON.stringify(t.relatedProducts)}`);
  }

  console.log('\nAll 5 target blog posts successfully updated in Firestore!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
