import * as fs from 'fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

async function getLastPageText(filePath: string): Promise<string> {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const loadingTask = getDocument({ data });
  const doc = await loadingTask.promise;
  
  // Get last page (where the official turnover summary is)
  const pg = await doc.getPage(doc.numPages);
  const content = await pg.getTextContent();
  const sorted = [...content.items]
    .map((item: any) => ({ str: item.str, x: item.transform?.[4] ?? 0, y: item.transform?.[5] ?? 0 }))
    .sort((a, b) => b.y - a.y || a.x - b.x);

  let lastY = -999;
  let text = '';
  for (const tok of sorted) {
    if (Math.abs(tok.y - lastY) > 3) {
      text += '\n';
      lastY = tok.y;
    }
    if (tok.str.trim()) text += tok.str + '  ';
  }
  return text;
}

async function main() {
  const files = [
    { path: 'scratch/order_10143_audit/06_June.pdf', label: 'Statement #42 — 06 May to 06 Jun 2026' },
    { path: 'scratch/order_10143_audit/06_July.pdf', label: 'Statement #43 — 06 Jun to 06 Jul 2026' },
    { path: 'scratch/order_10143_audit/06_August.pdf', label: 'Statement #44 — 06 Jul to 06 Aug 2026' },
  ];

  for (const f of files) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`OFFICIAL STATEMENT SUMMARY: ${f.label}`);
    console.log(`${'='.repeat(70)}`);
    const text = await getLastPageText(f.path);
    // Print the last page lines that mention turnover, credits, debits, closing balance
    const lines = text.split('\n');
    for (const line of lines) {
      if (/turnover|credit|debit|closing|balance|transactions|no\./i.test(line)) {
        console.log(line.trim());
      }
    }
  }
}

main().catch(console.error);
