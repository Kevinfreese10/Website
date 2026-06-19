const slugs = [
  "sole-proprietor-income-tax-return-itr12",
  "external-company-registration",
  "coida-registration",
  "annual-financial-statements-draft-and-sign-off-only",
  "ncr-form-39-annual-compliance-submission",
  "irp6-provisional-tax-return-filing-for-trading-entities",
  "income-tax-return-for-sole-proprietors-itr12",
  "complex-individual-income-tax-return-itr12",
  "paye-registration",
  "csd-profile-updates",
  "company-reinstatement",
  "cipc-company-deregistration",
  "bei-setup--demonstration",
  "cidb-upgrades-grades-2-9",
  "annual-returns",
  "individual-income-tax-return-itr12-simple",
  "ncr-form-40-application--compliance",
  "company-name-change",
  "tax-representative-appointment",
  "import-licence",
  "tax-directive-application",
  "csd-registration",
  "private-company-registration",
  "ncca-registration-services",
  "remission-of-sars-interest-and-penalties",
  "non-profit-company-registration",
  "cipc-annual-fees",
  "remove-director",
  "complex-individual-income-tax-return-itr12-filing",
  "irp6-provisional-tax-return-nil",
  "company-address-change",
  "itr14-company-income-tax-return-nil",
  "uif-registration",
  "vat-registration",
  "vat201-return-submission-nil",
  "emp501-annual-reconciliation-for-trading-companies",
  "nbc-provident-fund-company-registration",
  "tax-clearance-pin",
  "accountants-letter",
  "beneficial-ownership-declaration"
];

async function verifyAll() {
  console.log(`Starting verification of ${slugs.length} production URLs...\n`);
  let successCount = 0;
  let failCount = 0;

  for (const slug of slugs) {
    const url = `https://www.myacc.co.za/products/${slug}`;
    try {
      const res = await fetch(url);
      if (res.status !== 200) {
        console.log(`[FAIL] Status ${res.status}: ${url}`);
        failCount++;
        continue;
      }
      const html = await res.text();
      const hasMeta = html.includes('name="description"') || html.includes("name='description'");
      
      if (hasMeta) {
        // Extract meta tag for preview
        const match = html.match(/<meta name="description"[^>]*>/) || html.match(/<meta property="og:description"[^>]*>/);
        console.log(`[OK] 200: ${slug} -> ${match ? match[0] : 'Has description'}`);
        successCount++;
      } else {
        console.log(`[FAIL] Meta description tag missing in HTML: ${url}`);
        failCount++;
      }
    } catch (e: any) {
      console.log(`[ERROR] Failed to fetch ${url}: ${e.message}`);
      failCount++;
    }
  }

  console.log(`\nVerification Complete!`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed/Missing: ${failCount}`);
}

verifyAll().catch(console.error);
