const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require(path.resolve('c:/myacc/node_modules/pdf-lib'));

async function testPage1() {
  const buf = fs.readFileSync('C:\\Users\\kev\\Downloads\\form 2.pdf');
  const doc = await PDFDocument.load(buf);
  const fontR = await doc.embedFont(StandardFonts.Helvetica);
  const fontB = await doc.embedFont(StandardFonts.HelveticaBold);
  const p1 = doc.getPages()[0];
  const black = rgb(0, 0, 0);

  // Box 1: Name of applicant
  p1.drawText('SLATON PROJECTS (PTY) LTD', { x: 215, y: 524, size: 8.5, font: fontB, color: black });

  // Box 2: Trading name of applicant
  p1.drawText('Slaton Loans', { x: 215, y: 496, size: 8.5, font: fontR, color: black });

  // Checkbox 3.3: Private Company
  p1.drawText('X', { x: 91, y: 432, size: 9, font: fontB, color: black });

  // Box 4: CIPRO reg number
  p1.drawText('2026/215238/07', { x: 215, y: 405, size: 8.5, font: fontB, color: black });

  // Box 5: Date of commencement of trading
  p1.drawText('2026/03/23', { x: 215, y: 375, size: 8.5, font: fontR, color: black });

  // Box 6: Financial Year-End
  p1.drawText('28 February', { x: 215, y: 345, size: 8.5, font: fontR, color: black });

  // Box 7: Income Tax registration number
  p1.drawText('9897388196', { x: 215, y: 315, size: 8.5, font: fontB, color: black });

  // Box 8: VAT registration number
  p1.drawText('N/A (Non-VAT Registered)', { x: 215, y: 285, size: 8.5, font: fontR, color: black });

  const bytes = await doc.save();
  fs.writeFileSync('c:/myacc/scratch/test_page1.pdf', bytes);
  console.log('Saved test_page1.pdf');
}

testPage1().catch(console.error);
