import * as fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function inspectPage2Positions() {
  const data = new Uint8Array(fs.readFileSync('public/templates/Affidavit-EME-Gen.pdf'));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const page2 = await doc.getPage(2);
  const textContent = await page2.getTextContent();

  console.log('=== Page 2 Items with Coordinates ===');
  textContent.items.forEach((item: any) => {
    const transform = item.transform; // [scaleX, skewY, skewX, scaleY, x, y]
    console.log(`[x=${transform[4].toFixed(1)}, y=${transform[5].toFixed(1)}] ${item.str}`);
  });
}

inspectPage2Positions().catch(console.error);
