import * as fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function extractTextFromPdf(pdfPath: string) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  console.log(`\n=== ${pdfPath} (${doc.numPages} pages) ===`);
  
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    const strings = textContent.items.map((item: any) => item.str);
    console.log(`--- Page ${i} ---`);
    console.log(strings.join(' '));
  }
}

async function main() {
  await extractTextFromPdf('scratch/order_10139_audit/DISCLOSR.pdf');
  await extractTextFromPdf('scratch/order_10139_audit/ID_-_Roger_Staples.pdf');
  await extractTextFromPdf('public/templates/Affidavit-EME-Gen.pdf');
}

main().catch(console.error);
