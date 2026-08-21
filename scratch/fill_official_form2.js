const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require(path.resolve('c:/myacc/node_modules/pdf-lib'));

async function fillOfficialForm2() {
  const templatePath = 'C:\\Users\\kev\\Downloads\\form 2.pdf';
  const templateBuf = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBuf);

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const textColor = rgb(0, 0, 0); // Black for official form filling
  const checkColor = rgb(0, 0, 0);

  const pages = pdfDoc.getPages();

  // ===================== PAGE 1 =====================
  const p1 = pages[0];
  // 1. Name of applicant
  p1.drawText('SLATON PROJECTS (PTY) LTD', { x: 260, y: 552, size: 9, font: fontBold, color: textColor });
  // 2. Trading name
  p1.drawText('Slaton Loans', { x: 260, y: 520, size: 9, font: fontRegular, color: textColor });
  // 3. Legal Status: Private Company (3.3)
  p1.drawText('X', { x: 196, y: 440, size: 10, font: fontBold, color: checkColor });
  // 4. CIPRO/CIPC reg number
  p1.drawText('2026/215238/07', { x: 260, y: 405, size: 9, font: fontBold, color: textColor });
  // 5. Date of commencement of trading
  p1.drawText('2026/03/23', { x: 260, y: 375, size: 9, font: fontRegular, color: textColor });
  // 6. Financial Year-End
  p1.drawText('28 February', { x: 260, y: 345, size: 9, font: fontRegular, color: textColor });
  // 7. Income Tax number
  p1.drawText('9897388196', { x: 260, y: 315, size: 9, font: fontBold, color: textColor });
  // 8. VAT reg number
  p1.drawText('N/A (Non-VAT Registered)', { x: 260, y: 285, size: 9, font: fontRegular, color: textColor });
  // 9. Other regulated activity: None / N/A
  p1.drawText('N/A', { x: 420, y: 220, size: 8, font: fontRegular, color: textColor });
  // 10. Physical Address
  p1.drawText('40 Bokkeveld Crescent, Eldorado Park', { x: 175, y: 155, size: 8.5, font: fontRegular, color: textColor });
  p1.drawText('1811', { x: 490, y: 155, size: 8.5, font: fontRegular, color: textColor });
  // Postal Address
  p1.drawText('40 Bokkeveld Crescent, Eldorado Park', { x: 175, y: 125, size: 8.5, font: fontRegular, color: textColor });
  p1.drawText('1811', { x: 490, y: 125, size: 8.5, font: fontRegular, color: textColor });
  // Tel & Email
  p1.drawText('060 256 8221', { x: 175, y: 95, size: 8.5, font: fontRegular, color: textColor });
  p1.drawText('slatonloans@outlook.com', { x: 380, y: 95, size: 8.5, font: fontRegular, color: textColor });

  // ===================== PAGE 2 =====================
  const p2 = pages[1];
  // 11. Contact Person
  p2.drawText('Ms.', { x: 95, y: 738, size: 8.5, font: fontRegular, color: textColor });
  p2.drawText('Nastasia', { x: 165, y: 738, size: 8.5, font: fontBold, color: textColor });
  p2.drawText('N', { x: 305, y: 738, size: 8.5, font: fontRegular, color: textColor });
  p2.drawText('Benton', { x: 400, y: 738, size: 8.5, font: fontBold, color: textColor });
  p2.drawText('060 256 8221', { x: 330, y: 708, size: 8.5, font: fontRegular, color: textColor });
  p2.drawText('tasiabenton2804@gmail.com / slatonloans@outlook.com', { x: 175, y: 680, size: 8, font: fontRegular, color: textColor });

  // 12. Auditor / Accounting Officer
  p2.drawText('My Accountant (Pty) Ltd', { x: 175, y: 622, size: 8.5, font: fontBold, color: textColor });
  p2.drawText('40 Bokkeveld Crescent, Eldorado Park, 1811', { x: 175, y: 592, size: 8, font: fontRegular, color: textColor });
  p2.drawText('Kevin Freese', { x: 175, y: 535, size: 8.5, font: fontRegular, color: textColor });
  p2.drawText('010 109 1625', { x: 175, y: 508, size: 8.5, font: fontRegular, color: textColor });
  p2.drawText('kev@thinkestry.co.za / info@myacc.co.za', { x: 370, y: 508, size: 8, font: fontRegular, color: textColor });
  p2.drawText('CIBA / SAIBA / SAIT', { x: 370, y: 480, size: 8.5, font: fontRegular, color: textColor });

  // 13. Compliance Officer
  p2.drawText('N/A (SME Credit Provider)', { x: 220, y: 425, size: 8.5, font: fontRegular, color: textColor });

  // 14. Products: 14.3 Unsecured credit transactions
  p2.drawText('X', { x: 70, y: 250, size: 10, font: fontBold, color: checkColor });

  // 15. Ancillary products: None
  p2.drawText('N/A — None', { x: 440, y: 150, size: 8, font: fontRegular, color: textColor });

  // 16. Languages
  p2.drawText('Gauteng (Johannesburg / Eldorado Park)', { x: 60, y: 80, size: 7.5, font: fontRegular, color: textColor });
  p2.drawText('English', { x: 235, y: 80, size: 8, font: fontRegular, color: textColor });
  p2.drawText('Afrikaans', { x: 380, y: 80, size: 8, font: fontRegular, color: textColor });

  // ===================== PAGE 3 =====================
  const p3 = pages[2];
  // 17.1 B-BBEE
  p3.drawText('B-BBEE Level 4 Contributor (Exempted Micro Enterprise - Annual Turnover < R10 Million).', { x: 60, y: 720, size: 7.5, font: fontRegular, color: textColor });
  // 17.2 Over-indebtedness
  p3.drawText('Mandatory credit assessments conducted in terms of Section 81 of the National Credit Act.', { x: 60, y: 645, size: 7.5, font: fontRegular, color: textColor });
  p3.drawText('Full income, expense and credit bureau verifications prior to granting credit.', { x: 60, y: 633, size: 7.5, font: fontRegular, color: textColor });

  // Part 2: Financial Information (Startup - R0.00)
  p3.drawText('0.00', { x: 450, y: 520, size: 8.5, font: fontRegular, color: textColor });
  p3.drawText('0', { x: 450, y: 470, size: 8.5, font: fontRegular, color: textColor });
  p3.drawText('0.00', { x: 450, y: 420, size: 8.5, font: fontRegular, color: textColor });
  p3.drawText('0', { x: 450, y: 370, size: 8.5, font: fontRegular, color: textColor });

  // ===================== PAGE 4 =====================
  const p4 = pages[3];
  // Part 3: Controlling interests (All NO)
  p4.drawText('X', { x: 495, y: 672, size: 9, font: fontBold, color: checkColor }); // Credit bureau: No
  p4.drawText('X', { x: 495, y: 648, size: 9, font: fontBold, color: checkColor }); // Debt collection: No
  p4.drawText('X', { x: 495, y: 624, size: 9, font: fontBold, color: checkColor }); // ADR: No
  p4.drawText('X', { x: 495, y: 600, size: 9, font: fontBold, color: checkColor }); // Credit repair: No

  // Part 4: Business Premises
  p4.drawText('1', { x: 400, y: 475, size: 9, font: fontBold, color: textColor });
  p4.drawText('1', { x: 400, y: 452, size: 9, font: fontBold, color: textColor });
  p4.drawText('0', { x: 400, y: 428, size: 9, font: fontBold, color: textColor });

  // Branch 1 details
  p4.drawText('Slaton Loans', { x: 195, y: 360, size: 8.5, font: fontBold, color: textColor });
  p4.drawText('40 Bokkeveld Crescent, Eldorado Park', { x: 195, y: 330, size: 8, font: fontRegular, color: textColor });
  p4.drawText('1811', { x: 490, y: 330, size: 8, font: fontRegular, color: textColor });
  p4.drawText('Nastasia Benton', { x: 195, y: 275, size: 8.5, font: fontRegular, color: textColor });
  p4.drawText('060 256 8221', { x: 195, y: 245, size: 8.5, font: fontRegular, color: textColor });
  p4.drawText('slatonloans@outlook.com', { x: 195, y: 215, size: 8.5, font: fontRegular, color: textColor });

  // ===================== PAGE 5 =====================
  const p5 = pages[4];
  // Part 5: Developmental credit: N/A
  p5.drawText('N/A (Standard Credit Provider)', { x: 260, y: 675, size: 8.5, font: fontRegular, color: textColor });

  // Part 6: Declaration by Credit Provider
  p5.drawText('Nastasia Benton', { x: 215, y: 155, size: 9, font: fontBold, color: textColor });
  p5.drawText('Director', { x: 215, y: 95, size: 9, font: fontRegular, color: textColor });
  p5.drawText('2026/08/18', { x: 400, y: 95, size: 9, font: fontRegular, color: textColor });

  // ===================== PAGE 6 =====================
  const p6 = pages[5];
  // Part 7: Disqualification of Natural Persons
  p6.drawText('Nastasia Benton', { x: 260, y: 675, size: 9, font: fontBold, color: textColor });
  p6.drawText('2026/08/18', { x: 260, y: 625, size: 9, font: fontRegular, color: textColor });

  // Questions 1 to 8: All NO
  p6.drawText('X', { x: 505, y: 558, size: 9, font: fontBold, color: checkColor }); // Q1: No
  p6.drawText('X', { x: 505, y: 495, size: 9, font: fontBold, color: checkColor }); // Q2: No
  p6.drawText('X', { x: 505, y: 440, size: 9, font: fontBold, color: checkColor }); // Q3: No
  p6.drawText('X', { x: 505, y: 385, size: 9, font: fontBold, color: checkColor }); // Q4: No
  p6.drawText('X', { x: 505, y: 330, size: 9, font: fontBold, color: checkColor }); // Q5: No
  p6.drawText('X', { x: 505, y: 275, size: 9, font: fontBold, color: checkColor }); // Q6: No
  p6.drawText('X', { x: 505, y: 195, size: 9, font: fontBold, color: checkColor }); // Q7: No
  p6.drawText('X', { x: 505, y: 105, size: 9, font: fontBold, color: checkColor }); // Q8: No

  // ===================== PAGE 7 =====================
  const p7 = pages[6];
  // Q9: No
  p7.drawText('X', { x: 505, y: 720, size: 9, font: fontBold, color: checkColor }); // Q9: No

  // Consent & Declaration signatures
  p7.drawText('2026/08/18', { x: 410, y: 350, size: 9, font: fontRegular, color: textColor });

  const pdfBytes = await pdfDoc.save();
  const outputPath = 'c:/myacc/scratch/Slaton_Loans_Form_2_Official.pdf';
  const publicPath = 'c:/myacc/public/Slaton_Loans_Form_2_Official.pdf';

  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`✅ Official Form 2 populated and saved to: ${outputPath}`);

  try {
    fs.writeFileSync(publicPath, pdfBytes);
    console.log(`✅ Copied to public path: ${publicPath}`);
  } catch (e) {}
}

fillOfficialForm2().catch(console.error);
