import * as fs from 'fs';
import * as path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function parsePdf(filePath: string) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    const strings = textContent.items.map((item: any) => item.str);
    pages.push(strings.join(' '));
  }
  return pages;
}

async function analyze() {
  const dir = path.resolve('scratch/order_10143_audit');

  // 1. CIPC Glowgrid
  const glowgridPages = await parsePdf(path.join(dir, 'Cipc_GLOWGRID_studio.pdf'));
  console.log('=== CIPC GLOWGRID STUDIO ===');
  console.log(glowgridPages.join('\n'));

  // 2. CIPC Confident Group
  const confidentPages = await parsePdf(path.join(dir, 'Cipc_Confident_Group.pdf'));
  console.log('\n=== CIPC CONFIDENT GROUP ===');
  console.log(confidentPages.join('\n'));

  // 3. Bank Statements (RMB Private Bank / FNB)
  const junePages = await parsePdf(path.join(dir, '06_June.pdf'));
  console.log('\n=== JUNE STATEMENT ===');
  console.log(junePages[0].substring(0, 1000));

  const julyPages = await parsePdf(path.join(dir, '06_July.pdf'));
  console.log('\n=== JULY STATEMENT ===');
  console.log(julyPages[0].substring(0, 1000));

  const augustPages = await parsePdf(path.join(dir, '06_August.pdf'));
  console.log('\n=== AUGUST STATEMENT ===');
  console.log(augustPages[0].substring(0, 1000));
}

analyze().catch(console.error);
