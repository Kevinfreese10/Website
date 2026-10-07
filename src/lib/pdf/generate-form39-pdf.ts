import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts, type RGB } from 'pdf-lib';
import {
  A4,
  COLORS,
  FIRM,
  MARGIN,
  ansi,
  drawLetterhead,
  drawKevinSignatureBlock,
  drawClientSignatureLine,
  embedFonts,
  formatDateLong,
  loadTemplateBytes,
  wrapText,
  drawParagraph,
  type Fonts
} from '../documents/helpers';

export interface Form39PdfOptions {
  entityName: string;
  cipcName: string;
  ncrNumber: string;
  cipcNumber: string;
  taxNumber: string;
  directorName: string;
  directorId: string;
  registeredAddress: string;
  postalAddress: string;
  periodStart: string;
  periodEnd: string;
  date: string;
  signed: boolean;
}

export async function generateForm39ConsolidatedPdf(opts: Form39PdfOptions): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const fonts = await embedFonts(pdf);

  const { width, height } = { width: A4[0], height: A4[1] };
  const contentW = width - MARGIN * 2;

  // Helper for running headers on subsequent pages
  function drawRunningHeader(page: PDFPage, pageNum: number, totalPages: number, title: string) {
    page.drawText(ansi(FIRM.name), { x: MARGIN, y: height - 28, size: 7.5, font: fonts.bold, color: COLORS.navy });
    page.drawText(ansi(title), { x: MARGIN + 140, y: height - 28, size: 7.5, font: fonts.regular, color: COLORS.grey });

    const pageStr = `Page ${pageNum} of ${totalPages}`;
    const pW = fonts.regular.widthOfTextAtSize(pageStr, 7.5);
    page.drawText(pageStr, { x: width - MARGIN - pW, y: height - 28, size: 7.5, font: fonts.bold, color: COLORS.blue });

    page.drawLine({
      start: { x: MARGIN, y: height - 34 },
      end: { x: width - MARGIN, y: height - 34 },
      thickness: 0.75,
      color: rgb(0.85, 0.88, 0.92),
    });
  }

  // =========================================================================
  // PAGE 1: COVER LETTER & STATUTORY NIL TRADING ATTESTATION
  // =========================================================================
  const page1 = pdf.addPage(A4);
  let y = drawLetterhead(page1, fonts);

  // Date
  page1.drawText(formatDateLong(opts.date), { x: MARGIN, y, size: 8.5, font: fonts.regular, color: COLORS.body });
  y -= 14;

  // Addressee Block
  page1.drawText('THE NATIONAL CREDIT REGULATOR (NCR)', { x: MARGIN, y, size: 8.5, font: fonts.bold, color: COLORS.navy });
  y -= 11;
  page1.drawText('Department of Registrations & Compliance', { x: MARGIN, y, size: 8, font: fonts.regular, color: COLORS.body });
  y -= 11;
  page1.drawText('127 - 15th Road, Randjespark, Midrand, 1685', { x: MARGIN, y, size: 8, font: fonts.regular, color: COLORS.body });
  y -= 11;
  page1.drawText('Email: returns@ncr.org.za / registrations@ncr.org.za', { x: MARGIN, y, size: 8, font: fonts.regular, color: COLORS.blue });
  y -= 18;

  // Document Title Banner
  const titleBoxH = 26;
  page1.drawRectangle({
    x: MARGIN,
    y: y - titleBoxH + 4,
    width: contentW,
    height: titleBoxH,
    color: rgb(0.96, 0.97, 0.99),
    borderColor: rgb(0.82, 0.88, 0.95),
    borderWidth: 0.75,
  });
  page1.drawRectangle({
    x: MARGIN,
    y: y - titleBoxH + 4,
    width: 3.5,
    height: titleBoxH,
    color: COLORS.ink,
  });
  page1.drawText('STATUTORY CONFIRMATION & COVER LETTER: NCR FORM 39 STATISTICAL RETURN (NIL RETURN)', {
    x: MARGIN + 12,
    y: y - 10,
    size: 8.5,
    font: fonts.bold,
    color: COLORS.navy,
  });
  y -= titleBoxH + 10;

  // Entity Metadata Grid
  const meta: { label: string; value: string }[] = [
    { label: 'Registered Entity Name (NCR):', value: opts.entityName },
    { label: 'Current CIPC Registered Name:', value: `${opts.cipcName} (Name updated on CIPC)` },
    { label: 'NCR Registration Number:', value: opts.ncrNumber },
    { label: 'CIPC Registration Number:', value: opts.cipcNumber },
    { label: 'SARS Income Tax Reference:', value: opts.taxNumber },
    { label: 'Reporting Period:', value: `${opts.periodStart} to ${opts.periodEnd} (Annual Return)` },
    { label: 'Active Director / Public Officer:', value: `${opts.directorName} (ID: ${opts.directorId})` },
    { label: 'Registered Business Address:', value: opts.registeredAddress },
  ];

  const tableH = meta.length * 11 + 8;
  page1.drawRectangle({
    x: MARGIN,
    y: y - tableH,
    width: contentW,
    height: tableH,
    color: rgb(0.985, 0.988, 0.995),
    borderColor: rgb(0.88, 0.91, 0.94),
    borderWidth: 0.75,
  });

  let my = y - 10;
  for (const row of meta) {
    page1.drawText(ansi(row.label), { x: MARGIN + 10, y: my, size: 7.2, font: fonts.bold, color: COLORS.body });
    page1.drawText(ansi(row.value), { x: MARGIN + 155, y: my, size: 7.2, font: fonts.regular, color: COLORS.navy });
    my -= 11;
  }
  y -= tableH + 12;

  // Attestation Paragraphs
  const paras = [
    `Dear Registrar and Compliance Division,`,
    `We act as the appointed independent Accounting Officer and compliance practitioners for ${opts.entityName} (CIPC Registration Number: ${opts.cipcNumber}, NCR Registration Number: ${opts.ncrNumber}). On behalf of the entity and its board of directors, we formally submit the completed National Credit Regulator (NCR) Form 39 Annual Statistical Return for the reporting period ${opts.periodStart} to ${opts.periodEnd}.`,
    `CERTIFICATION OF NIL TRADING AND ZERO LOANS ISSUED: We hereby formally confirm and attest that during the entire twelve (12) month reporting period from ${opts.periodStart} to ${opts.periodEnd}, the registered entity DID NOT CONDUCT ANY CREDIT PROVIDING ACTIVITIES, granted zero (0) credit facilities or transactions, entered into zero (0) credit agreements, and issued zero (0) loans to consumers or juristic persons.`,
    `Consequently, the entity holds no active credit debtors book, has recorded no credit write-offs, and has earned no credit insurance premiums or fees during the reporting period. All numerical schedules in the attached Form 39 Return are correctly rendered as Nil (R 0.00 / 0 agreements).`,
    `CIPC NAME CHANGE DISCLOSURE: Please note that the company formally registered a change of name with CIPC from "${opts.entityName}" to "${opts.cipcName}". While this name change is being updated on the NCR register, this statutory return is submitted under the primary registered name "${opts.entityName}" to ensure automated matching against NCR database records.`,
    `Should your division require any supplementary verification or audit documentation, please do not hesitate to contact our offices directly.`,
  ];

  for (let i = 0; i < paras.length; i++) {
    const isBold = i === 2; // Highlight the NIL TRADING paragraph
    y = drawParagraph(
      page1,
      paras[i],
      MARGIN,
      y,
      contentW,
      isBold ? fonts.bold : fonts.regular,
      7.8,
      isBold ? COLORS.navy : COLORS.body,
      10.8,
      true
    );
    y -= 5;
  }

  y -= 6;

  // Signatures on Page 1
  if (opts.signed) {
    y = await drawKevinSignatureBlock(pdf, page1, fonts, y, {
      signed: true,
      date: opts.date,
      forEntityLine: `FOR ${FIRM.name} (ACCOUNTING OFFICER):`,
    });
  } else {
    const boxW = contentW * 0.65;
    const boxH = 58;
    page1.drawRectangle({
      x: MARGIN,
      y: y - boxH + 10,
      width: boxW,
      height: boxH,
      color: rgb(0.97, 0.98, 1.0),
      borderColor: rgb(0.8, 0.86, 0.94),
      borderWidth: 0.75,
    });
    page1.drawRectangle({
      x: MARGIN,
      y: y - boxH + 10,
      width: 3.5,
      height: boxH,
      color: COLORS.ink,
    });
    page1.drawText(`FOR ${FIRM.name} (ACCOUNTING OFFICER):`, {
      x: MARGIN + 10,
      y: y - 2,
      size: 7,
      font: fonts.bold,
      color: COLORS.navy,
    });
    page1.drawText('Signature: ___________________________', {
      x: MARGIN + 10,
      y: y - 22,
      size: 7.5,
      font: fonts.regular,
      color: COLORS.navy,
    });
    page1.drawText(`Kevin Freese | Director | CBAP (SA) #3561`, {
      x: MARGIN + 10,
      y: y - 36,
      size: 6.8,
      font: fonts.bold,
      color: COLORS.blue,
    });
    page1.drawText(`Chartered Business Accountant in Practice - PR-0098553`, {
      x: MARGIN + 10,
      y: y - 46,
      size: 6.5,
      font: fonts.regular,
      color: COLORS.body,
    });
    y -= boxH;
  }

  y -= 14;
  page1.drawText(ansi(`CONFIRMED & ACCEPTED FOR ${opts.entityName.toUpperCase()}:`), {
    x: MARGIN,
    y,
    size: 7.5,
    font: fonts.bold,
    color: COLORS.navy,
  });
  y -= 24;
  drawClientSignatureLine(page1, fonts, y, `${opts.directorName} - Director | Date: ______________`, MARGIN, 260);

  // =========================================================================
  // PAGE 2: FORM 39 STATISTICAL RETURN - SUMMARY (PAGE 1 OF RETURN)
  // =========================================================================
  const page2 = pdf.addPage(A4);
  drawRunningHeader(page2, 2, 3, 'NCR FORM 39 STATISTICAL RETURN (SUMMARY)');

  let y2 = height - 50;

  // Header Box
  page2.drawRectangle({
    x: MARGIN,
    y: y2 - 44,
    width: contentW,
    height: 44,
    color: rgb(0.96, 0.97, 0.99),
    borderColor: rgb(0.8, 0.86, 0.94),
    borderWidth: 0.75,
  });
  page2.drawText('NATIONAL CREDIT REGULATOR • FORM 39 STATISTICAL RETURN', {
    x: MARGIN + 10,
    y: y2 - 13,
    size: 9,
    font: fonts.bold,
    color: COLORS.navy,
  });
  page2.drawText(`Entity: ${opts.entityName} | NCR Reg: ${opts.ncrNumber} | CIPC: ${opts.cipcNumber}`, {
    x: MARGIN + 10,
    y: y2 - 25,
    size: 7.2,
    font: fonts.regular,
    color: COLORS.body,
  });
  page2.drawText(`Reporting Period: ${opts.periodStart} to ${opts.periodEnd} | Compiler: Kevin Freese (Tel: 010 109 1625)`, {
    x: MARGIN + 10,
    y: y2 - 36,
    size: 7.2,
    font: fonts.regular,
    color: COLORS.grey,
  });
  y2 -= 54;

  // Table Drawing Helper
  function drawTableSection(
    title: string,
    headers: string[],
    colWidths: number[],
    rows: (string | number)[][],
    aligns: ('left' | 'right' | 'center')[] = []
  ) {
    // Section Header
    page2.drawText(ansi(title), { x: MARGIN, y: y2, size: 8, font: fonts.bold, color: COLORS.navy });
    y2 -= 12;

    const rowH = 12.5;
    const headerH = 14;

    // Header Row
    page2.drawRectangle({
      x: MARGIN,
      y: y2 - headerH + 3,
      width: contentW,
      height: headerH,
      color: rgb(0.92, 0.94, 0.97),
      borderColor: rgb(0.8, 0.85, 0.9),
      borderWidth: 0.5,
    });

    let curX = MARGIN;
    headers.forEach((h, idx) => {
      const w = colWidths[idx];
      const align = aligns[idx] || 'left';
      const textW = fonts.bold.widthOfTextAtSize(h, 6.8);
      let tx = curX + 4;
      if (align === 'right') tx = curX + w - textW - 4;
      if (align === 'center') tx = curX + (w - textW) / 2;

      page2.drawText(ansi(h), { x: tx, y: y2 - 8, size: 6.8, font: fonts.bold, color: COLORS.navy });
      curX += w;
    });
    y2 -= headerH;

    // Data Rows
    rows.forEach((row, rIdx) => {
      const isEven = rIdx % 2 === 0;
      page2.drawRectangle({
        x: MARGIN,
        y: y2 - rowH + 3,
        width: contentW,
        height: rowH,
        color: isEven ? rgb(1, 1, 1) : rgb(0.98, 0.985, 0.995),
        borderColor: rgb(0.88, 0.91, 0.94),
        borderWidth: 0.5,
      });

      let cx = MARGIN;
      row.forEach((cellVal, cIdx) => {
        const w = colWidths[cIdx];
        const align = aligns[cIdx] || 'left';
        const str = String(cellVal);
        const textW = fonts.regular.widthOfTextAtSize(str, 6.8);
        let tx = cx + 4;
        if (align === 'right') tx = cx + w - textW - 4;
        if (align === 'center') tx = cx + (w - textW) / 2;

        page2.drawText(ansi(str), { x: tx, y: y2 - 7, size: 6.8, font: fonts.regular, color: COLORS.body });
        cx += w;
      });
      y2 -= rowH;
    });
    y2 -= 8;
  }

  // Section 1.1 & 1.2
  drawTableSection(
    'SECTION 1: SUMMARY OF CREDIT AGREEMENTS (NEW AGREEMENTS & LIMIT INCREASES)',
    ['Item Ref', 'Description of Credit Activity', 'Metric / Unit', 'Reported Value (Nil)'],
    [45, 300, 75, 95.28],
    [
      ['1.1.1', 'Number of applications for credit received during reporting period', 'Volume', '0'],
      ['1.1.2', 'Number of applications for credit rejected during reporting period', 'Volume', '0'],
      ['1.2.1', 'Total Rand value of credit transactions entered into during period', 'ZAR (R)', 'R 0.00'],
      ['1.2.2', 'Total number of credit transactions entered into during period', 'Volume', '0'],
      ['1.2.3', 'Total value of credit facilities (new limit values and limit increases)', 'ZAR (R)', 'R 0.00'],
      ['1.2.4', 'Total number of credit facilities entered into (new & limit increases)', 'Volume', '0'],
    ],
    ['left', 'left', 'center', 'right']
  );

  // Section 1.3: Provincial Distribution
  drawTableSection(
    '1.3 PROVINCIAL DISTRIBUTION OF CREDIT AGREEMENTS AND FACILITIES',
    ['Province', 'Transactions (R)', 'Facilities (R)', 'Province', 'Transactions (R)', 'Facilities (R)'],
    [85, 86.76, 86.76, 85, 86.76, 85],
    [
      ['Eastern Cape', 'R 0.00', 'R 0.00', 'Mpumalanga', 'R 0.00', 'R 0.00'],
      ['Free State', 'R 0.00', 'R 0.00', 'Northern Cape', 'R 0.00', 'R 0.00'],
      ['Gauteng', 'R 0.00', 'R 0.00', 'North West', 'R 0.00', 'R 0.00'],
      ['KwaZulu-Natal', 'R 0.00', 'R 0.00', 'Western Cape', 'R 0.00', 'R 0.00'],
      ['Limpopo', 'R 0.00', 'R 0.00', 'National Total', 'R 0.00', 'R 0.00'],
    ],
    ['left', 'right', 'right', 'left', 'right', 'right']
  );

  // Section 1.4: Demographic & Socio-Economic Categories
  drawTableSection(
    '1.4 DEMOGRAPHIC & SOCIO-ECONOMIC DISTRIBUTION',
    ['Item Ref', 'Target Demographic Category', 'Number of Agreements', 'Total Rand Value (ZAR)'],
    [45, 290, 85, 95.28],
    [
      ['1.4.1', 'Applications received from Historically Disadvantaged Persons (HDPs)', '0', 'R 0.00'],
      ['1.4.2', 'Applications received from HDPs rejected', '0', 'R 0.00'],
      ['1.4.3', 'Credit agreements entered into with HDPs (Black, Coloured, Indian)', '0', 'R 0.00'],
      ['1.4.4', 'Credit agreements entered into with Low Income Persons (<= R7,500/pm)', '0', 'R 0.00'],
      ['1.4.5', 'Credit agreements entered into with Women', '0', 'R 0.00'],
      ['1.4.6', 'Credit agreements entered into with Juristic Persons', '0', 'R 0.00'],
      ['1.4.7', 'Credit agreements with residents in Rural / Low Density Areas', '0', 'R 0.00'],
      ['1.4.8', 'Credit agreements entered into with Small Businesses', '0', 'R 0.00'],
    ],
    ['left', 'left', 'center', 'right']
  );

  // Section 2: Summary of Debtors Book
  drawTableSection(
    'SECTION 2: SUMMARY OF DEBTORS BOOK (AS AT END OF REPORTING PERIOD)',
    ['Item Ref', 'Debtors Book Category / Metric', 'Pre-NCA Book (R)', 'NCA Book (R)'],
    [45, 290, 90, 90.28],
    [
      ['2.1', 'Gross value of debtors book (excluding unearned charges)', 'R 0.00', 'R 0.00'],
      ['2.2', 'Minus: Total provision for doubtful debt', 'R 0.00', 'R 0.00'],
      ['2.3', 'Equals: Net value of debtors book', 'R 0.00', 'R 0.00'],
      ['2.4', 'Number of active accounts that make up debtors book', '0', '0'],
      ['2.5', 'Rand value of write-offs during reporting period', 'R 0.00', 'R 0.00'],
      ['2.6', 'Number of accounts written-off during reporting period', '0', '0'],
    ],
    ['left', 'left', 'right', 'right']
  );

  // =========================================================================
  // PAGE 3: CREDIT CATEGORIES BREAKDOWN & STATUTORY DECLARATION (PAGE 14)
  // =========================================================================
  const page3 = pdf.addPage(A4);
  drawRunningHeader(page3, 3, 3, 'NCR FORM 39 STATISTICAL RETURN (DECLARATION)');

  let y3 = height - 50;

  // Table Drawing Helper for Page 3
  function drawTableSection3(
    title: string,
    headers: string[],
    colWidths: number[],
    rows: (string | number)[][],
    aligns: ('left' | 'right' | 'center')[] = []
  ) {
    page3.drawText(ansi(title), { x: MARGIN, y: y3, size: 8, font: fonts.bold, color: COLORS.navy });
    y3 -= 12;

    const rowH = 13;
    const headerH = 14;

    page3.drawRectangle({
      x: MARGIN,
      y: y3 - headerH + 3,
      width: contentW,
      height: headerH,
      color: rgb(0.92, 0.94, 0.97),
      borderColor: rgb(0.8, 0.85, 0.9),
      borderWidth: 0.5,
    });

    let curX = MARGIN;
    headers.forEach((h, idx) => {
      const w = colWidths[idx];
      const align = aligns[idx] || 'left';
      const textW = fonts.bold.widthOfTextAtSize(h, 6.8);
      let tx = curX + 4;
      if (align === 'right') tx = curX + w - textW - 4;
      if (align === 'center') tx = curX + (w - textW) / 2;

      page3.drawText(ansi(h), { x: tx, y: y3 - 8, size: 6.8, font: fonts.bold, color: COLORS.navy });
      curX += w;
    });
    y3 -= headerH;

    rows.forEach((row, rIdx) => {
      const isEven = rIdx % 2 === 0;
      page3.drawRectangle({
        x: MARGIN,
        y: y3 - rowH + 3,
        width: contentW,
        height: rowH,
        color: isEven ? rgb(1, 1, 1) : rgb(0.98, 0.985, 0.995),
        borderColor: rgb(0.88, 0.91, 0.94),
        borderWidth: 0.5,
      });

      let cx = MARGIN;
      row.forEach((cellVal, cIdx) => {
        const w = colWidths[cIdx];
        const align = aligns[cIdx] || 'left';
        const str = String(cellVal);
        const textW = fonts.regular.widthOfTextAtSize(str, 6.8);
        let tx = cx + 4;
        if (align === 'right') tx = cx + w - textW - 4;
        if (align === 'center') tx = cx + (w - textW) / 2;

        page3.drawText(ansi(str), { x: tx, y: y3 - 7, size: 6.8, font: fonts.regular, color: COLORS.body });
        cx += w;
      });
      y3 -= rowH;
    });
    y3 -= 10;
  }

  // Section 3: Registered Categories Nil Breakdown
  drawTableSection3(
    'SECTION 3: CREDIT PRODUCT CLASSIFICATIONS (PAGES 2 TO 10 NIL RETURN VERIFICATION)',
    ['Return Sheet', 'NCA Credit Agreement Classification', 'Agreements Granted', 'Rand Value Disbursed', 'Status'],
    [85, 205, 75, 85, 65.28],
    [
      ['Mortgages (p2)', 'Mortgage Agreements (Section 18.1)', '0', 'R 0.00', 'Nil Activity'],
      ['Facilities (p3)', 'Credit Facilities (Cards, Overdrafts, Store Limits)', '0', 'R 0.00', 'Nil Activity'],
      ['Unsecured (p4)', 'Unsecured Credit Transactions (Personal/Business)', '0', 'R 0.00', 'Nil Activity'],
      ['Short-Term (p5)', 'Short-Term Credit Transactions (<= R8,000 / <= 6 mos)', '0', 'R 0.00', 'Nil Activity'],
      ['Other (p6)', 'Other Credit Agreements (Secured vehicle/asset finance)', '0', 'R 0.00', 'Nil Activity'],
      ['Development (p7)', 'Developmental Credit Agreements', '0', 'R 0.00', 'Nil Activity'],
      ['Pawn (p8)', 'Pawn Transactions', '0', 'R 0.00', 'Nil Activity'],
      ['Insurance (p9-10)', 'Credit Life & Property/Asset Insurance', '0', 'R 0.00', 'Nil Activity'],
    ],
    ['left', 'left', 'center', 'right', 'center']
  );

  // Section 4: Declaration Information Box
  page3.drawText('SECTION 4: STATUTORY DECLARATION (FORM 39 RETURN - PAGE 14)', {
    x: MARGIN,
    y: y3,
    size: 8,
    font: fonts.bold,
    color: COLORS.navy,
  });
  y3 -= 12;

  const declMeta: { label: string; value: string }[] = [
    { label: 'Name of Registered Entity:', value: opts.entityName },
    { label: 'NCR Registration Number:', value: opts.ncrNumber },
    { label: 'DTI / CIPC Registration Number:', value: opts.cipcNumber },
    { label: 'Reporting Period:', value: `Start: ${opts.periodStart}  |  End: ${opts.periodEnd}` },
    { label: 'Number of Branches Registered with NCR:', value: '1 (One)' },
    { label: 'Person Completing Form:', value: 'Kevin Freese (Director, My Accountant)' },
    { label: 'Contact Details:', value: `Tel: 010 109 1625  |  Email: info@myacc.co.za` },
  ];

  const declTableH = declMeta.length * 11 + 6;
  page3.drawRectangle({
    x: MARGIN,
    y: y3 - declTableH,
    width: contentW,
    height: declTableH,
    color: rgb(0.985, 0.988, 0.995),
    borderColor: rgb(0.88, 0.91, 0.94),
    borderWidth: 0.75,
  });

  let dy = y3 - 10;
  for (const row of declMeta) {
    page3.drawText(ansi(row.label), { x: MARGIN + 10, y: dy, size: 7.2, font: fonts.bold, color: COLORS.body });
    page3.drawText(ansi(row.value), { x: MARGIN + 180, y: dy, size: 7.2, font: fonts.regular, color: COLORS.navy });
    dy -= 11;
  }
  y3 -= declTableH + 14;

  // Declaration Legal Text Box
  const declBoxH = 46;
  page3.drawRectangle({
    x: MARGIN,
    y: y3 - declBoxH + 4,
    width: contentW,
    height: declBoxH,
    color: rgb(0.96, 0.97, 0.99),
    borderColor: rgb(0.82, 0.88, 0.95),
    borderWidth: 0.75,
  });
  page3.drawRectangle({
    x: MARGIN,
    y: y3 - declBoxH + 4,
    width: 3.5,
    height: declBoxH,
    color: COLORS.gold,
  });

  page3.drawText('STATUTORY DECLARATION UNDER THE NATIONAL CREDIT ACT 34 OF 2005:', {
    x: MARGIN + 12,
    y: y3 - 8,
    size: 7.5,
    font: fonts.bold,
    color: COLORS.navy,
  });

  const legalText = `I am duly authorised to sign this statistical return. I declare that this return is a fair, true, and accurate representation of all credit agreements entered into by the registered entity during the reporting period, and confirm that no trade occurred, no credit facilities were granted, and no loans were issued during the reporting period.`;
  drawParagraph(page3, legalText, MARGIN + 12, y3 - 20, contentW - 20, fonts.regular, 7.3, COLORS.body, 10.5, true);

  y3 -= declBoxH + 18;

  // Signatures on Page 3
  const sigColW = (contentW - 20) / 2;

  // Left Box: Declarant Director
  page3.drawRectangle({
    x: MARGIN,
    y: y3 - 75,
    width: sigColW,
    height: 75,
    color: rgb(0.99, 0.99, 1),
    borderColor: rgb(0.85, 0.88, 0.94),
    borderWidth: 0.75,
  });
  page3.drawText('AUTHORIZED DECLARANT (DIRECTOR):', {
    x: MARGIN + 10,
    y: y3 - 12,
    size: 7,
    font: fonts.bold,
    color: COLORS.navy,
  });
  page3.drawText(`Name: ${opts.directorName}`, {
    x: MARGIN + 10,
    y: y3 - 26,
    size: 7.2,
    font: fonts.regular,
    color: COLORS.body,
  });
  page3.drawText(`Designation: Director`, {
    x: MARGIN + 10,
    y: y3 - 38,
    size: 7.2,
    font: fonts.regular,
    color: COLORS.body,
  });
  page3.drawText(`Date: ______________`, {
    x: MARGIN + 10,
    y: y3 - 50,
    size: 7.2,
    font: fonts.regular,
    color: COLORS.body,
  });
  page3.drawText(`Signature: ___________________________`, {
    x: MARGIN + 10,
    y: y3 - 64,
    size: 7,
    font: fonts.bold,
    color: COLORS.navy,
  });

  // Right Box: Accounting Officer Compiler & Certifier
  const rightX = MARGIN + sigColW + 20;
  page3.drawRectangle({
    x: rightX,
    y: y3 - 75,
    width: sigColW,
    height: 75,
    color: rgb(0.97, 0.98, 1),
    borderColor: rgb(0.8, 0.86, 0.94),
    borderWidth: 0.75,
  });
  page3.drawRectangle({
    x: rightX,
    y: y3 - 75,
    width: 3,
    height: 75,
    color: COLORS.ink,
  });
  page3.drawText('COMPILED & CERTIFIED BY ACCOUNTING OFFICER:', {
    x: rightX + 8,
    y: y3 - 12,
    size: 7,
    font: fonts.bold,
    color: COLORS.navy,
  });

  if (opts.signed) {
    try {
      const png = await pdf.embedPng(loadTemplateBytes('Signature_Kevin_New.png'));
      const h = 24;
      const w = (png.width / png.height) * h;
      page3.drawImage(png, { x: rightX + 8, y: y3 - 42, width: Math.min(w, 110), height: h });
    } catch {
      page3.drawText(FIRM.signatory, { x: rightX + 8, y: y3 - 34, size: 13, font: fonts.scriptBold, color: COLORS.ink });
    }
  } else {
    page3.drawText(`Signature: ___________________________`, {
      x: rightX + 8,
      y: y3 - 32,
      size: 7.2,
      font: fonts.regular,
      color: COLORS.navy,
    });
  }

  page3.drawText(`Kevin Freese | Director | CBAP (SA) #3561`, {
    x: rightX + 8,
    y: y3 - 52,
    size: 6.8,
    font: fonts.bold,
    color: COLORS.blue,
  });
  page3.drawText(`My Accountant (Pty) Ltd | Practice No: PR-0098553`, {
    x: rightX + 8,
    y: y3 - 62,
    size: 6.5,
    font: fonts.regular,
    color: COLORS.grey,
  });
  page3.drawText(`Date: ${opts.signed ? '05 October 2026' : '______________'}`, {
    x: rightX + 8,
    y: y3 - 71,
    size: 6.5,
    font: fonts.regular,
    color: COLORS.body,
  });

  return Buffer.from(await pdf.save());
}

async function main() {
  const options: Form39PdfOptions = {
    entityName: 'AMANGUNI FINANCIAL SERVICES (PTY) LTD',
    cipcName: 'AMANGUNI CAPITAL (PTY) LTD',
    ncrNumber: 'NCRCP19085',
    cipcNumber: '2012 / 170777 / 07',
    taxNumber: '9325990175',
    directorName: 'Nonhlanhla Khoza',
    directorId: '941110 0425 081',
    registeredAddress: '419 Kensington, 311 North Ridge Road, Morningside, Durban, KwaZulu-Natal, 4001',
    postalAddress: 'PO Box 2271, Durban, KwaZulu-Natal, 4000',
    periodStart: '01/03/2025',
    periodEnd: '28/02/2026',
    date: '2026-10-05',
    signed: false,
  };

  console.log('Generating consolidated Form 39 PDF with Cover Letter...');
  const buffer = await generateForm39ConsolidatedPdf(options);

  const destPath1 = 'C:/Users/kev/Downloads/NCR_Form_39_Amanguni_Financial_Services_NCRCP19085.pdf';
  const destPath2 = 'C:/Users/kev/Downloads/Form_39_Amanguni_Financial_Services.pdf';
  const scratchPath = 'c:/myacc/scratch/order_10248/NCR_Form_39_Submission_Pack.pdf';

  fs.writeFileSync(destPath1, buffer);
  fs.writeFileSync(destPath2, buffer);
  fs.writeFileSync(scratchPath, buffer);

  console.log(`Saved successfully!`);
  console.log(`- ${destPath1} (${buffer.length} bytes)`);
  console.log(`- ${destPath2} (${buffer.length} bytes)`);
  console.log(`- ${scratchPath} (${buffer.length} bytes)`);
}

if (require.main === module) {
  main().catch(err => {
    console.error('Error generating PDF:', err);
    process.exit(1);
  });
}
