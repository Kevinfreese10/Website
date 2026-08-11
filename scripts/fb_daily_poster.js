/**
 * Daily Facebook Automated Posting Script for My Accountant
 * Page ID: 109703190755392
 * Verified Product URLs directly from Firestore database
 */

const PAGE_ID = '109703190755392';
const PAGE_ACCESS_TOKEN = 'EAAN7eXkCHz8BSLSHNHNCYkDGeZBrZCamcuKTChNuIZCQC3LfsBrl6CRbYv2qlCfVh2C1ow18tSxngplXFcUu3BDYlRZBfOsLrd2NcMw0mhadMSEo8tgWrpBZCfVrAb9VCTjADTPtAEmfMfp1v3iz6UZCkVKXkgFIJmBtoR9o5XeSy1eKb2wVrZClkZBen4jiFFt6sbNGbcvKMcCD8TH8Emmrmo9478iLoX0tHEu9lo9B';

const servicePosts = [
  {
    title: 'Individual Income Tax Return (ITR12 Simple)',
    link: 'https://www.myacc.co.za/products/individual-income-tax-return-itr12-simple',
    message: `📊 Need to sort out your annual SARS tax return stress-free?

Get your Individual Income Tax Return (ITR12) filed professionally with SARS eFiling by certified tax practitioners! Maximize your eligible deductions while staying 100% compliant.

✅ Complete review of tax-deductible expenses (medical, retirement, home office)
✅ Preparation & direct submission of your annual ITR12 via SARS eFiling
✅ Audit support & SARS query management included

💰 PRICE: R750 | ⏱️ TURNAROUND: 5-7 working days

👉 Get started online today: https://www.myacc.co.za/products/individual-income-tax-return-itr12-simple

#MyAccountant #SARSTax #ITR12 #TaxReturns #SouthAfrica #TaxPractitioner`
  },
  {
    title: 'Private Company Registration (Pty Ltd)',
    link: 'https://www.myacc.co.za/products/private-company-registration',
    message: `🚀 Registering a new business in South Africa?

Get your official CIPC Private Company Registration (Pty Ltd) sorted fast, hassle-free, and 100% compliant with My Accountant.

✅ CIPC Company Name Reservation & COR 14.3 Certificate
✅ Automatic SARS Income Tax Number Registration
✅ Standard Memorandum of Incorporation (MOI) included

💰 PRICE: R950 | ⏱️ TURNAROUND: 3-5 working days

👉 Register your company online today: https://www.myacc.co.za/products/private-company-registration

#MyAccountant #CompanyRegistration #PtyLtd #CIPC #SouthAfricaBusiness #StartupSA`
  },
  {
    title: 'Management Accounts & Bookkeeping',
    link: 'https://www.myacc.co.za/products/management-accounts',
    message: `📈 Keep your business books 100% SARS compliant and ready for growth!

Our Management Accounts and Bookkeeping Services give South African SMEs full financial clarity with professional accounting management.

✅ Processing of monthly ledger transactions
✅ Bank & credit card reconciliations
✅ Monthly Management Accounts (Income Statement & Balance Sheet) & VAT201 support

💰 PRICE: R1,500/month | ⏱️ TURNAROUND: Ongoing monthly service

👉 Manage your finances online: https://www.myacc.co.za/products/management-accounts

#MyAccountant #Bookkeeping #SmallBusinessSA #AccountingServices #SARS #SME`
  }
];

async function publishDailyPosts() {
  console.log(`[${new Date().toISOString()}] Starting daily Facebook posts for My Accountant...`);
  
  for (let i = 0; i < servicePosts.length; i++) {
    const post = servicePosts[i];
    console.log(`Publishing Post #${i + 1}: ${post.title}...`);

    const url = `https://graph.facebook.com/v19.0/${PAGE_ID}/feed`;
    const params = new URLSearchParams();
    params.append('message', post.message);
    params.append('link', post.link);
    params.append('access_token', PAGE_ACCESS_TOKEN);

    try {
      const res = await fetch(url, { method: 'POST', body: params });
      const data = await res.json();
      if (res.ok && data.id) {
        console.log(`✅ Post #${i + 1} published successfully! Post ID: ${data.id}`);
      } else {
        console.error(`❌ Post #${i + 1} failed:`, JSON.stringify(data));
      }
    } catch (err) {
      console.error(`❌ Exception during Post #${i + 1}:`, err);
    }
  }
}

// If executed directly, run the posting function
publishDailyPosts();
