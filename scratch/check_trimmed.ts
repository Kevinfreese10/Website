import * as fs from 'fs';
import { PDFDocument } from 'pdf-lib';

async function checkTrimmed() {
  fs.copyFileSync('public/templates/Signature_Kevin_Trimmed.png', 'public/templates/Signature_Kevin_New.png');
  fs.copyFileSync('public/templates/Signature_Kevin_Trimmed.png', 'public/templates/Signature.png');

  const doc = await PDFDocument.create();
  const sigBytes = fs.readFileSync('public/templates/Signature_Kevin_New.png');
  const img = await doc.embedPng(sigBytes);
  console.log(`Trimmed dimensions: width=${img.width}, height=${img.height}, ratio=${(img.width / img.height).toFixed(3)}`);
}

checkTrimmed().catch(console.error);
