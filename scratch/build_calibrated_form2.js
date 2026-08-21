const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require(path.resolve('c:/myacc/node_modules/pdf-lib'));

async function buildFullyCalibratedForm2() {
  const buf = fs.readFileSync('C:\\Users\\kev\\Downloads\\form 2.pdf');
  const doc = await PDFDocument.load(buf);
  const fontR = await doc.embedFont(StandardFonts.Helvetica);
  const fontB = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();
  const black = rgb(0, 0, 0);

  // ==========================================
  // PAGE 1: APPLICANT'S INFORMATION (1 - 10)
  // ==========================================
  const p1 = pages[0];

  // 1. Name of applicant (Box starts at x=215)
  p1.drawText('SLATON PROJECTS (PTY) LTD', { x: 215, y: 532, size: 8.5, font: fontB, color: black });

  // 2. Trading name (Box starts at x=215)
  p1.drawText('Slaton Loans', { x: 215, y: 509, size: 8.5, font: fontR, color: black });

  // 3.3 Private Company checkbox
  p1.drawText('X', { x: 74, y: 423, size: 9, font: fontB, color: black });

  // 4. CIPRO/other registration number (Box starts at x=265)
  p1.drawText('2026/215238/07', { x: 265, y: 404, size: 8.5, font: fontB, color: black });

  // 5. Date of commencement of trading (Box starts at x=265)
  p1.drawText('2026/03/23', { x: 265, y: 376, size: 8.5, font: fontR, color: black });

  // 6. Financial Year-End (Box starts at x=265)
  p1.drawText('28 February', { x: 265, y: 348, size: 8.5, font: fontR, color: black });

  // 7. Income Tax registration number (Box starts at x=265)
  p1.drawText('9897388196', { x: 265, y: 320, size: 8.5, font: fontB, color: black });

  // 8. VAT registration number (Box starts at x=265)
  p1.drawText('N/A (Non-VAT Registered)', { x: 265, y: 292, size: 8.5, font: fontR, color: black });

  // 10. Contact Details - Physical Address (Inside the 3 rounded boxes)
  p1.drawText('40 Bokkeveld Crescent', { x: 125, y: 175, size: 8, font: fontR, color: black });
  p1.drawText('Eldorado Park, Gauteng', { x: 125, y: 153, size: 8, font: fontR, color: black });
  p1.drawText('Johannesburg', { x: 125, y: 131, size: 8, font: fontR, color: black });
  p1.drawText('1811', { x: 448, y: 131, size: 8, font: fontB, color: black });

  // Postal Address (Inside the 3 rounded boxes)
  p1.drawText('40 Bokkeveld Crescent', { x: 125, y: 98, size: 8, font: fontR, color: black });
  p1.drawText('Eldorado Park, Gauteng', { x: 125, y: 76, size: 8, font: fontR, color: black });
  p1.drawText('Johannesburg', { x: 125, y: 54, size: 8, font: fontR, color: black });
  p1.drawText('1811', { x: 448, y: 54, size: 8, font: fontB, color: black });

  // Telephone & Fax
  p1.drawText('060 256 8221', { x: 125, y: 28, size: 8, font: fontR, color: black });
  p1.drawText('N/A', { x: 350, y: 28, size: 8, font: fontR, color: black });

  // Email address
  p1.drawText('slatonloans@outlook.com', { x: 155, y: 6, size: 8, font: fontR, color: black });


  // ==========================================
  // PAGE 2: CONTACT PERSON & AUDITOR (11 - 17)
  // ==========================================
  const p2 = pages[1];

  // 11. Contact Person
  p2.drawText('Ms.', { x: 55, y: 765, size: 8, font: fontR, color: black });
  p2.drawText('Nastasia', { x: 110, y: 765, size: 8, font: fontB, color: black });
  p2.drawText('N', { x: 260, y: 765, size: 8, font: fontR, color: black });
  p2.drawText('Benton', { x: 340, y: 765, size: 8, font: fontB, color: black });

  p2.drawText('060 256 8221', { x: 110, y: 740, size: 8, font: fontR, color: black });
  p2.drawText('N/A', { x: 260, y: 740, size: 8, font: fontR, color: black });
  p2.drawText('060 256 8221', { x: 370, y: 740, size: 8, font: fontR, color: black });
  p2.drawText('tasiabenton2804@gmail.com / slatonloans@outlook.com', { x: 140, y: 715, size: 8, font: fontR, color: black });

  // 12. Auditor / Accounting Officer
  p2.drawText('My Accountant (Pty) Ltd', { x: 125, y: 668, size: 8, font: fontB, color: black });
  p2.drawText('40 Bokkeveld Crescent, Eldorado Park', { x: 125, y: 645, size: 8, font: fontR, color: black });
  p2.drawText('Johannesburg, Gauteng', { x: 125, y: 625, size: 8, font: fontR, color: black });
  p2.drawText('1811', { x: 448, y: 625, size: 8, font: fontB, color: black });

  p2.drawText('40 Bokkeveld Crescent, Eldorado Park', { x: 125, y: 595, size: 8, font: fontR, color: black });
  p2.drawText('Johannesburg, Gauteng', { x: 125, y: 575, size: 8, font: fontR, color: black });
  p2.drawText('1811', { x: 448, y: 575, size: 8, font: fontB, color: black });

  p2.drawText('Kevin Freese', { x: 140, y: 545, size: 8, font: fontR, color: black });
  p2.drawText('010 109 1625', { x: 110, y: 520, size: 8, font: fontR, color: black });
  p2.drawText('kev@thinkestry.co.za / info@myacc.co.za', { x: 140, y: 498, size: 8, font: fontR, color: black });
  p2.drawText('CIBA / SAIBA / SAIT', { x: 340, y: 475, size: 8, font: fontR, color: black });

  // 13. Compliance Officer
  p2.drawText('N/A (SME Credit Provider)', { x: 140, y: 430, size: 8, font: fontR, color: black });

  // 14. Products: 14.3 Unsecured credit transactions
  p2.drawText('X', { x: 172, y: 280, size: 9, font: fontB, color: black });

  // 15. Ancillary products: None
  p2.drawText('None / N/A', { x: 380, y: 180, size: 8, font: fontR, color: black });

  // 16. Languages
  p2.drawText('Gauteng (Johannesburg / South)', { x: 45, y: 82, size: 7.5, font: fontR, color: black });
  p2.drawText('English', { x: 235, y: 82, size: 8, font: fontR, color: black });
  p2.drawText('Afrikaans', { x: 380, y: 82, size: 8, font: fontR, color: black });


  // ==========================================
  // PAGE 3: FINANCIAL INFORMATION (PART 2)
  // ==========================================
  const p3 = pages[2];

  // 17.1 B-BBEE
  p3.drawText('B-BBEE Level 4 Contributor (Exempted Micro Enterprise / Annual Turnover < R10 Million).', { x: 45, y: 720, size: 7.5, font: fontR, color: black });

  // 17.2 Over-indebtedness
  p3.drawText('Full compliance with Section 81 of the NCA: Mandatory credit and affordability assessments,', { x: 45, y: 648, size: 7.5, font: fontR, color: black });
  p3.drawText('income/expense verifications, and credit bureau inquiries prior to granting credit.', { x: 45, y: 636, size: 7.5, font: fontR, color: black });

  // Financial values (Startup R0)
  p3.drawText('0.00', { x: 430, y: 520, size: 8.5, font: fontR, color: black });
  p3.drawText('0', { x: 430, y: 470, size: 8.5, font: fontR, color: black });
  p3.drawText('0.00', { x: 430, y: 420, size: 8.5, font: fontR, color: black });
  p3.drawText('0', { x: 430, y: 370, size: 8.5, font: fontR, color: black });


  // ==========================================
  // PAGE 4: CONTROLLING INTERESTS & PREMISES
  // ==========================================
  const p4 = pages[3];

  // Part 3: Controlling interests (All NO)
  p4.drawText('X', { x: 485, y: 673, size: 9, font: fontB, color: black });
  p4.drawText('X', { x: 485, y: 650, size: 9, font: fontB, color: black });
  p4.drawText('X', { x: 485, y: 626, size: 9, font: fontB, color: black });
  p4.drawText('X', { x: 485, y: 602, size: 9, font: fontB, color: black });

  // Part 4: Premises count
  p4.drawText('1', { x: 400, y: 475, size: 9, font: fontB, color: black });
  p4.drawText('1', { x: 400, y: 452, size: 9, font: fontB, color: black });
  p4.drawText('0', { x: 400, y: 428, size: 9, font: fontB, color: black });

  // Branch 1 details
  p4.drawText('Slaton Loans', { x: 160, y: 360, size: 8, font: fontB, color: black });
  p4.drawText('40 Bokkeveld Crescent, Eldorado Park', { x: 160, y: 330, size: 7.5, font: fontR, color: black });
  p4.drawText('1811', { x: 450, y: 330, size: 8, font: fontB, color: black });
  p4.drawText('Nastasia Benton', { x: 160, y: 275, size: 8, font: fontR, color: black });
  p4.drawText('060 256 8221', { x: 160, y: 245, size: 8, font: fontR, color: black });
  p4.drawText('slatonloans@outlook.com', { x: 160, y: 215, size: 8, font: fontR, color: black });


  // ==========================================
  // PAGE 5: DECLARATION (PART 6)
  // ==========================================
  const p5 = pages[4];

  // Part 5: Supplementary (N/A)
  p5.drawText('N/A (Standard Credit Provider)', { x: 260, y: 675, size: 8, font: fontR, color: black });

  // Part 6: Declaration
  p5.drawText('Nastasia Benton', { x: 215, y: 155, size: 8.5, font: fontB, color: black });
  p5.drawText('Director', { x: 215, y: 95, size: 8.5, font: fontR, color: black });
  p5.drawText('2026/08/19', { x: 400, y: 95, size: 8.5, font: fontR, color: black });


  // ==========================================
  // PAGE 6: DISQUALIFICATION (PART 7: Q1 - Q8)
  // ==========================================
  const p6 = pages[5];

  p6.drawText('Nastasia Benton', { x: 240, y: 694, size: 8.5, font: fontB, color: black });
  p6.drawText('As per attached Certified ID', { x: 240, y: 673, size: 8, font: fontR, color: black });
  p6.drawText('2026/08/19', { x: 240, y: 651, size: 8, font: fontR, color: black });

  // Questions 1 to 8: All NO
  p6.drawText('X', { x: 492, y: 609, size: 9, font: fontB, color: black }); // Q1: No
  p6.drawText('X', { x: 492, y: 578, size: 9, font: fontB, color: black }); // Q2: No
  p6.drawText('X', { x: 492, y: 547, size: 9, font: fontB, color: black }); // Q3: No
  p6.drawText('X', { x: 492, y: 516, size: 9, font: fontB, color: black }); // Q4: No
  p6.drawText('X', { x: 492, y: 485, size: 9, font: fontB, color: black }); // Q5: No
  p6.drawText('X', { x: 492, y: 435, size: 9, font: fontB, color: black }); // Q6: No
  p6.drawText('X', { x: 492, y: 357, size: 9, font: fontB, color: black }); // Q7: No
  p6.drawText('X', { x: 492, y: 193, size: 9, font: fontB, color: black }); // Q8: No


  // ==========================================
  // PAGE 7: DISQUALIFICATION (Q9) & SAPS CONSENT
  // ==========================================
  const p7 = pages[6];

  // Q9: No
  p7.drawText('X', { x: 492, y: 723, size: 9, font: fontB, color: black });

  // Signature Date
  p7.drawText('2026/08/19', { x: 380, y: 470, size: 8.5, font: fontR, color: black });

  // Save
  const bytes = await doc.save();
  const destDownloads = 'C:\\Users\\kev\\Downloads\\Slaton_Loans_Form_2_Completed.pdf';
  const destScratch = 'c:/myacc/scratch/Slaton_Loans_Form_2_Completed.pdf';
  const destPublic = 'c:/myacc/public/Slaton_Loans_Form_2_Completed.pdf';

  fs.writeFileSync(destDownloads, bytes);
  fs.writeFileSync(destScratch, bytes);
  fs.writeFileSync(destPublic, bytes);

  console.log('✅ Form 2 Successfully Generated and Saved to:');
  console.log('   - ' + destDownloads);
}

buildFullyCalibratedForm2().catch(console.error);
