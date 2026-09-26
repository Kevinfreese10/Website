import { getAdminDb } from '../src/lib/firebase-admin';

async function main() {
  console.log('===============================================================');
  console.log('FORENSIC AUDITOR INDEPENDENT LIVE FIRESTORE VERIFICATION');
  console.log('===============================================================\n');

  const db = getAdminDb();

  // 1. Fetch live collections
  const [blogSnap, servicesSnap] = await Promise.all([
    db.collection('blogPosts').get(),
    db.collection('services').get(),
  ]);

  console.log(`[SNAPSHOT] Live Firestore 'blogPosts': ${blogSnap.size} documents`);
  console.log(`[SNAPSHOT] Live Firestore 'services': ${servicesSnap.size} documents\n`);

  const servicesMap = new Map<string, any>();
  servicesSnap.docs.forEach(d => servicesMap.set(d.id, d.data()));

  const blogDocs = blogSnap.docs;

  // 2. Define the 17 new statutory service IDs and required statutory markers
  const NEW_17_SPECS = [
    {
      id: '1psxEB0xnNBxTdSQqBKX',
      title: 'Liquor Licence Application Pack',
      expectedKeywords: ['liquor', 'licence', 'provincial', 'saps', 'dlo', 'zoning'],
      statutoryMarkers: ['National Liquor Act', 'Liquor Act', 'Section 23', 'DLO', 'R638'],
    },
    {
      id: '7dqLkWHEFlSBp3jGqC4y',
      title: 'Star Grading Application (TGCSA)',
      expectedKeywords: ['tgcsa', 'star grading', 'hotel', 'guesthouse', 'tourism'],
      statutoryMarkers: ['Tourism Act', 'Tourism Grading Council', 'TGCSA', 'Tourism Grading Support Programme'],
    },
    {
      id: '9nJ0181N9khfqA4kJ6aW',
      title: 'Solar SSEG Grid-Tie Registration',
      expectedKeywords: ['sseg', 'solar', 'grid-tie', 'inverter', 'nrs 097'],
      statutoryMarkers: ['NRS 097', 'SANS 10142', 'Certificate of Compliance', 'CoC', 'embedded generation'],
    },
    {
      id: 'AvQ2zcK4ttioFdUKBFBY',
      title: 'Customs Certificate of Origin (SADC / EUR.1)',
      expectedKeywords: ['customs', 'certificate of origin', 'sadc', 'eur.1', 'sars', 'export'],
      statutoryMarkers: ['Customs and Excise Act', 'SADC', 'EUR.1', 'SARS Customs', 'AfCFTA'],
    },
    {
      id: 'Bg52FQ7DkwV4T15s1ciU',
      title: 'Tourist Guide Registration (CATHSSETA)',
      expectedKeywords: ['tourist guide', 'cathsseta', 'first aid', 'tourism'],
      statutoryMarkers: ['Tourism Act', 'CATHSSETA', 'Provincial Registrar', 'First Aid Level 1'],
    },
    {
      id: 'RSDrRTb03aOVnbiqTGZp',
      title: 'Traffic Register Number (TRN)',
      expectedKeywords: ['traffic register number', 'trn', 'natis', 'foreign', 'vehicle'],
      statutoryMarkers: ['National Road Traffic Act', 'NaTIS', 'TRN', 'Form ANR'],
    },
    {
      id: 'VhneqtozDCh1q0DisPCx',
      title: 'Firearm Application Pack (SAPS 517 / 271)',
      expectedKeywords: ['firearm', 'saps 271', 'competency', 'saps 517', 'cfr'],
      statutoryMarkers: ['Firearms Control Act 60 of 2000', 'SAPS 517', 'SAPS 271', 'Competency Certificate'],
    },
    {
      id: 'a2AucSEmHauw0AzLqsu4',
      title: 'Electrical Contractor Registration (DoEL)',
      expectedKeywords: ['electrical contractor', 'doel', 'wireman', 'department of employment and labour'],
      statutoryMarkers: ['Electrical Installation Regulations', 'Occupational Health and Safety Act', 'DoEL', 'Installation Electrician'],
    },
    {
      id: 'bZtr4yojIc4OiS0q0ueI',
      title: 'Business Plan for Funding (Bank, SEFA, NYDA)',
      expectedKeywords: ['business plan', 'funding', 'sefa', 'nyda', 'cash flow'],
      statutoryMarkers: ['SEFA', 'NYDA', 'NEF', 'cash flow forecast', 'break-even'],
    },
    {
      id: 'fkV9BYmOO39t2NrHxVjq',
      title: 'Food Business Certificate of Acceptability (CoA)',
      expectedKeywords: ['certificate of acceptability', 'coa', 'food business', 'r638', 'health'],
      statutoryMarkers: ['Regulation R638', 'Foodstuffs, Cosmetics and Disinfectants Act', 'Environmental Health Practitioner', 'EHP'],
    },
    {
      id: 'gALWR2cHqUqsTVrUvvdJ',
      title: 'Transport Operating Licence Application (Form 1B)',
      expectedKeywords: ['transport operating licence', 'form 1b', 'nputr', 'pre', 'charter'],
      statutoryMarkers: ['National Land Transport Act 5 of 2009', 'Form 1B', 'Provincial Regulatory Entity', 'PRE'],
    },
    {
      id: 'p9Yfq2kPWwJMnrFfO3rS',
      title: 'Property Practitioners (PPRA) Firm Registration',
      expectedKeywords: ['ppra', 'property practitioners', 'fidelity fund', 'ffc', 'trust account'],
      statutoryMarkers: ['Property Practitioners Act 22 of 2019', 'Fidelity Fund Certificate', 'FFC', 'trust account audit'],
    },
    {
      id: 'zczVkNDGSQKmbKstNTX4',
      title: 'Cross-Border Road Transport Permit (C-BRTA)',
      expectedKeywords: ['cross-border', 'c-brta', 'permit', 'freight', 'sadc'],
      statutoryMarkers: ['Cross-Border Road Transport Act 4 of 1998', 'C-BRTA', 'consignment note'],
    },
    {
      id: '53OMqVsNmlF7OJiuusya',
      title: 'POPIA Compliance & Governance Pack',
      expectedKeywords: ['popia', 'compliance', 'governance', 'personal information', 'data protection'],
      statutoryMarkers: ['Protection of Personal Information Act 4 of 2013', 'Information Regulator', '8 lawful conditions', 'Section 19'],
    },
    {
      id: 'JAQOhiAxWKO8hk8Oh9l8',
      title: 'PAIA Annual Report Submission',
      expectedKeywords: ['paia', 'annual report', 'information regulator', 'access to information'],
      statutoryMarkers: ['Promotion of Access to Information Act 2 of 2000', 'Section 32', 'Section 83', 'Information Regulator'],
    },
    {
      id: 'SGBQ4SlgRn1shWlT6wBq',
      title: 'CSOS Scheme Support & Annual Return',
      expectedKeywords: ['csos', 'sectional title', 'annual return', 'body corporate', 'levy'],
      statutoryMarkers: ['Community Schemes Ombud Service Act 9 of 2011', 'Sectional Titles Schemes Management Act', 'Form CS1', 'CSOS levy'],
    },
    {
      id: 'asLG9ywV9f8x2eYaPTPC',
      title: 'POPIA Information Officer Registration',
      expectedKeywords: ['information officer', 'popia', 'registration', 'deputy information officer'],
      statutoryMarkers: ['Information Regulator', 'Guidance Note on Information Officers', 'Section 55', 'eServices portal'],
    },
  ];

  console.log('--- CHECK 1: Static and Database Forensic Audit of 17 New Posts ---');
  let newPostsFoundCount = 0;
  const newPostAudits: any[] = [];

  for (const spec of NEW_17_SPECS) {
    // Locate the post
    const doc = blogDocs.find(d => {
      const data = d.data();
      return (
        d.id === spec.id ||
        data.id === spec.id ||
        (Array.isArray(data.relatedProducts) && data.relatedProducts[0] === spec.id)
      );
    });

    if (!doc) {
      console.error(`[FAIL] Missing document in Firestore for statutory service ${spec.id} (${spec.title})`);
      continue;
    }

    newPostsFoundCount++;
    const d = doc.data();

    // Check content depth
    const content = d.content || '';
    const wordCount = content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    const charCount = content.length;

    // Check for dummy text
    const lowerContent = content.toLowerCase();
    const hasLorem = lowerContent.includes('lorem ipsum') || lowerContent.includes('placeholder') || lowerContent.includes('todo');

    // Check statutory citations
    const foundMarkers = spec.statutoryMarkers.filter(m => content.toLowerCase().includes(m.toLowerCase()));

    // Check FAQ
    const hasFaq = /faq|frequently\s+asked\s+questions/i.test(content) && content.includes('<h3');

    // Schema audits
    const authorOk = d.author === 'Kevin Freese';
    const metaTitleLen = (d.metaTitle || '').length;
    const metaTitleOk = metaTitleLen > 0 && metaTitleLen <= 59;
    const metaDescLen = (d.metaDescription || '').length;
    const metaDescOk = metaDescLen >= 140 && metaDescLen <= 158;
    const metaKeywordsCount = Array.isArray(d.metaKeywords) ? d.metaKeywords.length : 0;
    const metaKeywordsOk = metaKeywordsCount >= 5 && metaKeywordsCount <= 8;
    const relatedProducts = d.relatedProducts || [];
    const relatedOk = Array.isArray(relatedProducts) && relatedProducts[0] === spec.id && relatedProducts.length >= 2 && relatedProducts.length <= 3;
    const relatedExist = relatedProducts.every((rId: string) => servicesMap.has(rId));
    const searchIntentOk = d.searchIntent === 'Informational' || d.searchIntent === 'Commercial';

    const auditPass = (
      wordCount >= 700 &&
      !hasLorem &&
      foundMarkers.length >= 2 &&
      hasFaq &&
      authorOk &&
      metaTitleOk &&
      metaDescOk &&
      metaKeywordsOk &&
      relatedOk &&
      relatedExist &&
      searchIntentOk
    );

    newPostAudits.push({
      id: doc.id,
      slug: d.slug,
      title: d.title,
      wordCount,
      charCount,
      hasLorem,
      foundMarkers: `${foundMarkers.length}/${spec.statutoryMarkers.length} (${foundMarkers.join(', ')})`,
      hasFaq,
      author: d.author,
      metaTitleLen,
      metaDescLen,
      metaKeywordsCount,
      relatedProducts,
      auditPass,
    });
  }

  console.table(newPostAudits.map(a => ({
    slug: a.slug.slice(0, 30),
    words: a.wordCount,
    hasLorem: a.hasLorem,
    markers: a.foundMarkers.slice(0, 25),
    metaTitle: a.metaTitleLen,
    metaDesc: a.metaDescLen,
    keywords: a.metaKeywordsCount,
    related: a.relatedProducts.length,
    PASS: a.auditPass,
  })));

  const all17Passed = newPostAudits.length === 17 && newPostAudits.every(a => a.auditPass);
  console.log(`\nNew 17 Posts Comprehensive Verification: ${all17Passed ? 'ALL 17 PASS' : 'FAILURES DETECTED'}\n`);

  // 3. Audit all 59 existing posts
  console.log('--- CHECK 2: Audit of 59 Existing Posts & Corrections ---');
  const existingPostDocs = blogDocs.filter(d => !NEW_17_SPECS.some(s => s.id === d.id || d.data().slug?.includes(s.title.toLowerCase().slice(0, 8))));
  console.log(`Existing posts count: ${existingPostDocs.length}`);

  let existingEmptyRelated = 0;
  let existingInvalidServiceIds: string[] = [];
  let existingOverlongMeta = 0;

  for (const doc of existingPostDocs) {
    const data = doc.data();
    const rp = data.relatedProducts;
    const mt = data.metaTitle || '';

    if (!Array.isArray(rp) || rp.length === 0) {
      existingEmptyRelated++;
    } else {
      for (const sId of rp) {
        if (!servicesMap.has(sId)) {
          existingInvalidServiceIds.push(`${doc.id} -> ${sId}`);
        }
      }
    }

    if (mt.length > 59) {
      existingOverlongMeta++;
    }
  }

  console.log(`Existing posts with empty relatedProducts: ${existingEmptyRelated} (target: 0)`);
  console.log(`Existing posts with invalid service IDs: ${existingInvalidServiceIds.length} (target: 0)`);
  console.log(`Existing posts with metaTitle > 59: ${existingOverlongMeta} (target: 0)\n`);

  // 4. Corrupted posts check
  console.log('--- CHECK 3: Corrupted Posts Target Verification ---');
  const nkbDoc = blogDocs.find(d => d.id === 'NKb57k6Z1dJLAGwx5cvA');
  const wgujDoc = blogDocs.find(d => d.id === 'wgujQUMOFd1gVxp23v4V');

  console.log('NKb57k6Z1dJLAGwx5cvA relatedProducts:', nkbDoc?.data().relatedProducts);
  console.log('wgujQUMOFd1gVxp23v4V relatedProducts:', wgujDoc?.data().relatedProducts);

  const nkbClean = nkbDoc?.data().relatedProducts?.every((id: string) => servicesMap.has(id));
  const wgujClean = wgujDoc?.data().relatedProducts?.every((id: string) => servicesMap.has(id));
  console.log(`NKb clean: ${nkbClean}, wguj clean: ${wgujClean}\n`);

  // 5. Total 76 Posts Final Invariants
  console.log('--- CHECK 4: Global Invariants Across All 76 Posts ---');
  let globalEmptyRelated = 0;
  let globalInvalidServices = 0;
  let globalOverlongMeta = 0;

  for (const doc of blogDocs) {
    const data = doc.data();
    const rp = data.relatedProducts;
    const mt = data.metaTitle || '';

    if (!Array.isArray(rp) || rp.length === 0) globalEmptyRelated++;
    else {
      for (const sId of rp) {
        if (!servicesMap.has(sId)) globalInvalidServices++;
      }
    }

    if (!mt || mt.length > 59) globalOverlongMeta++;
  }

  console.log(`Total Blog Posts: ${blogDocs.length} (target: 76)`);
  console.log(`Global Empty relatedProducts: ${globalEmptyRelated} (target: 0)`);
  console.log(`Global Invalid Service References: ${globalInvalidServices} (target: 0)`);
  console.log(`Global metaTitle > 59 chars: ${globalOverlongMeta} (target: 0)`);

  if (
    blogDocs.length === 76 &&
    all17Passed &&
    existingEmptyRelated === 0 &&
    existingInvalidServiceIds.length === 0 &&
    existingOverlongMeta === 0 &&
    globalEmptyRelated === 0 &&
    globalInvalidServices === 0 &&
    globalOverlongMeta === 0
  ) {
    console.log('\n===============================================================');
    console.log('VERDICT: CLEAN - ALL INTEGRITY AND FORENSIC CHECKS PASSED');
    console.log('===============================================================');
    process.exit(0);
  } else {
    console.log('\n===============================================================');
    console.log('VERDICT: INTEGRITY VIOLATION DETECTED');
    console.log('===============================================================');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
