const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require(path.resolve('c:/myacc/node_modules/pdf-lib'));

async function testFullPage1() {
  const buf = fs.readFileSync('C:\\Users\\kev\\Downloads\\form 2.pdf');
  const doc = await PDFDocument.load(buf);
  const fontR = await doc.embedFont(StandardFonts.Helvetica);
  const fontB = await doc.embedFont(StandardFonts.HelveticaBold);
  const p1 = doc.getPages()[0];
  const black = rgb(0, 0, 0);

  // 1. Name of applicant
  p1.drawText('SLATON PROJECTS (PTY) LTD', { x: 215, y: 532, size: 8.5, font: fontB, color: black });

  // 2. Trading name of applicant
  p1.drawText('Slaton Loans', { x: 215, y: 509, size: 8.5, font: fontR, color: black });

  // 3.3 Private Company checkbox
  p1.drawText('X', { x: 74, y: 418, size: 9, font: fontB, color: black });

  // 4. CIPRO reg number
  p1.drawText('2026/215238/07', { x: 215, y: 396, size: 8.5, font: fontB, color: black });

  // 5. Date of commencement of trading
  p1.drawText('2026/03/23', { x: 215, y: 368, size: 8.5, font: fontR, color: black });

  // 6. Financial Year-End
  p1.drawText('28 February', { x: 215, y: 340, size: 8.5, font: fontR, color: black });

  // 7. Income Tax registration number
  p1.drawText('9897388196', { x: 215, y: 312, size: 8.5, font: fontB, color: black });

  // 8. VAT registration number
  p1.drawText('N/A (Non-VAT Registered)', { x: 215, y: 284, size: 8.5, font: fontR, color: black });

  // 10. Contact Details - Physical Address
  p1.drawText('40 Bokkeveld Crescent', { x: 125, y: 175, size: 8, font: fontR, color: black });
  p1.drawText('Eldorado Park, Gauteng', { x: 125, y: 153, size: 8, font: fontR, color: black });
  p1.drawText('Johannesburg', { x: 125, y: 131, size: 8, font: fontR, color: black });
  p1.drawText('1811', { x: 445, y: 131, size: 8, font: fontB, color: black });

  // Postal Address
  p1.drawText('40 Bokkeveld Crescent', { x: 125, y: 98, size: 8, font: fontR, color: black });
  p1.drawText('Eldorado Park, Gauteng', { x: 125, y: 76, size: 8, font: fontR, color: black });
  p1.drawText('Johannesburg', { x: 125, y: 54, size: 8, font: fontR, color: black });
  p1.drawText('1811', { x: 445, y: 54, size: 8, font: fontB, color: black });

  // Telephone & Fax
  p1.drawText('060 256 8221', { x: 125, y: 28, size: 8, font: fontR, color: black });
  p1.drawText('N/A', { x: 350, y: 28, size: 8, font: fontR, color: black });

  // Email address
  p1.drawText('slatonloans@outlook.com', { x: 150, y: 6, size: 8, font: fontR, color: black });

  const bytes = await doc.save();
  fs.writeFileSync('c:/myacc/scratch/test_full_page1.pdf', bytes);
  console.log('Saved test_full_page1.pdf');
}

testFullPage1().catch(console.error);
