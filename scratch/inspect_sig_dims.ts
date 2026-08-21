import * as fs from 'fs';
import { PDFDocument } from 'pdf-lib';

async function inspectNewSignature() {
  const doc = await PDFDocument.create();
  const sigBytes = fs.readFileSync('public/templates/Signature_Kevin_New.png');
  const img = await doc.embedPng(sigBytes);
  console.log(`Signature dimensions: width=${img.width}, height=${img.height}, ratio=${img.width / img.height}`);
}

inspectNewSignature().catch(console.error);
