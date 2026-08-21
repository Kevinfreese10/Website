const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require(path.resolve('c:/myacc/node_modules/pdf-lib'));

async function fillOfficialForm2Accurate() {
  const templatePath = 'C:\\Users\\kev\\Downloads\\form 2.pdf';
  const templateBuf = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBuf);

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const textColor = rgb(0.05, 0.05, 0.05);
  const checkColor = rgb(0, 0, 0);

  const pages = pdfDoc.getPages();

  // ===================== PAGE 1 =====================
  const p1 = pages[0];
  
  // 1. Name of applicant
  p1.drawText('SLATON PROJECTS (PTY) LTD', { x: 215, y: 526, size: 8.5, font: fontBold, color: textColor });
  
  // 2. Trading name
  p1.drawText('Slaton Loans', { x: 215, y: 496, size: 8.5, font: fontRegular, color: textColor });
  
  // 3. Legal Status: 3.3 Private Company (tick inside the box)
  p1.drawText('X', { x: 198, y: 439, size: 9, font: fontBold, color: checkColor });
  
  // 4. CIPRO/other registration number
  p1.drawText('2026/215238/07', { x: 215, y: 395, size: 8.5, font: fontBold, color: textColor });
  
  // 5. Date of commencement of trading
  p1.drawText('2026/03/23', { x: 215, y: 365, size: 8.5, font: fontRegular, color: textColor });
  
  // 6. Financial Year-End
  p1.drawText('28 February', { x: 215, y: 335, size: 8.5, font: fontRegular, color: textColor });
  
  // 7. Income Tax registration number
  p1.drawText('9897388196', { x: 215, y: 305, size: 8.5, font: fontBold, color: textColor });
  
  // 8. VAT registration number
  p1.drawText('N/A (Non-VAT Registered)', { x: 215, y: 275, size: 8.5, font: fontRegular, color: textColor });
  
  // 9. Other regulated activity (None / N/A)
  p1.drawText('N/A', { x: 420, y: 218, size: 8, font: fontRegular, color: textColor });
  
  // 10. Contact detail of the Applicant
  // Physical Address (3 rounded lines)
  p1.drawText('40 Bokkeveld Crescent', { x: 125, y: 153, size: 8, font: fontRegular, color: textColor });
  p1.drawText('Eldorado Park, Gauteng', { x: 125, y: 135, size: 8, font: fontRegular, color: textColor });
  p1.drawText('Johannesburg', { x: 125, y: 117, size: 8, font: fontRegular, color: textColor });
  p1.drawText('1811', { x: 448, y: 117, size: 8, font: fontBold, color: textColor }); // Postal Code (Physical)
  
  // Postal Address (3 rounded lines)
  p1.drawText('40 Bokkeveld Crescent', { x: 125, y: 86, size: 8, font: fontRegular, color: textColor });
  p1.drawText('Eldorado Park, Gauteng', { x: 125, y: 68, size: 8, font: fontRegular, color: textColor });
  p1.drawText('Johannesburg', { x: 125, y: 50, size: 8, font: fontRegular, color: textColor });
  p1.drawText('1811', { x: 448, y: 50, size: 8, font: fontBold, color: textColor }); // Postal Code (Postal)

  // Telephone number & Fax (bottom of Page 1)
  p1.drawText('060 256 8221', { x: 125, y: 24, size: 8, font: fontRegular, color: textColor });
  p1.drawText('N/A', { x: 380, y: 24, size: 8, font: fontRegular, color: textColor });

  // Email address
  p1.drawText('slatonloans@outlook.com', { x: 160, y: 5, size: 8, font: fontRegular, color: textColor });


  // ===================== PAGE 2 =====================
  const p2 = pages[1];
  
  // 11. Contact Person
  p2.drawText('Ms.', { x: 55, y: 735, size: 8, font: fontRegular, color: textColor });
  p2.drawText('Nastasia', { x: 110, y: 735, size: 8, font: fontBold, color: textColor });
  p2.drawText('N', { x: 260, y: 735, size: 8, font: fontRegular, color: textColor });
  p2.drawText('Benton', { x: 340, y: 735, size: 8, font: fontBold, color: textColor });
  
  p2.drawText('060 256 8221', { x: 110, y: 710, size: 8, font: fontRegular, color: textColor });
  p2.drawText('N/A', { x: 260, y: 710, size: 8, font: fontRegular, color: textColor });
  p2.drawText('060 256 8221', { x: 370, y: 710, size: 8, font: fontRegular, color: textColor });
  p2.drawText('tasiabenton2804@gmail.com / slatonloans@outlook.com', { x: 140, y: 685, size: 8, font: fontRegular, color: textColor });

  // 12. Auditor / Accounting Officer
  p2.drawText('My Accountant (Pty) Ltd', { x: 125, y: 642, size: 8, font: fontBold, color: textColor });
  p2.drawText('40 Bokkeveld Crescent, Eldorado Park, 1811', { x: 125, y: 620, size: 8, font: fontRegular, color: textColor });
  p2.drawText('40 Bokkeveld Crescent, Eldorado Park, 1811', { x: 125, y: 575, size: 8, font: fontRegular, color: textColor });
  p2.drawText('Kevin Freese', { x: 140, y: 535, size: 8, font: fontRegular, color: textColor });
  p2.drawText('010 109 1625', { x: 110, y: 512, size: 8, font: fontRegular, color: textColor });
  p2.drawText('kev@thinkestry.co.za', { x: 140, y: 490, size: 8, font: fontRegular, color: textColor });
  p2.drawText('CIBA / SAIBA / SAIT', { x: 340, y: 468, size: 8, font: fontRegular, color: textColor });

  // 13. Compliance Officer
  p2.drawText('N/A (SME Credit Provider)', { x: 140, y: 425, size: 8, font: fontRegular, color: textColor });

  // 14. Products: 14.3 Unsecured credit transactions
  p2.drawText('X', { x: 172, y: 275, size: 9, font: fontBold, color: checkColor });

  // 15. Ancillary products: None
  p2.drawText('None / N/A', { x: 380, y: 175, size: 8, font: fontRegular, color: textColor });

  // 16. Languages (Section 63)
  p2.drawText('Gauteng (Johannesburg / Eldorado Park)', { x: 45, y: 78, size: 7.5, font: fontRegular, color: textColor });
  p2.drawText('English', { x: 235, y: 78, size: 8, font: fontRegular, color: textColor });
  p2.drawText('Afrikaans', { x: 380, y: 78, size: 8, font: fontRegular, color: textColor });


  // ===================== PAGE 3 =====================
  const p3 = pages[2];
  
  // 17.1 B-BBEE
  p3.drawText('B-BBEE Level 4 Contributor (Exempted Micro Enterprise / Annual Turnover < R10 Million).', { x: 45, y: 720, size: 7.5, font: fontRegular, color: textColor });
  
  // 17.2 Over-indebtedness
  p3.drawText('Full compliance with Section 81 of the NCA: Mandatory credit and affordability assessments,', { x: 45, y: 648, size: 7.5, font: fontRegular, color: textColor });
  p3.drawText('income/expense verifications, and credit bureau inquiries prior to granting credit.', { x: 45, y: 636, size: 7.5, font: fontRegular, color: textColor });

  // Part 2: Financial Information (Startup - R0.00)
  p3.drawText('0.00', { x: 430, y: 520, size: 8.5, font: fontRegular, color: textColor });
  p3.drawText('0', { x: 430, y: 470, size: 8.5, font: fontRegular, color: textColor });
  p3.drawText('0.00', { x: 430, y: 420, size: 8.5, font: fontRegular, color: textColor });
  p3.drawText('0', { x: 430, y: 370, size: 8.5, font: fontRegular, color: textColor });


  // ===================== PAGE 4 =====================
  const p4 = pages[3];
  
  // Part 3: Controlling interests (All NO)
  p4.drawText('X', { x: 485, y: 673, size: 9, font: fontBold, color: checkColor }); // Credit bureau: No
  p4.drawText('X', { x: 485, y: 650, size: 9, font: fontBold, color: checkColor }); // Debt collection: No
  p4.drawText('X', { x: 485, y: 626, size: 9, font: fontBold, color: checkColor }); // ADR: No
  p4.drawText('X', { x: 485, y: 602, size: 9, font: fontBold, color: checkColor }); // Credit repair: No

  // Part 4: Business Premises
  p4.drawText('1', { x: 400, y: 475, size: 9, font: fontBold, color: textColor });
  p4.drawText('1', { x: 400, y: 452, size: 9, font: fontBold, color: textColor });
  p4.drawText('0', { x: 400, y: 428, size: 9, font: fontBold, color: textColor });

  // Branch 1 details
  p4.drawText('Slaton Loans', { x: 160, y: 360, size: 8, font: fontBold, color: textColor });
  p4.drawText('40 Bokkeveld Crescent, Eldorado Park', { x: 160, y: 330, size: 7.5, font: fontRegular, color: textColor });
  p4.drawText('1811', { x: 450, y: 330, size: 8, font: fontBold, color: textColor });
  p4.drawText('Nastasia Benton', { x: 160, y: 275, size: 8, font: fontRegular, color: textColor });
  p4.drawText('060 256 8221', { x: 160, y: 245, size: 8, font: fontRegular, color: textColor });
  p4.drawText('slatonloans@outlook.com', { x: 160, y: 215, size: 8, font: fontRegular, color: textColor });


  // ===================== PAGE 5 =====================
  const p5 = pages[4];
  
  // Part 5: Developmental credit: N/A
  p5.drawText('N/A (Standard Credit Provider)', { x: 260, y: 675, size: 8, font: fontRegular, color: textColor });

  // Part 6: Declaration by Credit Provider
  p5.drawText('Nastasia Benton', { x: 215, y: 155, size: 8.5, font: fontBold, color: textColor });
  p5.drawText('Director', { x: 215, y: 95, size: 8.5, font: fontRegular, color: textColor });
  p5.drawText('2026/08/18', { x: 400, y: 95, size: 8.5, font: fontRegular, color: textColor });


  // ===================== PAGE 6 =====================
  const p6 = pages[5];
  
  // Part 7: Disqualification of Natural Persons
  p6.drawText('Nastasia Benton', { x: 240, y: 694, size: 8.5, font: fontBold, color: textColor });
  p6.drawText('As per attached ID', { x: 240, y: 673, size: 8, font: fontRegular, color: textColor });
  p6.drawText('2026/08/18', { x: 240, y: 651, size: 8, font: fontRegular, color: textColor });

  // Questions 1 to 8: All NO
  p6.drawText('X', { x: 492, y: 609, size: 9, font: fontBold, color: checkColor }); // Q1: No
  p6.drawText('X', { x: 492, y: 578, size: 9, font: fontBold, color: checkColor }); // Q2: No
  p6.drawText('X', { x: 492, y: 547, size: 9, font: fontBold, color: checkColor }); // Q3: No
  p6.drawText('X', { x: 492, y: 516, size: 9, font: fontBold, color: checkColor }); // Q4: No
  p6.drawText('X', { x: 492, y: 485, size: 9, font: fontBold, color: checkColor }); // Q5: No
  p6.drawText('X', { x: 492, y: 435, size: 9, font: fontBold, color: checkColor }); // Q6: No
  p6.drawText('X', { x: 492, y: 357, size: 9, font: fontBold, color: checkColor }); // Q7: No
  p6.drawText('X', { x: 492, y: 193, size: 9, font: fontBold, color: checkColor }); // Q8: No


  // ===================== PAGE 7 =====================
  const p7 = pages[6];
  
  // Q9: No
  p7.drawText('X', { x: 492, y: 723, size: 9, font: fontBold, color: checkColor }); // Q9: No

  // Consent & Declaration signature date
  p7.drawText('2026/08/18', { x: 380, y: 470, size: 8.5, font: fontRegular, color: textColor });


  const pdfBytes = await pdfDoc.save();
  const outputPath = 'c:/myacc/scratch/Slaton_Loans_Form_2_Official.pdf';
  const publicPath = 'c:/myacc/public/Slaton_Loans_Form_2_Official.pdf';

  fs.writeFileSync(outputPath, pdfBytes);
  fs.writeFileSync(publicPath, pdfBytes);
  console.log(`✅ Perfected Form 2 PDF written to ${outputPath} and ${publicPath}`);
}

fillOfficialForm2Accurate().catch(console.error);
