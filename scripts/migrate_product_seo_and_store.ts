import { getAdminDb } from '../src/lib/firebase-admin';

// Mapping of short descriptions to comprehensive, high-ranking descriptions
const EXPANDED_DESCRIPTIONS: Record<string, string> = {
  "NCR Form 39 Annual Compliance Submission": "Submit your NCR Form 39 annual compliance report seamlessly in South Africa. Our registered accountants prepare and file all statutory credit bureau returns.",
  "CIDB Annual Renewal": "Maintain your active CIDB grading and public sector tender eligibility in South Africa with hassle-free annual renewal and compliance filings.",
  "VAT201 Return Submission (Nil)": "Ensure 100% SARS compliance by submitting your VAT201 Nil Return on time. Avoid administrative penalties and preserve your valid Tax Clearance PIN.",
  "Individual Income Tax Return ITR12 (Complex)": "File your complex South African ITR12 tax return with registered SARS tax practitioners. Expert deductions for capital gains, local investments, and rental property.",
  "Import Licence": "Obtain your official SARS Customs Import Licence and Customs Code quickly. Fast-track international trade and import operations for your South African business.",
  "PAYE Registration": "Register your South African business for SARS PAYE, SDL, and UIF seamlessly. Get your employer tax reference number issued quickly by registered practitioners.",
  "Personal Liability Company Registration": "Incorporate a Personal Liability Company (Inc.) with CIPC for legal and medical practices. Includes MoI, share certificates, and tax clearance registration.",
  "CIPC Company Deregistration": "Officially deregister your dormant or inactive company with CIPC and SARS. Eliminate ongoing annual return liabilities and statutory administrative burdens.",
  "NCR Form 40 Application & Compliance": "Complete your statutory NCR Form 40 quarterly compliance reporting in South Africa accurately with our expert credit regulatory compliance team.",
  "Remission of SARS Interest and Penalties": "Apply for a SARS Request for Remission (RFR01) to reduce or waive administrative penalties and interest on outstanding returns. Expert dispute assistance.",
  "Annual Financial Statements (Draft & Sign Off)": "Audit-ready Annual Financial Statements compiled in strict compliance with IFRS for SMEs and Companies Act, signed off by a certified accounting officer.",
  "Tax Directive Application": "Apply for a formal SARS Tax Directive to ensure accurate, optimized income tax deductions on lump sums, severance packages, or pension withdrawals in SA.",
  "Clearing Agent Licence": "Apply for an accredited SARS Customs Clearing Agent Licence in South Africa. We guide you through bonding requirements, licensing, and compliance.",
  "CIDB Upgrades (Grades 2-9)": "Upgrade your CIDB contractor grading from Grade 2 to Grade 9 in South Africa. We compile audited financial statements, track record proofs, and compliance docs.",
  "Management Accounts": "Make data-driven business decisions with monthly or quarterly management accounts, cash flow forecasting, and executive financial performance analysis.",
  "Company Income Tax Return ITR14 (Nil)": "File your dormant or non-trading South African company ITR14 Nil tax return effortlessly to maintain active SARS compliance and protect your Tax PIN."
};

// Title overrides to keep titles strictly under 60 chars
const TITLE_OVERRIDES: Record<string, string> = {
  "Registered Office Address (12-Month Retainer)": "Registered Office Address (12-Mo Retainer)",
  "Annual Financial Statements (Draft & Sign Off)": "Annual Financial Statements (Draft & Sign)",
  "Provisional Tax Return (IRP6) for Trading Entities": "Provisional Tax Return (IRP6) for Entities",
  "Food Business Certificate of Acceptability (CoA)": "Food Certificate of Acceptability (CoA)",
  "Transport Operating Licence Application (Form 1B)": "Transport Operating Licence (Form 1B)",
  "Property Practitioners (PPRA) Firm Registration": "Property Practitioners (PPRA) Registration",
  "Annual Financial Statements (Non-VAT Registered)": "Annual Financial Statements (Non-VAT)",
  "Employer Annual Reconciliation EMP501 (Trading)": "Employer Reconciliation EMP501 (Trading)",
};

async function main() {
  const db = getAdminDb();

  // 1. Update staticSeo/products (Store Page)
  console.log('1. Updating staticSeo/products...');
  await db.collection('staticSeo').doc('products').set({
    metaTitle: 'Online Accounting, Tax & CIPC Compliance Services | My Accountant',
    metaDescription: 'Browse our complete catalog of South African accounting, tax clearance, VAT, payroll, CIPC company registration, and compliance services at transparent fixed fees.',
    metaKeywords: [
      'online accounting services South Africa',
      'CIPC company registration online',
      'SARS tax compliance services',
      'monthly bookkeeping services',
      'VAT registration and returns',
      'business compliance packages'
    ],
    path: '/products',
    updatedAt: new Date().toISOString()
  }, { merge: true });
  console.log('Successfully updated staticSeo/products!');

  // 2. Scan and update all services in Firestore
  console.log('2. Updating services metaTitle and metaDescription in Firestore...');
  const snap = await db.collection('services').get();
  let updatedCount = 0;
  const batchSize = 25;
  let batch = db.batch();
  let opsInBatch = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const title = data.title || '';
    const currentMetaTitle = data.metaTitle || '';
    const currentMetaDesc = (data.metaDescription || '').trim();

    const isOldFormat = /\|\s*R\d+/i.test(currentMetaTitle) || currentMetaTitle.endsWith(' | 1-2 Days') || currentMetaTitle.endsWith(' | 1 Days');
    const isMissingBrand = !currentMetaTitle.includes('My Accountant');
    
    let needsUpdate = false;
    const updatePayload: Record<string, any> = {};

    if (isOldFormat || isMissingBrand || currentMetaTitle === title) {
      const cleanBaseTitle = TITLE_OVERRIDES[title] || title;
      updatePayload.metaTitle = `${cleanBaseTitle} | My Accountant`;
      needsUpdate = true;
    }

    if (EXPANDED_DESCRIPTIONS[title]) {
      updatePayload.metaDescription = EXPANDED_DESCRIPTIONS[title];
      needsUpdate = true;
    } else if (!currentMetaDesc || currentMetaDesc.length < 50) {
      updatePayload.metaDescription = `${title} services in South Africa by My Accountant. Fixed pricing, fast turnaround, and fully compliant SARS & CIPC filing.`;
      needsUpdate = true;
    }

    if (needsUpdate) {
      batch.update(doc.ref, updatePayload);
      opsInBatch++;
      updatedCount++;

      if (opsInBatch >= batchSize) {
        await batch.commit();
        console.log(`Committed batch of ${opsInBatch} service updates...`);
        batch = db.batch();
        opsInBatch = 0;
      }
    }
  }

  if (opsInBatch > 0) {
    await batch.commit();
    console.log(`Committed final batch of ${opsInBatch} service updates.`);
  }

  console.log(`Migration complete! Updated ${updatedCount} / ${snap.size} services.`);
}

main().catch(console.error);
