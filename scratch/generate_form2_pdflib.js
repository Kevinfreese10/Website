const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require(path.resolve('c:/myacc/node_modules/pdf-lib'));

async function createForm2Pdf() {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const primaryColor = rgb(0.06, 0.09, 0.16); // #0f172a
  const accentColor = rgb(0.01, 0.52, 0.78);  // #0284c7
  const grayText = rgb(0.2, 0.25, 0.33);      // #334155
  const lightGray = rgb(0.85, 0.9, 0.95);
  const darkText = rgb(0.06, 0.09, 0.16);
  const greenColor = rgb(0.09, 0.64, 0.29);   // #16a34a

  // ===================== PAGE 1 =====================
  const page1 = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page1.getSize();
  const margin = 40;

  let y = height - 40;

  // Header Banner
  page1.drawRectangle({
    x: margin,
    y: y - 50,
    width: width - margin * 2,
    height: 50,
    color: rgb(0.96, 0.98, 1.0),
    borderColor: primaryColor,
    borderWidth: 1.5,
  });

  page1.drawText('NATIONAL CREDIT REGULATOR (NCR)', {
    x: margin + 15,
    y: y - 18,
    size: 13,
    font: fontBold,
    color: primaryColor,
  });

  page1.drawText('FORM NCR 2: APPLICATION FOR REGISTRATION AS A CREDIT PROVIDER', {
    x: margin + 15,
    y: y - 32,
    size: 9,
    font: fontBold,
    color: accentColor,
  });

  page1.drawText('(In terms of Section 40 of the National Credit Act, 2005 — Act No. 34 of 2005)', {
    x: margin + 15,
    y: y - 44,
    size: 7.5,
    font: fontItalic,
    color: grayText,
  });

  y -= 65;

  function drawSectionHeader(page, title, curY) {
    page.drawRectangle({
      x: margin,
      y: curY - 18,
      width: width - margin * 2,
      height: 18,
      color: primaryColor,
    });
    page.drawText(title, {
      x: margin + 8,
      y: curY - 13,
      size: 9,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    return curY - 20;
  }

  function drawTableRow(page, label, value, curY, isEven) {
    const rowH = 18;
    if (isEven) {
      page.drawRectangle({
        x: margin,
        y: curY - rowH,
        width: width - margin * 2,
        height: rowH,
        color: rgb(0.97, 0.98, 0.99),
      });
    }
    // Border bottom
    page.drawLine({
      start: { x: margin, y: curY - rowH },
      end: { x: width - margin, y: curY - rowH },
      thickness: 0.5,
      color: rgb(0.88, 0.91, 0.94),
    });
    // Vertical divider
    page.drawLine({
      start: { x: margin + 190, y: curY },
      end: { x: margin + 190, y: curY - rowH },
      thickness: 0.5,
      color: rgb(0.88, 0.91, 0.94),
    });

    page.drawText(label, {
      x: margin + 6,
      y: curY - 13,
      size: 8,
      font: fontBold,
      color: grayText,
    });

    page.drawText(value, {
      x: margin + 198,
      y: curY - 13,
      size: 8,
      font: fontRegular,
      color: darkText,
    });

    return curY - rowH;
  }

  // PART A
  y = drawSectionHeader(page1, 'PART A: APPLICANT (LEGAL ENTITY) DETAILS', y);
  y = drawTableRow(page1, '1. Registered Entity Name', 'SLATON LOANS (PTY) LTD', y, true);
  y = drawTableRow(page1, '2. Trading Name (if different)', 'Slaton Loans', y, false);
  y = drawTableRow(page1, '3. Entity Type', 'Private Company — (Pty) Ltd', y, true);
  y = drawTableRow(page1, '4. CIPC Registration Number', 'As per attached CIPC COR14.3 Certificate', y, false);
  y = drawTableRow(page1, '5. Income Tax Reference Number', 'As per attached SARS Tax Clearance Certificate', y, true);
  y = drawTableRow(page1, '6. Business Telephone Number', '060 256 8221', y, false);
  y = drawTableRow(page1, '7. Business Email Address', 'slatonloans@outlook.com', y, true);
  y = drawTableRow(page1, '8. Main Area of Operation (Province)', 'Gauteng, South Africa', y, false);
  y = drawTableRow(page1, '9. Official Language Preferences', '1st Language: English  |  2nd Language: Afrikaans', y, true);
  y = drawTableRow(page1, '10. Registered Physical Address', 'As per attached CIPC COR14.3 / Proof of Address', y, false);

  y -= 12;

  // PART B
  y = drawSectionHeader(page1, 'PART B: PRIMARY CONTACT PERSON & PREMISES', y);
  y = drawTableRow(page1, '1. Full Name of Contact Person', 'Nastasia Benton', y, true);
  y = drawTableRow(page1, '2. Capacity / Designation', 'Director / 100% Shareholder', y, false);
  y = drawTableRow(page1, '3. Contact Cellphone Number', '060 256 8221', y, true);
  y = drawTableRow(page1, '4. Contact Email Address', 'tasiabenton2804@gmail.com / slatonloans@outlook.com', y, false);
  y = drawTableRow(page1, '5. Contact Person for Premises', 'Nastasia Benton (Director)', y, true);

  y -= 12;

  // PART C
  y = drawSectionHeader(page1, 'PART C: DIRECTORS / SHAREHOLDERS DETAILS', y);
  y = drawTableRow(page1, '1. Full Legal Name', 'Nastasia Benton', y, true);
  y = drawTableRow(page1, '2. Identity / Passport Number', 'As per attached Certified ID Copy (Nastasia ID.pdf)', y, false);
  y = drawTableRow(page1, '3. Shareholding Percentage', '100% (Sole Shareholder & Director)', y, true);
  y = drawTableRow(page1, '4. Criminal Record in past 10 Years?', 'NO — Verified via attached SAPS Criminal Clearance', y, false);
  y = drawTableRow(page1, '5. Disqualified under NCA / Companies Act?', 'NO', y, true);

  // Footer Page 1
  page1.drawLine({
    start: { x: margin, y: 35 },
    end: { x: width - margin, y: 35 },
    thickness: 0.5,
    color: rgb(0.8, 0.85, 0.9),
  });
  page1.drawText('Form NCR 2 — Slaton Loans (Pty) Ltd  |  Order #10036', {
    x: margin,
    y: 22,
    size: 7.5,
    font: fontRegular,
    color: grayText,
  });
  page1.drawText('Page 1 of 2', {
    x: width - margin - 45,
    y: 22,
    size: 7.5,
    font: fontBold,
    color: grayText,
  });

  // ===================== PAGE 2 =====================
  const page2 = pdfDoc.addPage([595.28, 841.89]);
  y = height - 40;

  // Top Page 2 Header
  page2.drawText('NATIONAL CREDIT REGULATOR (NCR) — FORM NCR 2 (CONTINUED)', {
    x: margin,
    y: y - 10,
    size: 9,
    font: fontBold,
    color: primaryColor,
  });
  page2.drawLine({
    start: { x: margin, y: y - 16 },
    end: { x: width - margin, y: y - 16 },
    thickness: 1,
    color: primaryColor,
  });

  y -= 30;

  // PART D & E
  y = drawSectionHeader(page2, 'PART D & E: CREDIT BUSINESS PROFILE & STATUTORY FEES', y);
  y = drawTableRow(page2, '1. Category of Credit Agreements', 'Short-Term / Unsecured Credit Transactions (Section 39 / 40 NCA)', y, true);
  y = drawTableRow(page2, '2. Total Operational Branches', '1 Location (Head Office Premises)', y, false);
  y = drawTableRow(page2, '3. Application Fee Remitted to NCR', 'R 1,800.00 (PAID IN FULL — Ref: NoticeOfPayment NCR.pdf)', y, true);
  y = drawTableRow(page2, '4. Operational Bank Account', 'Slaton Loans (Pty) Ltd (As per Bank Confirmation Letter)', y, false);

  y -= 12;

  // PART F: Checklist
  y = drawSectionHeader(page2, 'PART F: STATUTORY ATTACHMENTS & COMPLIANCE CHECKLIST', y);

  const checklist = [
    'Annexure 1: Certified Copy of Director ID (Nastasia ID.pdf)',
    'Annexure 2: CIPC Company Registration Certificate (COR14.3)',
    'Annexure 3: Official Bank Confirmation Letter in Business Name',
    'Annexure 4: SARS Tax Clearance Status PIN / Certificate',
    'Annexure 5: Proof of Payment of R1,800 Application Fee to NCR',
    'Annexure 6: SAPS Criminal Clearance Certificate (Dated 14/08/2026)',
    'Annexure 7: Signed Share Certificate (100 Shares to Nastasia Benton)',
    'Annexure 8: Signed Board Resolution Authorizing NCR Registration',
    'Annexure 9: Signed Power of Attorney Appointing Representative',
    'Annexure 10: Signed Fee Confirmation Annexure'
  ];

  checklist.forEach((item, idx) => {
    const rowH = 15;
    if (idx % 2 === 1) {
      page2.drawRectangle({
        x: margin,
        y: y - rowH,
        width: width - margin * 2,
        height: rowH,
        color: rgb(0.97, 0.98, 0.99),
      });
    }
    page2.drawLine({
      start: { x: margin, y: y - rowH },
      end: { x: width - margin, y: y - rowH },
      thickness: 0.5,
      color: rgb(0.88, 0.91, 0.94),
    });

    page2.drawText('[ X ]', {
      x: margin + 6,
      y: y - 11,
      size: 8,
      font: fontBold,
      color: accentColor,
    });
    page2.drawText(item, {
      x: margin + 35,
      y: y - 11,
      size: 7.8,
      font: fontRegular,
      color: darkText,
    });
    page2.drawText('ATTACHED', {
      x: width - margin - 65,
      y: y - 11,
      size: 7.5,
      font: fontBold,
      color: greenColor,
    });

    y -= rowH;
  });

  y -= 14;

  // PART G: Declaration
  page2.drawRectangle({
    x: margin,
    y: y - 85,
    width: width - margin * 2,
    height: 85,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
  });

  page2.drawText('PART G: STATUTORY DECLARATION BY APPLICANT / DIRECTOR', {
    x: margin + 8,
    y: y - 14,
    size: 8.5,
    font: fontBold,
    color: primaryColor,
  });

  const declText = [
    'I, the undersigned, NASTASIA BENTON, in my capacity as Director and authorized representative of',
    'SLATON LOANS (PTY) LTD, hereby solemnly declare that: (1) All information submitted in this application',
    '(Form NCR 2) and in the supporting annexures is true, accurate, and complete in all respects; (2) The applicant',
    'entity and its director are not disqualified from registration in terms of Section 46 or Section 47 of the National',
    'Credit Act, 2005; (3) The applicant undertakes to comply fully with the National Credit Act, 2005 (Act No. 34 of',
    '2005), its Regulations, and all conditions of registration imposed by the National Credit Regulator.'
  ];

  declText.forEach((line, i) => {
    page2.drawText(line, {
      x: margin + 8,
      y: y - 28 - (i * 10),
      size: 7.5,
      font: fontRegular,
      color: darkText,
    });
  });

  y -= 110;

  // Signature lines
  page2.drawLine({
    start: { x: margin, y: y },
    end: { x: margin + 220, y: y },
    thickness: 1,
    color: primaryColor,
  });

  page2.drawLine({
    start: { x: width - margin - 220, y: y },
    end: { x: width - margin, y: y },
    thickness: 1,
    color: primaryColor,
  });

  page2.drawText('NASTASIA BENTON (Director)', {
    x: margin,
    y: y - 12,
    size: 8,
    font: fontBold,
    color: primaryColor,
  });
  page2.drawText('For and on behalf of Slaton Loans (Pty) Ltd', {
    x: margin,
    y: y - 22,
    size: 7.5,
    font: fontRegular,
    color: grayText,
  });

  page2.drawText('DATE & PLACE', {
    x: width - margin - 220,
    y: y - 12,
    size: 8,
    font: fontBold,
    color: primaryColor,
  });
  page2.drawText('Signed at Gauteng, South Africa', {
    x: width - margin - 220,
    y: y - 22,
    size: 7.5,
    font: fontRegular,
    color: grayText,
  });

  // Footer Page 2
  page2.drawLine({
    start: { x: margin, y: 35 },
    end: { x: width - margin, y: 35 },
    thickness: 0.5,
    color: rgb(0.8, 0.85, 0.9),
  });
  page2.drawText('Form NCR 2 — Slaton Loans (Pty) Ltd  |  Order #10036', {
    x: margin,
    y: 22,
    size: 7.5,
    font: fontRegular,
    color: grayText,
  });
  page2.drawText('Page 2 of 2', {
    x: width - margin - 45,
    y: 22,
    size: 7.5,
    font: fontBold,
    color: grayText,
  });

  const pdfBytes = await pdfDoc.save();
  const outputPath = 'c:/myacc/scratch/Slaton_Loans_NCR_Form_2_Draft.pdf';
  const publicPath = 'c:/myacc/public/Slaton_Loans_NCR_Form_2_Draft.pdf';

  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`✅ Form 2 PDF generated successfully at: ${outputPath} (${pdfBytes.length} bytes)`);

  try {
    fs.writeFileSync(publicPath, pdfBytes);
    console.log(`✅ Copied to public web path: ${publicPath}`);
  } catch (e) {}
}

createForm2Pdf().catch(console.error);
