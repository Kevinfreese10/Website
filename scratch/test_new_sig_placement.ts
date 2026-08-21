import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

async function testNewSigPlacement() {
  const templateBytes = fs.readFileSync('public/templates/Affidavit-EME-Gen.pdf');
  const doc = await PDFDocument.load(templateBytes);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  const sigBytes = fs.readFileSync('public/templates/Signature_Kevin_New.png');
  const sigImage = await doc.embedPng(sigBytes);

  // Target width = 110 pt -> height = 110 / 2.3167 = ~47.5 pt
  const sigW = 110;
  const sigH = sigW / (sigImage.width / sigImage.height);

  const page2 = doc.getPage(1);

  // Draw Signature above / on the signature line (X = 90, Y = 78)
  page2.drawImage(sigImage, {
    x: 90,
    y: 78,
    width: sigW,
    height: sigH,
  });

  // Commissioner Stamp Box
  const stampBlue = rgb(0.08, 0.2, 0.45);
  const stampX = 90;
  const stampY = 10;
  const stampW = 200;
  const stampH = 65;

  page2.drawRectangle({
    x: stampX,
    y: stampY,
    width: stampW,
    height: stampH,
    borderColor: stampBlue,
    borderWidth: 1.2,
    color: rgb(0.98, 0.99, 1.0),
  });

  page2.drawRectangle({
    x: stampX + 2,
    y: stampY + 2,
    width: stampW - 4,
    height: stampH - 4,
    borderColor: stampBlue,
    borderWidth: 0.5,
  });

  let sY = stampY + stampH - 10;
  page2.drawText('COMMISSIONER OF OATHS (RSA)', { x: stampX + 18, y: sY, size: 7.5, font: fontBold, color: stampBlue });
  sY -= 9;
  page2.drawText('KEVIN WILLIAM FREESE', { x: stampX + 38, y: sY, size: 8, font: fontBold, color: stampBlue });
  sY -= 8;
  page2.drawText('Chartered Business Accountant in Practice (SA)', { x: stampX + 12, y: sY, size: 6.5, font: fontBold, color: stampBlue });
  sY -= 8;
  page2.drawText('CIBA #3561 | EX OFFICIO – REPUBLIC OF SOUTH AFRICA', { x: stampX + 6, y: sY, size: 6, font: fontBold, color: stampBlue });
  sY -= 8;
  page2.drawText('Ground Floor, Waterstone Building, Stonemill Office Park', { x: stampX + 8, y: sY, size: 5.8, font: fontRegular, color: stampBlue });
  sY -= 7;
  page2.drawText('300 Acacia Road, Darrenwood, Randburg, 2195', { x: stampX + 22, y: sY, size: 5.8, font: fontRegular, color: stampBlue });
  sY -= 8;
  page2.drawText(`Date: 21 August 2026`, { x: stampX + 55, y: sY, size: 6.8, font: fontBold, color: stampBlue });

  const outBytes = await doc.save();
  const outPath = 'scratch/order_10139_audit/test_new_sig_preview.pdf';
  fs.writeFileSync(outPath, outBytes);
  console.log(`Saved new signature preview to ${outPath}`);
}

testNewSigPlacement().catch(console.error);
