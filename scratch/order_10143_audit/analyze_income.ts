import * as fs from 'fs';
import * as path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function parseStatement(pdfPath: string) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  let fullText = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    const strings = textContent.items.map((item: any) => item.str);
    fullText += strings.join(' ') + '\n';
  }
  return fullText;
}

async function analyzeIncome() {
  const dir = path.resolve('scratch/order_10143_audit');
  
  const files = [
    { month: 'May - June 2026', file: '06_June.pdf' },
    { month: 'June - July 2026', file: '06_July.pdf' },
    { month: 'July - August 2026', file: '06_August.pdf' },
  ];

  for (const f of files) {
    const text = await parseStatement(path.join(dir, f.file));
    console.log(`\n========================================`);
    console.log(`=== ${f.month} (${f.file}) ===`);
    console.log(`========================================`);

    // Look for Turnover summary
    const turnoverMatch = text.match(/Turnover for Statement Period.*?Total/s) || text.match(/Turnover for Statement Period.*?Please/s) || text.match(/No\. Credit Transactions\s+(\d+)\s+([\d,]+\.\d{2})\s+Cr/);
    if (turnoverMatch) {
      console.log('Turnover section:', turnoverMatch[0]);
    }

    // Match credit lines (lines containing 'Cr')
    const crMatches = text.match(/([A-Za-z0-9\s/_-]+?)\s+([\d,]+\.\d{2})\s+Cr/g);
    console.log(`Found ${crMatches?.length || 0} credit items:`);
    if (crMatches) {
      crMatches.forEach(m => console.log('  •', m.trim()));
    }
  }
}

analyzeIncome().catch(console.error);
