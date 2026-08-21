// FINAL CALIBRATED FORM 2 FILLER
// Calibration based on Chrome screenshots of the calibration grid PDF:
//   - Blue tick marks at y=50,100,150...750 from bottom (pdf-lib coords)
//   - Visual alignment of each field's input box with those ticks
//
// PAGE SIZE: 595.276 x 841.89 pts (A4)
// 
// KEY MEASUREMENTS FROM SCREENSHOT:
// y=750 tick appears at ~118px from top of screen
// y=700 tick appears at ~186px from top of screen
// => 1 pdf point = (186-118)/(750-700) = 68/50 = 1.36 screen pixels at 100% zoom
// => screen_top_of_page = 118 - (750 * 1.36) = 118 - 1020 = ... hmm
// Let's use ratio: page_top_y_pixel ~ 68 (just above y=750 tick)
// y=750 at pixel 118, so top of page (y=841.89) is at 118 - (91.89*1.36) = 118-125 = ~-7px
// That means the page top is at pixel ~68 (chrome toolbar is there)
//
// FIELD PIXEL POSITIONS from screenshot:
// "Name of applicant" box RIGHT SIDE: visible, box appears at screen y~477px
//   => pdf_y = 841.89 - ((477 - 68) * (841.89/770)) ≈ 841.89 - (409 * 1.093) ≈ 841.89 - 447 = 394.9 pts from bottom
//   Box height ≈ 13pt, so text baseline = 394.9 + 3 = 397.9 → round to 395
//
// BUT THE PAGE IS ACTUALLY SHORTER IN VIEW: Let me recalculate:
// The viewport shows about 620px of actual page (64px-684px)
// Full page = 841.89 pts
// Scale = 620 / 841.89 = 0.736 pts/pixel... wait that's reversed
// Scale = 841.89 / 620 = 1.358 pts per pixel
//
// y=750 at pixel 118: 841.89 - (118 * 1.358) = 841.89 - 160 = 681.89 ≠ 750
// So the scale isn't right... because Chrome PDF viewer adds padding.
// 
// Correct approach: use the two known tick marks to get exact scale:
// y=750 tick at screen pixel ~118 (from top of viewport)
// y=700 tick at screen pixel ~186
// Scale = (750-700)/(186-118) = 50/68 = 0.7353 pts/pixel
// 
// So: pdf_y = 750 - (screen_pixel - 118) * 0.7353
//     screen_pixel = 118 + (750 - pdf_y) / 0.7353
//
// Let's verify: y=450 should be at: 118 + (750-450)/0.7353 = 118 + 408 = 526px
//   From screenshot y=450 tick appears near screen y=527px ✓ MATCHES PERFECTLY!
//
// NOW map each field:
// Screen positions of field boxes (left inner edge = where text starts):
// 1. Name of applicant:   box top ≈ screen y=467, bottom ≈ y=481
//    pdf_y = 750 - (467-118)*0.7353 = 750 - 256.6 = 493.4 → box bottom=493.4, top=493.4+13=506.4
//    TEXT AT: y=496 (3pts above box bottom = baseline)
//
// 2. Trading name:        box top ≈ screen y=497, bottom ≈ y=511
//    pdf_y = 750 - (497-118)*0.7353 = 750 - 278.7 = 471.3 → text at y=474
//
// 3. Legal Status checkboxes:
//    3.3 Private Company checkbox: screen y=615, x≈634
//    pdf_y = 750 - (615-118)*0.7353 = 750 - 365.5 = 384.5
//
// 4. CIPRO reg: screen y=642, box text at pdf_y = 750-(642-118)*0.7353 = 750-385.3=364.7 → y=367
//
// 5. Date commencement: screen y=672, pdf_y = 750-(672-118)*0.7353 = 750-407.3=342.7 → y=345
//
// 6. Financial Year-End: screen y=701, pdf_y = 750-(701-118)*0.7353 = 750-428.6=321.4 → y=324
//
// 7. Income Tax: screen y=730, pdf_y = 750-(730-118)*0.7353 = 750-450=300 → y=303
//
// Note: we can't see items 8+ in the current view (they're below the fold)
// But we know each row is about 30px ≈ 22pts apart
// Item 8 (VAT): y=303-22=281
// Item 9 (regulated activities): y=281-22=259

const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require(path.resolve('c:/myacc/node_modules/pdf-lib'));

async function fillForm2Final() {
  const buf = fs.readFileSync('C:\\Users\\kev\\Downloads\\form 2.pdf');
  const doc = await PDFDocument.load(buf);
  const fontR = await doc.embedFont(StandardFonts.Helvetica);
  const fontB = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();
  
  const black = rgb(0, 0, 0);
  const SIZE = 8;
  const SIZE_SM = 7;

  // ============================================================
  // PAGE 1 - PART 1: APPLICANT'S INFORMATION
  // Field box x-start ≈ 207 (just inside left edge of input box)
  // ============================================================
  const p1 = pages[0];
  
  // Item 1: Name of applicant (box top≈506, bottom≈493)
  p1.drawText('SLATON PROJECTS (PTY) LTD', { x: 209, y: 496, size: SIZE, font: fontB, color: black });
  
  // Item 2: Trading name (box top≈484, bottom≈471)
  p1.drawText('Slaton Loans', { x: 209, y: 474, size: SIZE, font: fontR, color: black });
  
  // Item 3: Legal Status checkboxes
  // 3.3 Private Company: checkbox at pdf_x≈90, pdf_y≈384
  // The checkbox square center, so text "X" goes slightly inside
  p1.drawText('X', { x: 87, y: 384, size: 9, font: fontB, color: black });
  
  // Item 4: CIPRO/other official registration number (y≈367)
  p1.drawText('2026/215238/07', { x: 209, y: 367, size: SIZE, font: fontB, color: black });
  
  // Item 5: Date of commencement of trading (y≈345)
  p1.drawText('2026/03/23', { x: 209, y: 345, size: SIZE, font: fontR, color: black });
  
  // Item 6: Financial Year-End (y≈324)
  p1.drawText('28 February', { x: 209, y: 324, size: SIZE, font: fontR, color: black });
  
  // Item 7: Income Tax registration number (y≈303)
  p1.drawText('9897388196', { x: 209, y: 303, size: SIZE, font: fontB, color: black });
  
  // Item 8: VAT registration number (y≈281)
  p1.drawText('N/A - Not VAT Registered', { x: 209, y: 281, size: SIZE, font: fontR, color: black });
  
  // Item 9: Other regulated activity - none apply (skip tick boxes)
  
  // Item 10: Contact details
  // Physical Address - 2 text input boxes stacked
  // Box 1 (street): y≈165
  p1.drawText('40 Bokkeveld Crescent', { x: 140, y: 165, size: SIZE, font: fontR, color: black });
  // Box 2 (city/suburb): y≈143
  p1.drawText('Eldorado Park, Johannesburg', { x: 140, y: 143, size: SIZE, font: fontR, color: black });
  // Postal Code (Physical): x≈470, y≈143
  p1.drawText('1811', { x: 470, y: 143, size: SIZE, font: fontB, color: black });
  
  // Postal Address
  p1.drawText('40 Bokkeveld Crescent', { x: 140, y: 108, size: SIZE, font: fontR, color: black });
  p1.drawText('Eldorado Park, Johannesburg', { x: 140, y: 86, size: SIZE, font: fontR, color: black });
  // Postal Code (Postal):
  p1.drawText('1811', { x: 470, y: 86, size: SIZE, font: fontB, color: black });
  
  // Telephone number: y≈53
  p1.drawText('060 256 8221', { x: 140, y: 53, size: SIZE, font: fontR, color: black });
  // Fax: same row, x≈360
  p1.drawText('N/A', { x: 363, y: 53, size: SIZE, font: fontR, color: black });
  
  // e-mail address: y≈30
  p1.drawText('slatonloans@outlook.com', { x: 140, y: 30, size: SIZE, font: fontR, color: black });

  // ============================================================
  // PAGE 2 - PART 1 continued: Items 11-17 + PART 2
  // Same calibration scale applies
  // ============================================================
  const p2 = pages[1];
  const H2 = p2.getSize().height; // 841.89

  // Item 11: Contact person
  // "Title" label row: y≈755
  p2.drawText('Ms.', { x: 209, y: 755, size: SIZE, font: fontR, color: black });
  // "Name" + "Initials" row: y≈733
  p2.drawText('Nastasia', { x: 209, y: 733, size: SIZE, font: fontB, color: black });
  p2.drawText('N', { x: 450, y: 733, size: SIZE, font: fontR, color: black });
  // "Surname" row: y≈711
  p2.drawText('Benton', { x: 209, y: 711, size: SIZE, font: fontB, color: black });
  // "Telephone number (office)" row: y≈688
  p2.drawText('060 256 8221', { x: 209, y: 688, size: SIZE, font: fontR, color: black });
  // Fax number:
  p2.drawText('N/A', { x: 377, y: 688, size: SIZE, font: fontR, color: black });
  // "Cell number" row: y≈665
  p2.drawText('060 256 8221', { x: 209, y: 665, size: SIZE, font: fontR, color: black });
  // "e-mail address" row: y≈641
  p2.drawText('slatonloans@outlook.com', { x: 209, y: 641, size: SIZE, font: fontR, color: black });

  // Item 12: Auditor / Accounting Officer
  // "Name of Firm" row: y≈594
  p2.drawText('My Accountant (Pty) Ltd', { x: 165, y: 594, size: SIZE, font: fontB, color: black });
  // Physical Address box 1: y≈567
  p2.drawText('18 Chestnut Ave', { x: 165, y: 567, size: SIZE, font: fontR, color: black });
  // Physical Address box 2: y≈544
  p2.drawText('Brackenfell', { x: 165, y: 544, size: SIZE, font: fontR, color: black });
  // Postal Code (physical): y≈514
  p2.drawText('7560', { x: 470, y: 514, size: SIZE, font: fontB, color: black });
  // Postal Address box 1: y≈496
  p2.drawText('18 Chestnut Ave', { x: 165, y: 496, size: SIZE, font: fontR, color: black });
  // Postal Address box 2: y≈473
  p2.drawText('Brackenfell', { x: 165, y: 473, size: SIZE, font: fontR, color: black });
  // Postal Code (postal): y≈443
  p2.drawText('7560', { x: 470, y: 443, size: SIZE, font: fontB, color: black });
  // "Name of Auditor or Accountant" row: y≈416
  p2.drawText('Kevin Freese', { x: 165, y: 416, size: SIZE, font: fontR, color: black });
  // Telephone: y≈393
  p2.drawText('010 109 1625', { x: 165, y: 393, size: SIZE, font: fontR, color: black });
  // Fax: y≈393
  p2.drawText('N/A', { x: 363, y: 393, size: SIZE, font: fontR, color: black });
  // e-mail: y≈370
  p2.drawText('info@myacc.co.za', { x: 165, y: 370, size: SIZE, font: fontR, color: black });
  // Practice number: y≈346
  p2.drawText('N/A', { x: 165, y: 346, size: SIZE, font: fontR, color: black });
  // Name of professional body: y≈346 right side
  p2.drawText('CIBA / SAIBA / SAIT', { x: 350, y: 346, size: SIZE, font: fontR, color: black });

  // Item 13: Compliance Officer (SME - N/A)
  p2.drawText('N/A - SME Credit Provider', { x: 165, y: 302, size: SIZE, font: fontR, color: black });

  // Item 14: Products
  // 14.3 Unsecured credit transactions checkbox: y≈236
  p2.drawText('X', { x: 101, y: 236, size: 9, font: fontB, color: black });
  
  // Item 15: Ancillary products - none, leave blank
  
  // Item 16: Languages
  // Row 1 of the area table: y≈106
  p2.drawText('Gauteng (Johannesburg / South)', { x: 45, y: 106, size: SIZE_SM, font: fontR, color: black });
  p2.drawText('English', { x: 252, y: 106, size: SIZE, font: fontR, color: black });
  p2.drawText('Afrikaans', { x: 400, y: 106, size: SIZE, font: fontR, color: black });

  // Item 17.1: B-BBEE
  // y≈65
  p2.drawText('Level 4 Contributor (EME - Annual Turnover < R10M)', { x: 45, y: 65, size: SIZE_SM, font: fontR, color: black });
  
  // Item 17.2: Over-indebtedness
  // y≈33
  p2.drawText('Full NCA Section 81 compliance - mandatory credit/affordability assessments', { x: 45, y: 33, size: SIZE_SM, font: fontR, color: black });

  // ============================================================
  // PAGE 3 - PART 2: Financial Information
  // ============================================================
  const p3 = pages[2];
  
  // Financial values (startup company = all zeros)
  // Item 1: Net value loan book: y≈467
  p3.drawText('R 0.00', { x: 420, y: 467, size: SIZE, font: fontR, color: black });
  // Item 2: Total number credit agreements: y≈441
  p3.drawText('0', { x: 420, y: 441, size: SIZE, font: fontR, color: black });
  // Item 3: Total value agreements during year: y≈411
  p3.drawText('R 0.00', { x: 420, y: 411, size: SIZE, font: fontR, color: black });
  // Item 4: Total number agreements during year: y≈384
  p3.drawText('0', { x: 420, y: 384, size: SIZE, font: fontR, color: black });

  // ============================================================
  // PAGE 4 - PART 3: Directors + PART 4: Premises
  // ============================================================
  const p4 = pages[3];
  
  // Part 3: Controlling interests
  // "Does the Applicant hold a controlling interest in..."
  // Credit bureau: "No" checkbox at x≈504, y≈676
  p4.drawText('X', { x: 504, y: 676, size: 9, font: fontB, color: black });
  // Debt collection agency "No": y≈652
  p4.drawText('X', { x: 504, y: 652, size: 9, font: fontB, color: black });
  // ADR agent "No": y≈627
  p4.drawText('X', { x: 504, y: 627, size: 9, font: fontB, color: black });
  // Credit repair agency "No": y≈603
  p4.drawText('X', { x: 504, y: 603, size: 9, font: fontB, color: black });
  
  // Part 4: Business Premises
  // Total number premises: y≈478
  p4.drawText('1', { x: 420, y: 478, size: SIZE, font: fontB, color: black });
  // 1.1 Total branches normal credit: y≈454
  p4.drawText('1', { x: 420, y: 454, size: SIZE, font: fontB, color: black });
  // 1.2 Total branches developmental credit: y≈430
  p4.drawText('0', { x: 420, y: 430, size: SIZE, font: fontR, color: black });
  
  // Branch 1 info:
  // Trading name: y≈382
  p4.drawText('Slaton Loans', { x: 209, y: 382, size: SIZE, font: fontB, color: black });
  // Physical Address line 1: y≈358
  p4.drawText('40 Bokkeveld Crescent', { x: 209, y: 358, size: SIZE, font: fontR, color: black });
  // Physical Address line 2: y≈334
  p4.drawText('Eldorado Park, Johannesburg', { x: 209, y: 334, size: SIZE, font: fontR, color: black });
  // Postal Code: y≈310
  p4.drawText('1811', { x: 470, y: 310, size: SIZE, font: fontB, color: black });
  // Contact person: y≈285
  p4.drawText('Nastasia Benton', { x: 209, y: 285, size: SIZE, font: fontR, color: black });
  // Telephone: y≈261
  p4.drawText('060 256 8221', { x: 209, y: 261, size: SIZE, font: fontR, color: black });
  // Fax: y≈261
  p4.drawText('N/A', { x: 365, y: 261, size: SIZE, font: fontR, color: black });
  // e-mail: y≈237
  p4.drawText('slatonloans@outlook.com', { x: 209, y: 237, size: SIZE, font: fontR, color: black });

  // ============================================================
  // PAGE 5 - PART 5 (Supplementary - N/A) + PART 6 (Declaration)
  // ============================================================
  const p5 = pages[4];
  
  // Part 6: Declaration by Credit Provider
  // Name: y≈155
  p5.drawText('Nastasia Benton', { x: 209, y: 155, size: SIZE, font: fontB, color: black });
  // Capacity: y≈118
  p5.drawText('Director', { x: 209, y: 118, size: SIZE, font: fontR, color: black });
  // Date: y≈118, right side
  p5.drawText('2026/08/19', { x: 430, y: 118, size: SIZE, font: fontR, color: black });

  // ============================================================
  // PAGE 6 - PART 7: Disqualification of Natural Persons
  // ============================================================
  const p6 = pages[5];
  
  // Name: y≈694
  p6.drawText('Nastasia Benton', { x: 209, y: 694, size: SIZE, font: fontB, color: black });
  // Identity number: y≈671 (as per attached ID)
  p6.drawText('[See attached Certified ID Copy]', { x: 209, y: 671, size: SIZE_SM, font: fontR, color: black });
  // Date: y≈648
  p6.drawText('2026/08/19', { x: 209, y: 648, size: SIZE, font: fontR, color: black });
  
  // Questions 1-8: All "No"
  // The Yes/No are positioned on the right side of each question
  // Q1: y≈611
  p6.drawText('X', { x: 490, y: 611, size: 9, font: fontB, color: black });
  // Q2: y≈580
  p6.drawText('X', { x: 490, y: 580, size: 9, font: fontB, color: black });
  // Q3: y≈549
  p6.drawText('X', { x: 490, y: 549, size: 9, font: fontB, color: black });
  // Q4: y≈518
  p6.drawText('X', { x: 490, y: 518, size: 9, font: fontB, color: black });
  // Q5: y≈487
  p6.drawText('X', { x: 490, y: 487, size: 9, font: fontB, color: black });
  // Q6: y≈456
  p6.drawText('X', { x: 490, y: 456, size: 9, font: fontB, color: black });
  // Q7: y≈396
  p6.drawText('X', { x: 490, y: 396, size: 9, font: fontB, color: black });
  // Q8: y≈233 (Q8 has extra conditional "if yes" text)
  p6.drawText('X', { x: 490, y: 233, size: 9, font: fontB, color: black });

  // ============================================================
  // PAGE 7 - Q9, SAPS Consent (item 10), Declaration (item 11)
  // ============================================================
  const p7 = pages[6];
  
  // Q9: No - y≈765
  p7.drawText('X', { x: 490, y: 765, size: 9, font: fontB, color: black });
  
  // Item 11: Signature date for SAPS consent & declaration
  // "Date" field: y≈370
  p7.drawText('2026/08/19', { x: 430, y: 370, size: SIZE, font: fontR, color: black });

  // Save
  const bytes = await doc.save();
  const outScratch = 'c:/myacc/scratch/Slaton_Loans_Form2_FINAL.pdf';
  const outDownloads = 'C:\\Users\\kev\\Downloads\\Slaton_Loans_Form2_FINAL.pdf';
  
  fs.writeFileSync(outScratch, bytes);
  fs.copyFileSync(outScratch, outDownloads);
  console.log('Form 2 FINAL saved to:', outScratch);
  console.log('Also saved to Downloads:', outDownloads);
}

fillForm2Final().catch(console.error);
