import * as fs from 'fs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

async function testPerfectSigAlign() {
  const templateBytes = fs.readFileSync('public/templates/Affidavit-EME-Gen.pdf');
  const doc = await PDFDocument.load(templateBytes);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  const sigBytes = fs.readFileSync('public/templates/Signature_Kevin_New.png');
  const sigImage = await doc.embedPng(sigBytes);

  const page2 = doc.getPage(1);
  const stampBlue = rgb(0.08, 0.2, 0.45);
  const navy = rgb(0.06, 0.13, 0.22);

  // --- 1. Fix the Financial Year End Date overlap ---
  page2.drawText('28 February 2026', {
    x: 247,
    y: 455.7,
    size: 7.2,
    font: fontBold,
    color: navy,
  });

  // --- 2. Deponent Date on Right ---
  page2.drawText('21 August 2026', {
    x: 360,
    y: 149.9,
    size: 9.5,
    font: fontBold,
    color: navy,
  });

  // --- 3. Commissioner of Oaths Signature & Stamp on Bottom Left ---
  // Mask the old template text and lines
  page2.drawRectangle({
    x: 80,
    y: 10,
    width: 230,
    height: 145,
    color: rgb(1, 1, 1), // white mask
  });

  const stampX = 85;
  const stampW = 215;
  const stampY = 15;
  const stampH = 68;

  // Draw Commissioner of Oaths Text Header
  page2.drawText('Commissioner of Oaths:', {
    x: stampX,
    y: 125,
    size: 8.5,
    font: fontBold,
    color: navy,
  });

  // Make signature smaller and place it directly on top of the Commissioner of Oaths text
  const sigW = 68;
  const sigH = sigW / (sigImage.width / sigImage.height);
  page2.drawImage(sigImage, {
    x: stampX + 115,
    y: 105,
    width: sigW,
    height: sigH,
  });

  // Draw Commissioner Stamp Box below the signature
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
  page2.drawText('COMMISSIONER OF OATHS (RSA)', { x: stampX + 25, y: sY, size: 7.5, font: fontBold, color: stampBlue });
  sY -= 9;
  page2.drawText('KEVIN WILLIAM FREESE', { x: stampX + 45, y: sY, size: 8, font: fontBold, color: stampBlue });
  sY -= 8;
  page2.drawText('Chartered Business Accountant in Practice (SA)', { x: stampX + 20, y: sY, size: 6.5, font: fontBold, color: stampBlue });
  sY -= 8;
  page2.drawText('CIBA #3561 | EX OFFICIO – REPUBLIC OF SOUTH AFRICA', { x: stampX + 14, y: sY, size: 6, font: fontBold, color: stampBlue });
  sY -= 8;
  page2.drawText('Ground Floor, Waterstone Building, Stonemill Office Park', { x: stampX + 16, y: sY, size: 5.8, font: fontRegular, color: stampBlue });
  sY -= 7;
  page2.drawText('300 Acacia Road, Darrenwood, Randburg, 2195', { x: stampX + 30, y: sY, size: 5.8, font: fontRegular, color: stampBlue });
  sY -= 8;
  page2.drawText(`Date: 21 August 2026`, { x: stampX + 65, y: sY, size: 6.8, font: fontBold, color: stampBlue });

  const outBytes = await doc.save();
  const outPath = 'scratch/order_10139_audit/test_perfect_sig_align.pdf';
  fs.writeFileSync(outPath, outBytes);
  console.log(`Saved calibrated preview to ${outPath}`);
}

testPerfectSigAlign().catch(console.error);
