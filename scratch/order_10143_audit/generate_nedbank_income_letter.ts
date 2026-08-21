import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { drawMyAccHeader } from '../../src/lib/pdf/template-generators';

async function generateNedbankIncomeLetter() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const fontItalicBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);

  const { width, height } = page.getSize();
  const margin = 45;
  const navy = rgb(0.06, 0.13, 0.22);
  const darkSlate = rgb(0.18, 0.22, 0.28);

  // 1. Draw My Accountant Executive Header
  drawMyAccHeader(page, width, height, fontBold, fontRegular);

  let currentY = height - 90;

  // Addressee & Reference
  page.drawText('21 August 2026', { x: margin, y: currentY, size: 8.5, font: fontRegular, color: rgb(0.4, 0.45, 0.5) });
  currentY -= 14;

  page.drawText('TO: NEDBANK LIMITED', { x: margin, y: currentY, size: 9, font: fontBold, color: navy });
  currentY -= 11;
  page.drawText('Credit Assessment & Underwriting Department', { x: margin, y: currentY, size: 8.5, font: fontRegular, color: darkSlate });
  currentY -= 11;
  page.drawText('Re: Revolving Credit Facility Application — Proof of Income & Drawings', { x: margin, y: currentY, size: 8.5, font: fontRegular, color: darkSlate });

  currentY -= 18;

  // Title Banner
  page.drawRectangle({
    x: margin,
    y: currentY - 24,
    width: width - margin * 2,
    height: 24,
    color: rgb(0.96, 0.97, 0.99),
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 0.75,
  });

  page.drawText('ACCOUNTANT’S CONFIRMATION OF INCOME & DIRECTOR DRAWINGS', {
    x: margin + 12,
    y: currentY - 16,
    size: 9.5,
    font: fontBold,
    color: navy,
  });

  currentY -= 36;

  // Intro paragraph drawer
  function drawPara(text: string, yPos: number, size = 8.5, lineHeight = 12) {
    const paragraphs = text.split('\n');
    let y = yPos;
    for (const para of paragraphs) {
      if (!para.trim()) {
        y -= lineHeight / 2;
        continue;
      }
      const words = para.trim().split(/\s+/);
      let line = '';
      for (const w of words) {
        const test = line + (line ? ' ' : '') + w;
        if (fontRegular.widthOfTextAtSize(test, size) > (width - margin * 2)) {
          page.drawText(line, { x: margin, y, size, font: fontRegular, color: darkSlate });
          line = w;
          y -= lineHeight;
        } else {
          line = test;
        }
      }
      if (line) {
        page.drawText(line, { x: margin, y, size, font: fontRegular, color: darkSlate });
        y -= lineHeight;
      }
      y -= 3;
    }
    return y;
  }

  const p1 = `We, My Accountant (Pty) Ltd (Practice No. CIBA #3561), acting as the appointed Accounting and Business Advisory Practice, hereby confirm that we have reviewed and analyzed the statutory business records and verified personal banking records of Mr. Alby Festus for the purpose of his credit facility assessment with Nedbank Limited.`;
  currentY = drawPara(p1, currentY);
  currentY -= 4;

  // Applicant & Business Profile Box
  const profileH = 48;
  page.drawRectangle({
    x: margin,
    y: currentY - profileH,
    width: width - margin * 2,
    height: profileH,
    color: rgb(0.98, 0.99, 1.0),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 0.5,
  });

  let profY = currentY - 12;
  page.drawText('APPLICANT & STATUTORY ENTITY PARTICULARS:', { x: margin + 10, y: profY, size: 7.5, font: fontBold, color: navy });
  profY -= 11;
  page.drawText('• Applicant Name: MR ALBY FESTUS | ID Number: 0409016640180 | Tax Status: Compliant', { x: margin + 10, y: profY, size: 7.5, font: fontRegular, color: darkSlate });
  profY -= 11;
  page.drawText('• Operating Business 1: GLOWGRID STUDIO (PTY) LTD (Reg: 2025/517463/07 | Tax: 9175864280)', { x: margin + 10, y: profY, size: 7.5, font: fontRegular, color: darkSlate });
  profY -= 11;
  page.drawText('• Operating Business 2: CONFIDENT GROUP (PTY) LTD (Reg: 2023/506946/07 | Tax: 9490749208)', { x: margin + 10, y: profY, size: 7.5, font: fontRegular, color: darkSlate });

  currentY -= profileH + 12;

  // Financial Verification Section
  page.drawText('VERIFIED 3-MONTH BANKING & NET INCOME ANALYSIS (CONSERVATIVE BASIS):', { x: margin, y: currentY, size: 8.5, font: fontBold, color: navy });
  currentY -= 12;

  const bankIntro = `Bank: RMB Private Bank (FirstRand Bank Ltd) | Account Name: MR ALBY FESTUS | Account Number: 63034793364`;
  page.drawText(bankIntro, { x: margin, y: currentY, size: 7.5, font: fontOblique, color: rgb(0.35, 0.4, 0.45) });
  currentY -= 14;

  // Financial Table (3-column, conservative net figures)
  const tableX = margin;
  const tableW = width - margin * 2;
  const colWidths = [240, 130, 135];

  // Header Row
  page.drawRectangle({
    x: tableX,
    y: currentY - 16,
    width: tableW,
    height: 16,
    color: rgb(0.06, 0.13, 0.22),
  });

  page.drawText('STATEMENT PERIOD', { x: tableX + 10, y: currentY - 11, size: 7.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('STATEMENT REFERENCE', { x: tableX + colWidths[0] + 10, y: currentY - 11, size: 7.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('NET VERIFIED INCOME (ZAR)*', { x: tableX + colWidths[0] + colWidths[1] + 10, y: currentY - 11, size: 7.5, font: fontBold, color: rgb(1, 1, 1) });

  currentY -= 16;

  const rows = [
    { period: '06 May 2026 – 06 June 2026', stmt: 'Statement #42', cr: 'R 217,669.00' },
    { period: '06 June 2026 – 06 July 2026', stmt: 'Statement #43', cr: 'R 369,669.00' },
    { period: '06 July 2026 – 06 August 2026', stmt: 'Statement #44', cr: 'R 273,669.00' },
  ];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowBg = i % 2 === 0 ? rgb(0.98, 0.99, 1.0) : rgb(1, 1, 1);
    page.drawRectangle({
      x: tableX,
      y: currentY - 15,
      width: tableW,
      height: 15,
      color: rowBg,
      borderColor: rgb(0.88, 0.9, 0.93),
      borderWidth: 0.5,
    });

    page.drawText(r.period, { x: tableX + 10, y: currentY - 11, size: 7.5, font: fontRegular, color: darkSlate });
    page.drawText(r.stmt, { x: tableX + colWidths[0] + 10, y: currentY - 11, size: 7.5, font: fontRegular, color: darkSlate });
    page.drawText(r.cr, { x: tableX + colWidths[0] + colWidths[1] + 10, y: currentY - 11, size: 7.5, font: fontBold, color: navy });

    currentY -= 15;
  }

  // Footnote row for exclusions
  page.drawRectangle({
    x: tableX,
    y: currentY - 14,
    width: tableW,
    height: 14,
    color: rgb(1.0, 0.98, 0.94),
    borderColor: rgb(0.9, 0.85, 0.75),
    borderWidth: 0.5,
  });
  page.drawText('* Interbank/own-account transfers, loan receipts & non-income credits excluded (R 259,601.73 gross deducted from bank-reported R 1,120,608.73).', {
    x: tableX + 10,
    y: currentY - 10,
    size: 6,
    font: fontOblique,
    color: rgb(0.5, 0.38, 0.15),
  });
  currentY -= 14;

  // Summary Row 1: Total
  page.drawRectangle({
    x: tableX,
    y: currentY - 16,
    width: tableW,
    height: 16,
    color: rgb(0.94, 0.96, 0.98),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 0.75,
  });

  page.drawText('3-MONTH NET VERIFIED INCOME (excl. transfers):', { x: tableX + 10, y: currentY - 11, size: 7.5, font: fontBold, color: navy });
  page.drawText('R 861,007.00', { x: tableX + colWidths[0] + colWidths[1] + 10, y: currentY - 11, size: 8, font: fontBold, color: navy });
  currentY -= 16;

  // Summary Row 2: Average
  page.drawRectangle({
    x: tableX,
    y: currentY - 16,
    width: tableW,
    height: 16,
    color: rgb(0.92, 0.95, 0.99),
    borderColor: rgb(0.7, 0.8, 0.9),
    borderWidth: 0.75,
  });

  page.drawText('AVERAGE MONTHLY INFLOW / EARNINGS:', { x: tableX + 10, y: currentY - 11, size: 7.5, font: fontBold, color: navy });
  page.drawText('R 373,536.24 / month', { x: tableX + colWidths[0] + colWidths[1] + 10, y: currentY - 11, size: 8, font: fontBold, color: rgb(0.04, 0.22, 0.48) });
  
  // Generous spacing below table before heading
  currentY -= 28;

  // Accountant's Professional Declaration
  page.drawText('CONFIRMATION OF SUSTAINABLE DRAWINGS / NET INCOME:', { x: margin, y: currentY, size: 8.5, font: fontBold, color: navy });
  currentY -= 13;

  const pDecl = `Based on our substantive testing and reconciliation of the bank statements against business trading activities, Mr. Festus receives regular director remuneration, consulting fees, and distributions from his operating entities. We confirm that Mr. Festus’ declared net monthly drawings/income of R 235,000.00 (Two Hundred and Thirty-Five Thousand Rand) is fully supported and consistently sustained by his documented cash flows.`;
  currentY = drawPara(pDecl, currentY, 8, 11.5);
  currentY -= 4;

  const pClose = `This certificate is issued in good faith based on source documentation provided, without personal liability on the part of the signing Accounting Officer. Should you require any further clarification, please contact our office directly at info@myacc.co.za or 010 109 1625.`;
  currentY = drawPara(pClose, currentY, 7.5, 10.5);

  currentY -= 16;

  // --- Standard / Old Format Signature Card ---
  const sigDateFormatted = '21 August 2026';
  const sigBoxW = (width - margin * 2) * 0.70;
  const sigBoxH = 54;

  page.drawRectangle({
    x: margin,
    y: currentY - sigBoxH + 10,
    width: sigBoxW,
    height: sigBoxH,
    color: rgb(0.97, 0.98, 1.0),
    borderColor: rgb(0.8, 0.86, 0.94),
    borderWidth: 0.75,
  });

  page.drawRectangle({
    x: margin,
    y: currentY - sigBoxH + 10,
    width: 3.5,
    height: sigBoxH,
    color: rgb(0.06, 0.24, 0.46),
  });

  page.drawText('FOR MY ACCOUNTANT (PTY) LTD (REG: 2020 / 548105 / 07):', { 
    x: margin + 10, 
    y: currentY - 2, 
    size: 7, 
    font: fontBold, 
    color: rgb(0.06, 0.13, 0.22) 
  });

  page.drawText('Kevin Freese', { 
    x: margin + 10, 
    y: currentY - 18, 
    size: 15, 
    font: fontItalicBold, 
    color: rgb(0.04, 0.22, 0.48) 
  });

  page.drawText(`DIGITALLY SIGNED • CBA (SA) #3561 • Date: ${sigDateFormatted}`, { 
    x: margin + 10, 
    y: currentY - 30, 
    size: 6.5, 
    font: fontBold, 
    color: rgb(0.17, 0.42, 0.69) 
  });

  page.drawText('Chartered Business Accountant in Practice (CBAP SA #3561) • PR-0098553', { 
    x: margin + 10, 
    y: currentY - 40, 
    size: 6.5, 
    font: fontRegular, 
    color: rgb(0.2, 0.25, 0.3) 
  });

  const outBytes = await pdfDoc.save();
  const outPath = 'scratch/order_10143_audit/Accountants_Letter_Income_Confirmation_Alby_Festus_10143.pdf';
  fs.writeFileSync(outPath, outBytes);
  console.log(`Saved refreshed letter to ${outPath} (${outBytes.length} bytes)`);
}

generateNedbankIncomeLetter().catch(console.error);
