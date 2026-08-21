const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require(path.resolve('c:/myacc/node_modules/pdf-lib'));

// Based on visual analysis of the PDF at 100% zoom in Chrome:
// Page size: 595.276 x 841.89 points (A4)
// 
// APPROACH: Add bright RED numbered markers at calculated positions so we can see 
// exactly where text lands. This lets us calibrate all fields precisely.

async function addCalibrationMarkers() {
  const buf = fs.readFileSync('C:\\Users\\kev\\Downloads\\form 2.pdf');
  const doc = await PDFDocument.load(buf);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const red = rgb(1, 0, 0);
  const blue = rgb(0, 0, 1);

  const pages = doc.getPages();
  const p1 = pages[0];
  const { width, height } = p1.getSize();
  console.log(`Page 1 size: ${width} x ${height}`);

  // Draw a grid of markers to understand coordinate system
  // Markers at key y positions (from bottom = 0)
  const markers = [
    // Field 1: Name of applicant - based on screenshot, the box is ~row 478 from top
    // In PDF coords: y from bottom = height - row_from_top
    { label: '1-NAME', x: 200, y: height - 478 },   // ~364 from bottom
    { label: '2-TRADE', x: 200, y: height - 507 },  // Trading name
    { label: '4-CIPC', x: 200, y: height - 652 },   // CIPRO reg number
    { label: '5-DATE', x: 200, y: height - 681 },   // Date of commencement
    { label: '6-FYE', x: 200, y: height - 710 },    // Financial year-end
    { label: '7-TAX', x: 200, y: height - 738 },    // Income tax number
    { label: '8-VAT', x: 200, y: height - 767 },    // VAT number
    // Section 10 - Contact detail
    { label: '10-PHYS1', x: 200, y: height - 805 }, // Physical address line 1
    { label: '10-PHYS2', x: 200, y: height - 823 }, // Physical address line 2
  ];

  for (const m of markers) {
    // Draw a small red dot
    p1.drawCircle({ x: m.x, y: m.y, size: 3, color: red });
    // Write label
    p1.drawText(m.label, { x: m.x + 5, y: m.y - 4, size: 6, font, color: red });
  }

  // Also draw a coordinate grid
  for (let y = 50; y < height; y += 50) {
    p1.drawText(`y=${y.toFixed(0)}`, { x: 5, y: y - 3, size: 4, font, color: blue });
    p1.drawLine({ start: { x: 0, y }, end: { x: 10, y }, thickness: 0.3, color: blue });
  }
  for (let x = 50; x < width; x += 50) {
    p1.drawText(`x=${x.toFixed(0)}`, { x: x - 8, y: 5, size: 4, font, color: blue });
    p1.drawLine({ start: { x, y: 0 }, end: { x, y: 10 }, thickness: 0.3, color: blue });
  }

  const bytes = await doc.save();
  fs.writeFileSync('c:/myacc/scratch/form2_calibration.pdf', bytes);
  console.log('Calibration PDF written to c:/myacc/scratch/form2_calibration.pdf');
}

addCalibrationMarkers().catch(console.error);
