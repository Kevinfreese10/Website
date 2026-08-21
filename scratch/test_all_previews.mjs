const templates = [
  'ncr_form_2',
  'ncr_director_resolution',
  'ncr_annexure_fees',
  'accounting_officer_letter',
  'accountants_letter',
  'engagement_letter',
  'power_of_attorney',
  'share_certificate',
  'sars_public_officer_resolution',
  'coida_cf1b_application'
];

async function testAll() {
  for (const t of templates) {
    try {
      const res = await fetch(`http://localhost:9003/api/templates/preview?id=${t}`);
      const buf = await res.arrayBuffer();
      console.log(`- Template '${t}': Status ${res.status} | Content-Type: ${res.headers.get('content-type')} | Bytes: ${buf.byteLength}`);
    } catch (e) {
      console.error(`- Template '${t}' error:`, e.message);
    }
  }
}

testAll();
