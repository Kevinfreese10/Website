const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require(path.resolve('c:/myacc/node_modules/pdf-lib'));

// ============================================================
// CALIBRATED FIELD MAP for NCR Form 2 (form 2.pdf)
// 
// Page size: 595.276 x 841.89 pts (A4 portrait)
// Origin: BOTTOM-LEFT (pdf-lib standard)
// 
// Analysis method: 
//   1. Chrome screenshot at 100% = ~800px viewport height ? 841.89 pts
//   2. Blue y-grid tick marks placed every 50pts from bottom
//   3. Visual measurement of each field box position
//   4. Text placed at: x = box_left + 4 (small indent)
//                      y = box_bottom + 4 (text baseline above bottom of box)
//
// Field heights are typically ~13-14 pts (single line input boxes)
// ============================================================

async function fillForm2() {
  const buf = fs.readFileSync('C:\\Users\\kev\\Downloads\\form 2.pdf');
  const doc = await PDFDocument.load(buf);
  const fontR = await doc.embedFont(StandardFonts.Helvetica);
  const fontB = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();
  
  const black = rgb(0, 0, 0);
  const SIZE = 8; // Font size - must fit inside 13pt tall boxes
  const SIZE_SM = 7; // Small font for tight spaces

  // ============================================================
  // PAGE 1 - PART 1: APPLICANT'S INFORMATION
  // ============================================================
  const p1 = pages[0];
  const H1 = p1.getSize().height; // 841.89
  
  // Looking at the screenshot: 
  // The content area (right side boxes) starts at x?200 and extends to x?565
  // Each label+box row is approximately 15pts tall
  // The first row "Name of applicant" box is near the top of the form content

  // From the template text extraction (parse_template_boxes.js), labels are at these y positions:
  // The form uses a large coordinate space internally. After examining the CMap and 
  // text streams, the form template labels appear at specific y positions.
  //
  // VISUAL CALIBRATION from Chrome screenshot at 100% zoom:
  // Screen pixels top of form content area ? 450px from screen top
  // Each row ? 15px = 15pts at 100%
  // Name of applicant box: visible at screen y?478px
  //   ? PDF y from bottom = 841.89 - 478 ? 363.89 pts
  // But this is the TOP of the box. Text y = box_top - 10 (font size from top)
  
  // Let me use the label positions extracted from parse_template_boxes.js:
  // These gave us (from the form template text):
  // y values are in PDF space (from bottom):
  //   "Name of applicant" label was at screen position mapping to ~y=390 in PDF
  //   "Trading name of applicant" label at ~y=363
  //   Legal Status section at ~y=336
  //   CIPRO at ~y=290
  //   Date of commencement at ~y=264
  //   Financial Year-End at ~y=238
  //   Income Tax at ~y=212
  //   VAT at ~y=186
  //   Other regulated activity at ~y=160
  //   Contact details start at ~y=120
  //   Physical Address boxes at ~y=75-90
  //   Postal address at ~y=40-55
  //   Telephone/email at ~y=5-20

  // FIELD DEFINITIONS: [label, x_start_of_box, y_of_text_baseline, box_width]
  // For single-line boxes: text y_baseline = box_bottom_y + 3
  // Box bottoms determined from template label y positions + offset
  
  // ---- PART 1: Items 1-10 (Page 1 and continuation) ----
  
  // Item 1: Name of applicant - large box to right of label
  // Box starts at x?200, y?385 (bottom of box)
  p1.drawText('SLATON PROJECTS (PTY) LTD', {
    x: 207, y: 388, size: SIZE, font: fontB, color: black
  });
  
  // Item 2: Trading name
  p1.drawText('Slaton Loans', {
    x: 207, y: 361, size: SIZE, font: fontR, color: black
  });
  
  // Item 3: Legal Status - tick box 3.3 Private Company
  // 3.3 checkbox is at approximately x=85, y=320 (its center)
  p1.drawText('X', {
    x: 84, y: 320, size: 9, font: fontB, color: black
  });
  
  // Item 4: CIPRO/other official registration number
  p1.drawText('2026/215238/07', {
    x: 207, y: 287, size: SIZE, font: fontB, color: black
  });
  
  // Item 5: Date of commencement of trading
  p1.drawText('2026/03/23', {
    x: 207, y: 261, size: SIZE, font: fontR, color: black
  });
  
  // Item 6: Financial Year-End
  p1.drawText('28 February', {
    x: 207, y: 234, size: SIZE, font: fontR, color: black
  });
  
  // Item 7: Income Tax registration number
  p1.drawText('9897388196', {
    x: 207, y: 207, size: SIZE, font: fontB, color: black
  });
  
  // Item 8: VAT registration number
  p1.drawText('N/A (Not VAT Registered)', {
    x: 207, y: 180, size: SIZE, font: fontR, color: black
  });
  
  // Item 9: Other regulated activity - N/A
  // Checkboxes for 9.1-9.5 - none apply, so skip
  
  // Item 10: Contact detail - Physical Address
  // Physical address has 2 input lines + postal code
  // Line 1 of physical address:
  p1.drawText('40 Bokkeveld Crescent', {
    x: 140, y: 114, size: SIZE, font: fontR, color: black
  });
  // Line 2 (city):
  p1.drawText('Eldorado Park', {
    x: 140, y: 98, size: SIZE, font: fontR, color: black
  });
  // Postal code for physical:
  p1.drawText('1811', {
    x: 468, y: 98, size: SIZE, font: fontB, color: black
  });
  
  // Postal Address (same as physical):
  p1.drawText('40 Bokkeveld Crescent', {
    x: 140, y: 73, size: SIZE, font: fontR, color: black
  });
  p1.drawText('Eldorado Park', {
    x: 140, y: 57, size: SIZE, font: fontR, color: black
  });
  p1.drawText('1811', {
    x: 468, y: 57, size: SIZE, font: fontB, color: black
  });
  
  // Telephone:
  p1.drawText('060 256 8221', {
    x: 140, y: 32, size: SIZE, font: fontR, color: black
  });
  // Fax: N/A
  p1.drawText('N/A', {
    x: 370, y: 32, size: SIZE, font: fontR, color: black
  });
  // Email:
  p1.drawText('slatonloans@outlook.com', {
    x: 140, y: 8, size: SIZE, font: fontR, color: black
  });
  
  // ============================================================
  // PAGE 2 - Continuation of Part 1: Items 11-17 + Part 2
  // ============================================================
  const p2 = pages[1];
  const H2 = p2.getSize().height;
  
  // Item 11: Contact person
  // Title:
  p2.drawText('Ms.', {
    x: 207, y: H2 - 103, size: SIZE, font: fontR, color: black
  });
  // Name:
  p2.drawText('Nastasia', {
    x: 207, y: H2 - 123, size: SIZE, font: fontB, color: black
  });
  // Initials:
  p2.drawText('N', {
    x: 446, y: H2 - 123, size: SIZE, font: fontR, color: black
  });
  // Surname:
  p2.drawText('Benton', {
    x: 207, y: H2 - 143, size: SIZE, font: fontB, color: black
  });
  // Telephone (office):
  p2.drawText('060 256 8221', {
    x: 207, y: H2 - 166, size: SIZE, font: fontR, color: black
  });
  // Fax:
  p2.drawText('N/A', {
    x: 370, y: H2 - 166, size: SIZE, font: fontR, color: black
  });
  // Cell:
  p2.drawText('060 256 8221', {
    x: 207, y: H2 - 189, size: SIZE, font: fontR, color: black
  });
  // Email:
  p2.drawText('slatonloans@outlook.com', {
    x: 207, y: H2 - 212, size: SIZE, font: fontR, color: black
  });
  
  // Item 12: Auditor / Accounting Officer
  // Name of Firm:
  p2.drawText('My Accountant (Pty) Ltd', {
    x: 207, y: H2 - 256, size: SIZE, font: fontB, color: black
  });
  // Physical Address:
  p2.drawText('18 Chestnut Ave, Brackenfell, Cape Town', {
    x: 207, y: H2 - 285, size: SIZE, font: fontR, color: black
  });
  p2.drawText('7560', {
    x: 468, y: H2 - 313, size: SIZE, font: fontB, color: black
  });
  // Postal Address:
  p2.drawText('18 Chestnut Ave, Brackenfell, Cape Town', {
    x: 207, y: H2 - 333, size: SIZE, font: fontR, color: black
  });
  p2.drawText('7560', {
    x: 468, y: H2 - 362, size: SIZE, font: fontB, color: black
  });
  // Name of Auditor:
  p2.drawText('Kevin Freese', {
    x: 207, y: H2 - 395, size: SIZE, font: fontR, color: black
  });
  // Telephone:
  p2.drawText('010 109 1625', {
    x: 207, y: H2 - 418, size: SIZE, font: fontR, color: black
  });
  // Email:
  p2.drawText('info@myacc.co.za', {
    x: 207, y: H2 - 441, size: SIZE, font: fontR, color: black
  });
  // Practice number:
  p2.drawText('N/A', {
    x: 207, y: H2 - 464, size: SIZE, font: fontR, color: black
  });
  // Professional body:
  p2.drawText('CIBA / SAIBA / SAIT', {
    x: 340, y: H2 - 464, size: SIZE, font: fontR, color: black
  });
  
  // Item 13: Compliance Officer - N/A (SME Credit Provider)
  p2.drawText('N/A (SME Credit Provider - no external compliance officer required)', {
    x: 207, y: H2 - 510, size: SIZE_SM, font: fontR, color: black
  });
  
  // Item 14: Products - 14.3 Unsecured credit transactions
  // Checkboxes for 14.1-14.9, tick 14.3
  // 14.3 checkbox at approximately x=105, y from top of section
  p2.drawText('X', {
    x: 104, y: H2 - 583, size: 9, font: fontB, color: black
  });
  
  // Item 15: Ancillary products - none
  // All 15.1-15.5 remain unticked
  
  // Item 16: Languages
  // Area 1:
  p2.drawText('Gauteng (Johannesburg / South)', {
    x: 60, y: H2 - 697, size: SIZE_SM, font: fontR, color: black
  });
  // 1st Language:
  p2.drawText('English', {
    x: 250, y: H2 - 697, size: SIZE, font: fontR, color: black
  });
  // 2nd Language:
  p2.drawText('Afrikaans', {
    x: 395, y: H2 - 697, size: SIZE, font: fontR, color: black
  });
  
  // Item 17.1: B-BBEE
  p2.drawText('Level 4 Contributor - Exempted Micro Enterprise (Annual Turnover < R10M)', {
    x: 60, y: H2 - 738, size: SIZE_SM, font: fontR, color: black
  });
  
  // Item 17.2: Over-indebtedness
  p2.drawText('Section 81 NCA compliance - mandatory affordability & credit assessments', {
    x: 60, y: H2 - 775, size: SIZE_SM, font: fontR, color: black
  });

  // ============================================================
  // PAGE 3 - Part 2: Financial Information
  // ============================================================
  const p3 = pages[2];
  const H3 = p3.getSize().height;
  
  // Financial info - startup values = R0
  p3.drawText('R 0.00', {
    x: 400, y: H3 - 380, size: SIZE, font: fontR, color: black
  });
  p3.drawText('0', {
    x: 400, y: H3 - 420, size: SIZE, font: fontR, color: black
  });
  p3.drawText('R 0.00', {
    x: 400, y: H3 - 460, size: SIZE, font: fontR, color: black
  });
  p3.drawText('0', {
    x: 400, y: H3 - 500, size: SIZE, font: fontR, color: black
  });
  
  // ============================================================
  // PAGE 4 - Part 3: Directors + Part 4: Business Premises
  // ============================================================
  const p4 = pages[3];
  const H4 = p4.getSize().height;
  
  // Part 3: Controlling interests - all NO
  // These are checkboxes next to "Yes / No" text. Tick "No" for each
  // The "No" options are at the right side of each row
  p4.drawText('X', { x: 500, y: H4 - 167, size: 9, font: fontB, color: black }); // Credit bureau No
  p4.drawText('X', { x: 500, y: H4 - 187, size: 9, font: fontB, color: black }); // Debt collection No
  p4.drawText('X', { x: 500, y: H4 - 207, size: 9, font: fontB, color: black }); // ADR agent No
  p4.drawText('X', { x: 500, y: H4 - 227, size: 9, font: fontB, color: black }); // Credit repair No
  
  // Part 4: Business Premises
  // Total number of business premises: 1
  p4.drawText('1', { x: 450, y: H4 - 370, size: SIZE, font: fontB, color: black });
  p4.drawText('1', { x: 450, y: H4 - 393, size: SIZE, font: fontB, color: black }); // normal credit
  p4.drawText('0', { x: 450, y: H4 - 416, size: SIZE, font: fontR, color: black }); // developmental credit
  
  // Premises 1 details:
  p4.drawText('Slaton Loans', { x: 207, y: H4 - 460, size: SIZE, font: fontB, color: black });
  p4.drawText('40 Bokkeveld Crescent, Eldorado Park', { x: 207, y: H4 - 490, size: SIZE, font: fontR, color: black });
  p4.drawText('1811', { x: 468, y: H4 - 514, size: SIZE, font: fontB, color: black });
  p4.drawText('Nastasia Benton', { x: 207, y: H4 - 530, size: SIZE, font: fontR, color: black });
  p4.drawText('060 256 8221', { x: 207, y: H4 - 553, size: SIZE, font: fontR, color: black });
  p4.drawText('slatonloans@outlook.com', { x: 207, y: H4 - 576, size: SIZE, font: fontR, color: black });
  
  // ============================================================
  // PAGE 5 - Part 5: Supplementary Registration + Part 6: Declaration
  // ============================================================
  const p5 = pages[4];
  const H5 = p5.getSize().height;
  
  // Part 5: N/A (not applying for supplementary registration)
  // Item 1 checkboxes - none apply
  
  // Part 6: Declaration by Credit Provider
  // Name:
  p5.drawText('Nastasia Benton', {
    x: 207, y: H5 - 687, size: SIZE, font: fontB, color: black
  });
  // Capacity:
  p5.drawText('Director', {
    x: 207, y: H5 - 720, size: SIZE, font: fontR, color: black
  });
  // Date:
  p5.drawText('2026/08/19', {
    x: 430, y: H5 - 720, size: SIZE, font: fontR, color: black
  });
  
  // ============================================================
  // PAGE 6 - Part 7: Disqualification of Natural Persons
  // ============================================================
  const p6 = pages[5];
  const H6 = p6.getSize().height;
  
  // Name of natural person:
  p6.drawText('Nastasia Benton', {
    x: 207, y: H6 - 148, size: SIZE, font: fontB, color: black
  });
  // Identity number (from ID doc - need to confirm, using placeholder):
  p6.drawText('[As per attached Certified ID]', {
    x: 207, y: H6 - 169, size: SIZE_SM, font: fontR, color: black
  });
  // Date:
  p6.drawText('2026/08/19', {
    x: 207, y: H6 - 191, size: SIZE, font: fontR, color: black
  });
  
  // Questions 1-8: All NO
  // The "No" checkboxes appear at the right side of each question block
  // From visual analysis they are at x?490, varying y positions
  const noCheckX = 490;
  p6.drawText('X', { x: noCheckX, y: H6 - 212, size: 9, font: fontB, color: black }); // Q1 No
  p6.drawText('X', { x: noCheckX, y: H6 - 262, size: 9, font: fontB, color: black }); // Q2 No
  p6.drawText('X', { x: noCheckX, y: H6 - 312, size: 9, font: fontB, color: black }); // Q3 No
  p6.drawText('X', { x: noCheckX, y: H6 - 362, size: 9, font: fontB, color: black }); // Q4 No
  p6.drawText('X', { x: noCheckX, y: H6 - 405, size: 9, font: fontB, color: black }); // Q5 No
  p6.drawText('X', { x: noCheckX, y: H6 - 455, size: 9, font: fontB, color: black }); // Q6 No
  p6.drawText('X', { x: noCheckX, y: H6 - 530, size: 9, font: fontB, color: black }); // Q7 No
  p6.drawText('X', { x: noCheckX, y: H6 - 638, size: 9, font: fontB, color: black }); // Q8 No
  
  // ============================================================
  // PAGE 7 - Q9 + SAPS Consent + Declaration
  // ============================================================
  const p7 = pages[6];
  const H7 = p7.getSize().height;
  
  // Q9: No
  p7.drawText('X', { x: noCheckX, y: H7 - 77, size: 9, font: fontB, color: black });
  
  // Signature date for SAPS consent:
  p7.drawText('2026/08/19', { x: 430, y: H7 - 370, size: SIZE, font: fontR, color: black });
  
  // Save
  const bytes = await doc.save();
  const outPath = 'c:/myacc/scratch/Slaton_Loans_Form2_v3.pdf';
  fs.writeFileSync(outPath, bytes);
  fs.copyFileSync(outPath, 'C:\\Users\\kev\\Downloads\\Slaton_Loans_Form2_v3.pdf');
  console.log('? Form 2 v3 saved to:', outPath);
  console.log('? Also copied to Downloads');
}

fillForm2().catch(console.error);

