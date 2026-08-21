import * as fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function inspectPage1Positions() {
  const data = new Uint8Array(fs.readFileSync('public/templates/Affidavit-EME-Gen.pdf'));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const page1 = await doc.getPage(1);
  const textContent = await page1.getTextContent();

  console.log('=== Page 1 Items with Coordinates ===');
  textContent.items.forEach((item: any) => {
    const transform = item.transform;
    console.log(`[x=${transform[4].toFixed(1)}, y=${transform[5].toFixed(1)}] ${item.str}`);
  });
}

inspectPage1Positions().catch(console.error);
