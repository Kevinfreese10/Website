import fs from 'fs';
import path from 'path';

const PROGRESS_FILE = path.join(__dirname, 'import-progress.json');
const ARTIFACT_FILE = 'C:\\Users\\kev\\.gemini\\antigravity\\brain\\ca8b6472-9313-41ad-8444-4920bb6a8ffe\\products-list.md';

function main() {
  const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  
  let md = `# Full List of Products\n\n`;
  md += `This document lists all 73 products from the database and the URL format we are proposing to use for the Google Business Profile.\n\n`;
  md += `Currently, the script assumes all products are accessible under the \`/products/<slug>\` path on the website (e.g., \`https://www.myacc.co.za/products/add-director\`).\n\n`;
  md += `| Title | Category | Proposed URL |\n`;
  md += `|---|---|---|\n`;

  data.forEach((item: any) => {
    md += `| ${item.title} | ${item.category} | https://www.myacc.co.za/products/${item.slug} |\n`;
  });

  fs.writeFileSync(ARTIFACT_FILE, md);
  console.log(`Generated products-list.md`);
}

main();
