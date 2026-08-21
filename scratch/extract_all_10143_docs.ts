import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminStorage } from '../src/lib/firebase-admin';

async function extractTextFromPdf(pdfPath: string) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  console.log(`\n========================================`);
  console.log(`=== ${path.basename(pdfPath)} (${doc.numPages} pages) ===`);
  console.log(`========================================`);
  
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    const strings = textContent.items.map((item: any) => item.str);
    console.log(`\n--- Page ${i} ---`);
    console.log(strings.join(' '));
  }
}

async function run() {
  const bucketName = 'studio-2604127518-57889.firebasestorage.app';
  const bucket = getAdminStorage().bucket(bucketName);
  const outDir = path.resolve('scratch/order_10143_audit');

  const filesToDownload = [
    {
      name: 'Cipc_GLOWGRID_studio.pdf',
      storagePath: 'uploads/MBF4y9HOVlZH3BG7JRop9v8tG7M2/orders/10143/1787298649999_0_Cipc_GLOWGRID_studio.pdf',
    },
    {
      name: 'Cipc_Confident_Group.pdf',
      storagePath: 'uploads/MBF4y9HOVlZH3BG7JRop9v8tG7M2/orders/10143/1787298392977_0_Cipc_Confident_Group.pdf',
    },
    {
      name: '06_June.pdf',
      storagePath: 'uploads/MBF4y9HOVlZH3BG7JRop9v8tG7M2/orders/10143/1787298650000_1_06_June.pdf',
    },
    {
      name: '06_July.pdf',
      storagePath: 'uploads/MBF4y9HOVlZH3BG7JRop9v8tG7M2/orders/10143/1787298650000_2_06_July.pdf',
    },
    {
      name: '06_August.pdf',
      storagePath: 'uploads/MBF4y9HOVlZH3BG7JRop9v8tG7M2/orders/10143/1787298650001_3_06_August.pdf',
    },
  ];

  for (const f of filesToDownload) {
    const dest = path.join(outDir, f.name);
    console.log(`Downloading ${f.storagePath}...`);
    await bucket.file(f.storagePath).download({ destination: dest });
    console.log(`✓ Saved ${f.name} (${fs.statSync(dest).size} bytes)`);
  }

  for (const f of filesToDownload) {
    await extractTextFromPdf(path.join(outDir, f.name));
  }
}

run().catch(console.error);
