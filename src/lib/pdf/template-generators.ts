import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Order, DocumentUpload } from '@/lib/types';

/**
 * Helper to wrap text into multiple lines given a max width and font
 */
function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Extracts business & director information from an Order's customer details and uploaded texts
 */
export function extractOrderEntityDetails(order: Order) {
  const uploads = order.documentUploads || [];
  
  // Find text inputs or metadata
  const companyNameDoc = uploads.find(u => 
    u.requirementLabel.toLowerCase().includes('company name') || 
    u.requirementLabel.toLowerCase().includes('entity name')
  );
  const regNoDoc = uploads.find(u => 
    u.requirementLabel.toLowerCase().includes('registration number') || 
    u.requirementLabel.toLowerCase().includes('cipc') ||
    u.requirementLabel.toLowerCase().includes('reg no')
  );
  const idNoDoc = uploads.find(u => 
    u.requirementLabel.toLowerCase().includes('id number') || 
    u.requirementLabel.toLowerCase().includes('identity number')
  );
  const addressDoc = uploads.find(u => 
    u.requirementLabel.toLowerCase().includes('address') || 
    u.requirementLabel.toLowerCase().includes('location')
  );

  const customerName = order.endCustomerName || order.customerName || 'Valued Client';
  const companyName = companyNameDoc?.textValue || order.endCustomerName || order.customerName || 'THE APPLICANT (PTY) LTD';
  const regNumber = regNoDoc?.textValue || '2024/000000/07';
  const idNumber = idNoDoc?.textValue || '0000000000000';
  const address = addressDoc?.textValue || '123 Commercial Road, Sandton, Johannesburg, 2196';
  const email = order.customerEmail || 'client@example.com';
  const phone = order.customerPhone || '+27 (0)11 000 0000';

  return {
    customerName,
    companyName: companyName.toUpperCase(),
    regNumber,
    idNumber,
    address,
    email,
    phone,
    serviceTitle: order.items?.[0]?.title || 'Professional Business Service',
    orderId: order.id,
    orderDate: order.date ? (order.date.toDate ? order.date.toDate().toLocaleDateString('en-ZA') : new Date(order.date).toLocaleDateString('en-ZA')) : new Date().toLocaleDateString('en-ZA'),
  };
}

/**
 * 1. Generates National Credit Regulator (NCR) Form 2 Application Draft
 */
export async function generateNcrForm2Draft(order: Order, extractedInfo?: any): Promise<{ buffer: Buffer; fileName: string }> {
  const details = { ...extractOrderEntityDetails(order), ...extractedInfo };
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const margin = 50;

  // Header Bar
  page.drawRectangle({
    x: margin,
    y: height - 90,
    width: width - margin * 2,
    height: 45,
    color: rgb(0.08, 0.15, 0.28), // Navy
  });

  page.drawText('NATIONAL CREDIT REGULATOR', {
    x: margin + 15,
    y: height - 68,
    size: 13,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('FORM NCR 2 — APPLICATION FOR REGISTRATION AS A CREDIT PROVIDER', {
    x: margin + 15,
    y: height - 82,
    size: 8,
    font: fontRegular,
    color: rgb(0.85, 0.9, 1),
  });

  // Section 1: General Information
  let currentY = height - 120;

  const drawSectionHeader = (title: string, y: number) => {
    page.drawRectangle({
      x: margin,
      y: y - 18,
      width: width - margin * 2,
      height: 22,
      color: rgb(0.94, 0.96, 0.98),
      borderColor: rgb(0.8, 0.85, 0.9),
      borderWidth: 1,
    });
    page.drawText(title, {
      x: margin + 10,
      y: y - 12,
      size: 10,
      font: fontBold,
      color: rgb(0.08, 0.15, 0.28),
    });
    return y - 32;
  };

  currentY = drawSectionHeader('PART 1: APPLICANT IDENTIFICATION & REGISTRATION', currentY);

  const drawFieldRow = (label: string, value: string, y: number) => {
    page.drawText(label, { x: margin + 10, y, size: 9, font: fontBold, color: rgb(0.2, 0.25, 0.3) });
    page.drawText(value || 'N/A', { x: margin + 200, y, size: 9, font: fontRegular, color: rgb(0.05, 0.05, 0.05) });
    page.drawLine({
      start: { x: margin + 195, y: y - 3 },
      end: { x: width - margin - 10, y: y - 3 },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    });
    return y - 22;
  };

  currentY = drawFieldRow('Registered Legal Name:', details.companyName, currentY);
  currentY = drawFieldRow('Company Registration Number:', details.regNumber, currentY);
  currentY = drawFieldRow('Trading Name (if different):', details.companyName, currentY);
  currentY = drawFieldRow('Physical Business Address:', details.address, currentY);
  currentY = drawFieldRow('Financial Year End:', '28 February', currentY);

  currentY -= 10;
  currentY = drawSectionHeader('PART 2: CONTACT & AUTHORIZED REPRESENTATIVE', currentY);
  currentY = drawFieldRow('Authorized Contact Person:', details.customerName, currentY);
  currentY = drawFieldRow('Identity Number:', details.idNumber, currentY);
  currentY = drawFieldRow('Direct Email Address:', details.email, currentY);
  currentY = drawFieldRow('Telephone / Mobile Number:', details.phone, currentY);
  currentY = drawFieldRow('Accredited Advisory Agency:', 'My Accountant (Pty) Ltd (Reg: 2020/733979/07)', currentY);

  currentY -= 10;
  currentY = drawSectionHeader('PART 3: CATEGORY & CREDIT PROVIDER METRICS', currentY);
  currentY = drawFieldRow('Category of Registration:', 'Category B (Sub-section 40(1) Credit Provider)', currentY);
  currentY = drawFieldRow('Estimated Total Credit Principal:', 'Under R5,000,000.00 threshold', currentY);
  currentY = drawFieldRow('Number of Trading Branches:', '1 (Head Office / Online Platform)', currentY);
  currentY = drawFieldRow('Statutory Submission Order ID:', `#${details.orderId}`, currentY);

  currentY -= 10;
  currentY = drawSectionHeader('PART 4: STATUTORY DECLARATION & APPLICANT SIGNOFF', currentY);

  const declarationText = 'I, the undersigned applicant/authorized representative, hereby declare that the particulars stated above and the documents submitted in support of this application are true, correct, and complete in all respects as required in terms of Section 40 of the National Credit Act, 34 of 2005.';
  const declLines = wrapText(declarationText, width - margin * 2 - 20, fontRegular, 8.5);
  for (const line of declLines) {
    page.drawText(line, { x: margin + 10, y: currentY, size: 8.5, font: fontRegular, color: rgb(0.3, 0.35, 0.4) });
    currentY -= 13;
  }

  currentY -= 25;
  // Signatures
  page.drawLine({ start: { x: margin + 10, y: currentY }, end: { x: margin + 200, y: currentY }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });
  page.drawLine({ start: { x: width - margin - 200, y: currentY }, end: { x: width - margin - 10, y: currentY }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });

  page.drawText('Signature of Authorized Director/Applicant', { x: margin + 10, y: currentY - 14, size: 8, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(`Date: ${details.orderDate}`, { x: margin + 10, y: currentY - 26, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

  page.drawText('Reviewed & Prepared by My Accountant (Pty) Ltd', { x: width - margin - 200, y: currentY - 14, size: 8, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('Accredited Regulatory Compliance Agent', { x: width - margin - 200, y: currentY - 26, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

  const pdfBytes = await pdfDoc.save();
  return {
    buffer: Buffer.from(pdfBytes),
    fileName: `NCR_Form2_Application_Draft_Order_${details.orderId}.pdf`,
  };
}

/**
 * 2. Generates Executive Special Power of Attorney & Director Resolution
 */
export async function generatePowerOfAttorneyResolutionDraft(order: Order, extractedInfo?: any): Promise<{ buffer: Buffer; fileName: string }> {
  const details = { ...extractOrderEntityDetails(order), ...extractedInfo };
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const margin = 50;

  // Title
  page.drawText('SPECIAL POWER OF ATTORNEY & RESOLUTION OF DIRECTORS', {
    x: margin,
    y: height - 70,
    size: 13,
    font: fontBold,
    color: rgb(0.08, 0.15, 0.28),
  });

  page.drawText(`IN RESPECT OF: ${details.companyName} (REG NO: ${details.regNumber})`, {
    x: margin,
    y: height - 88,
    size: 9.5,
    font: fontBold,
    color: rgb(0.85, 0.45, 0.05), // Amber
  });

  page.drawLine({
    start: { x: margin, y: height - 98 },
    end: { x: width - margin, y: height - 98 },
    thickness: 1.5,
    color: rgb(0.08, 0.15, 0.28),
  });

  let currentY = height - 125;

  const introText = `WE, the undersigned, being the duly appointed Director(s) of ${details.companyName} (Registration Number: ${details.regNumber}), having our registered principal place of business at ${details.address}:`;
  const introLines = wrapText(introText, width - margin * 2, fontRegular, 9.5);
  for (const line of introLines) {
    page.drawText(line, { x: margin, y: currentY, size: 9.5, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
    currentY -= 15;
  }

  currentY -= 10;
  page.drawText('HEREBY RESOLVE AND APPOINT:', { x: margin, y: currentY, size: 10, font: fontBold, color: rgb(0.08, 0.15, 0.28) });
  currentY -= 20;

  page.drawRectangle({
    x: margin,
    y: currentY - 35,
    width: width - margin * 2,
    height: 48,
    color: rgb(0.96, 0.97, 0.99),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
  });

  page.drawText('MY ACCOUNTANT (PTY) LTD (Registration Number: 2020/733979/07)', {
    x: margin + 12,
    y: currentY - 5,
    size: 10,
    font: fontBold,
    color: rgb(0.08, 0.15, 0.28),
  });

  page.drawText('and/or WINIFRED FREEMAN (and their nominated professional staff & consultants)', {
    x: margin + 12,
    y: currentY - 22,
    size: 9,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.4),
  });

  currentY -= 55;

  const powersText = `as our true and lawful Agent and Attorney in our name, place, and stead, to appear before the Companies and Intellectual Property Commission (CIPC), National Credit Regulator (NCR), South African Revenue Service (SARS), and any relevant regulatory and governmental authority, to sign all requisite forms, make statutory filings, lodge applications, submit declarations, and perform all lawful acts necessary to finalize ${details.serviceTitle} for Order #${details.orderId}.`;
  
  const powerLines = wrapText(powersText, width - margin * 2, fontRegular, 9.5);
  for (const line of powerLines) {
    page.drawText(line, { x: margin, y: currentY, size: 9.5, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
    currentY -= 15;
  }

  currentY -= 15;
  const ratifyText = 'We hereby ratify, allow, and confirm and promise to ratify, allow, and confirm all and whatsoever our said Agent shall lawfully do or cause to be done in and about the premises by virtue of these presents.';
  const ratLines = wrapText(ratifyText, width - margin * 2, fontRegular, 9.5);
  for (const line of ratLines) {
    page.drawText(line, { x: margin, y: currentY, size: 9.5, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
    currentY -= 15;
  }

  currentY -= 30;
  page.drawText(`SIGNED AT _____________________ ON THIS _______ DAY OF ______________ 20___`, {
    x: margin,
    y: currentY,
    size: 9,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  currentY -= 65;
  // Director Signatures table
  page.drawLine({ start: { x: margin, y: currentY }, end: { x: margin + 220, y: currentY }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });
  page.drawLine({ start: { x: width - margin - 220, y: currentY }, end: { x: width - margin, y: currentY }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });

  page.drawText(`DIRECTOR: ${details.customerName}`, { x: margin, y: currentY - 14, size: 8.5, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText(`ID NUMBER: ${details.idNumber}`, { x: margin, y: currentY - 26, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

  page.drawText('ACCEPTED BY MANDATED AGENT', { x: width - margin - 220, y: currentY - 14, size: 8.5, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText('For & On Behalf of My Accountant (Pty) Ltd', { x: width - margin - 220, y: currentY - 26, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

  const pdfBytes = await pdfDoc.save();
  return {
    buffer: Buffer.from(pdfBytes),
    fileName: `Power_of_Attorney_Resolution_Draft_Order_${details.orderId}.pdf`,
  };
}

/**
 * 3. Generates Formal Share Certificate Draft
 */
export async function generateShareCertificateDraft(order: Order, extractedInfo?: any): Promise<{ buffer: Buffer; fileName: string }> {
  const details = { ...extractOrderEntityDetails(order), ...extractedInfo };
  const pdfDoc = await PDFDocument.create();
  // Landscape A4 for Share Certificate
  const page = pdfDoc.addPage([841.89, 595.28]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const { width, height } = page.getSize();
  const margin = 40;

  // Outer Border (Navy)
  page.drawRectangle({
    x: margin,
    y: margin,
    width: width - margin * 2,
    height: height - margin * 2,
    borderColor: rgb(0.08, 0.15, 0.28),
    borderWidth: 3,
  });

  // Inner Border (Gold/Amber)
  page.drawRectangle({
    x: margin + 6,
    y: margin + 6,
    width: width - (margin + 6) * 2,
    height: height - (margin + 6) * 2,
    borderColor: rgb(0.85, 0.55, 0.1),
    borderWidth: 1.5,
  });

  // Top Bar Details
  page.drawText(`CERTIFICATE NO: SC-${details.orderId}-01`, {
    x: margin + 25,
    y: height - margin - 35,
    size: 10,
    font: fontBold,
    color: rgb(0.08, 0.15, 0.28),
  });

  page.drawText(`NUMBER OF SHARES: 100 (ONE HUNDRED)`, {
    x: width - margin - 250,
    y: height - margin - 35,
    size: 10,
    font: fontBold,
    color: rgb(0.08, 0.15, 0.28),
  });

  // Company Name Center
  const companyTitle = details.companyName;
  const compWidth = fontBold.widthOfTextAtSize(companyTitle, 18);
  page.drawText(companyTitle, {
    x: (width - compWidth) / 2,
    y: height - margin - 80,
    size: 18,
    font: fontBold,
    color: rgb(0.08, 0.15, 0.28),
  });

  const regSubtitle = `(Incorporated under the Companies Act 71 of 2008 in the Republic of South Africa)`;
  const subWidth = fontRegular.widthOfTextAtSize(regSubtitle, 9);
  page.drawText(regSubtitle, {
    x: (width - subWidth) / 2,
    y: height - margin - 98,
    size: 9,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.4),
  });

  const regNoText = `Registration Number: ${details.regNumber}`;
  const regNoWidth = fontBold.widthOfTextAtSize(regNoText, 10);
  page.drawText(regNoText, {
    x: (width - regNoWidth) / 2,
    y: height - margin - 115,
    size: 10,
    font: fontBold,
    color: rgb(0.85, 0.45, 0.05),
  });

  // Big Banner: SHARE CERTIFICATE
  const certBanner = 'SHARE CERTIFICATE';
  const certBannerWidth = fontBold.widthOfTextAtSize(certBanner, 22);
  page.drawText(certBanner, {
    x: (width - certBannerWidth) / 2,
    y: height - margin - 155,
    size: 22,
    font: fontBold,
    color: rgb(0.08, 0.15, 0.28),
  });

  // Certification Body
  let bodyY = height - margin - 195;
  const certText = `THIS IS TO CERTIFY THAT:`;
  page.drawText(certText, { x: (width - fontBold.widthOfTextAtSize(certText, 11)) / 2, y: bodyY, size: 11, font: fontBold, color: rgb(0.3, 0.35, 0.4) });

  bodyY -= 30;
  const shareholderText = `${details.customerName} (ID/Reg: ${details.idNumber})`;
  page.drawText(shareholderText, { x: (width - fontBold.widthOfTextAtSize(shareholderText, 14)) / 2, y: bodyY, size: 14, font: fontBold, color: rgb(0.08, 0.15, 0.28) });

  bodyY -= 20;
  page.drawLine({ start: { x: width / 2 - 200, y: bodyY }, end: { x: width / 2 + 200, y: bodyY }, thickness: 1, color: rgb(0.8, 0.55, 0.1) });

  bodyY -= 25;
  const textLine1 = `is the registered holder of 100 (ONE HUNDRED) Ordinary No Par Value Shares numbered 1 to 100 inclusive,`;
  page.drawText(textLine1, { x: (width - fontRegular.widthOfTextAtSize(textLine1, 10.5)) / 2, y: bodyY, size: 10.5, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });

  bodyY -= 18;
  const textLine2 = `fully paid up, in the above-named Company, subject to the Memorandum of Incorporation of the Company.`;
  page.drawText(textLine2, { x: (width - fontRegular.widthOfTextAtSize(textLine2, 10.5)) / 2, y: bodyY, size: 10.5, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });

  bodyY -= 35;
  const givenDate = `GIVEN at Johannesburg on this ${new Date().getDate()} day of ${new Date().toLocaleString('en-US', { month: 'long' })}, ${new Date().getFullYear()}`;
  page.drawText(givenDate, { x: (width - fontOblique.widthOfTextAtSize(givenDate, 9.5)) / 2, y: bodyY, size: 9.5, font: fontOblique, color: rgb(0.3, 0.35, 0.4) });

  // Signatures
  const sigY = margin + 55;
  page.drawLine({ start: { x: margin + 60, y: sigY }, end: { x: margin + 260, y: sigY }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });
  page.drawLine({ start: { x: width - margin - 260, y: sigY }, end: { x: width - margin - 60, y: sigY }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });

  page.drawText('DIRECTOR', { x: margin + 130, y: sigY - 15, size: 9, font: fontBold, color: rgb(0.08, 0.15, 0.28) });
  page.drawText('SECRETARY / AUTHORIZED SIGNATORY', { x: width - margin - 240, y: sigY - 15, size: 9, font: fontBold, color: rgb(0.08, 0.15, 0.28) });

  const pdfBytes = await pdfDoc.save();
  return {
    buffer: Buffer.from(pdfBytes),
    fileName: `Share_Certificate_Draft_Order_${details.orderId}.pdf`,
  };
}

/**
 * 4. Generates Formal Accountant's Confirmation Letter
 */
export async function generateAccountantsLetterDraft(order: Order, extractedInfo?: any): Promise<{ buffer: Buffer; fileName: string }> {
  const details = { ...extractOrderEntityDetails(order), ...extractedInfo };
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const margin = 50;

  // Header Letterhead
  page.drawText('MY ACCOUNTANT (PTY) LTD', {
    x: margin,
    y: height - 65,
    size: 14,
    font: fontBold,
    color: rgb(0.08, 0.15, 0.28),
  });

  page.drawText('Accounting • Taxation • Statutory Compliance • Advisory', {
    x: margin,
    y: height - 80,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.85, 0.45, 0.05),
  });

  page.drawText(`Email: info@myacc.co.za | Web: www.myacc.co.za | Date: ${details.orderDate}`, {
    x: margin,
    y: height - 95,
    size: 8,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.5),
  });

  page.drawLine({
    start: { x: margin, y: height - 105 },
    end: { x: width - margin, y: height - 105 },
    thickness: 1.5,
    color: rgb(0.08, 0.15, 0.28),
  });

  let currentY = height - 135;

  page.drawText('TO WHOM IT MAY CONCERN / STATUTORY REGULATORY BODIES', {
    x: margin,
    y: currentY,
    size: 9.5,
    font: fontBold,
    color: rgb(0.2, 0.25, 0.3),
  });

  currentY -= 25;
  page.drawText(`CONFIRMATION OF REGISTRATION, COMPLIANCE & ACCOUNTING MANDATE:`, {
    x: margin,
    y: currentY,
    size: 10,
    font: fontBold,
    color: rgb(0.08, 0.15, 0.28),
  });
  currentY -= 15;
  page.drawText(`CLIENT ENTITY: ${details.companyName} (REG NO: ${details.regNumber})`, {
    x: margin,
    y: currentY,
    size: 10,
    font: fontBold,
    color: rgb(0.85, 0.45, 0.05),
  });

  currentY -= 25;
  const p1 = `We confirm that My Accountant (Pty) Ltd has been formally retained as the appointed Accounting and Statutory Compliance Advisory Practice for ${details.companyName} in respect of ${details.serviceTitle} (Reference Order #${details.orderId}).`;
  const p1Lines = wrapText(p1, width - margin * 2, fontRegular, 9.5);
  for (const line of p1Lines) {
    page.drawText(line, { x: margin, y: currentY, size: 9.5, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
    currentY -= 14;
  }

  currentY -= 10;
  const p2 = `Based on our verification of the statutory documentation, CIPC records, verified proof of address, and director identification furnished by ${details.customerName}, we confirm that the entity is in good standing and duly prepared for statutory registration.`;
  const p2Lines = wrapText(p2, width - margin * 2, fontRegular, 9.5);
  for (const line of p2Lines) {
    page.drawText(line, { x: margin, y: currentY, size: 9.5, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
    currentY -= 14;
  }

  currentY -= 10;
  const p3 = `Should you require any further validation or statutory schedules regarding this application, please do not hesitate to contact our office directly at info@myacc.co.za or +27 11 000 0000.`;
  const p3Lines = wrapText(p3, width - margin * 2, fontRegular, 9.5);
  for (const line of p3Lines) {
    page.drawText(line, { x: margin, y: currentY, size: 9.5, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
    currentY -= 14;
  }

  currentY -= 35;
  page.drawText('Yours faithfully,', { x: margin, y: currentY, size: 9.5, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });

  currentY -= 45;
  page.drawLine({ start: { x: margin, y: currentY }, end: { x: margin + 200, y: currentY }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });

  page.drawText('WINIFRED FREEMAN', { x: margin, y: currentY - 14, size: 9, font: fontBold, color: rgb(0.08, 0.15, 0.28) });
  page.drawText('Practice Principal & Professional Accountant (SA)', { x: margin, y: currentY - 26, size: 8.5, font: fontRegular, color: rgb(0.3, 0.35, 0.4) });
  page.drawText('My Accountant (Pty) Ltd', { x: margin, y: currentY - 38, size: 8.5, font: fontRegular, color: rgb(0.3, 0.35, 0.4) });

  const pdfBytes = await pdfDoc.save();
  return {
    buffer: Buffer.from(pdfBytes),
    fileName: `Accountants_Confirmation_Letter_Order_${details.orderId}.pdf`,
  };
}

/**
 * 5. Generates Standard Order Intake & Verification Summary PDF
 */
export async function generateOrderIntakeSummaryPdf(order: Order, verificationSummary?: any): Promise<{ buffer: Buffer; fileName: string }> {
  const details = { ...extractOrderEntityDetails(order), ...verificationSummary };
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const margin = 50;

  // Header Bar
  page.drawRectangle({
    x: margin,
    y: height - 85,
    width: width - margin * 2,
    height: 40,
    color: rgb(0.08, 0.15, 0.28),
  });

  page.drawText(`ORDER #${details.orderId} — CLIENT INTAKE & VERIFICATION DOSSIER`, {
    x: margin + 15,
    y: height - 68,
    size: 11,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  let currentY = height - 110;

  page.drawText(`Client: ${details.customerName} | Service: ${details.serviceTitle} | Date: ${details.orderDate}`, {
    x: margin,
    y: currentY,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.5),
  });

  currentY -= 25;
  page.drawText('DOCUMENT INTAKE & AI MULTIMODAL VERIFICATION STATUS', {
    x: margin,
    y: currentY,
    size: 10,
    font: fontBold,
    color: rgb(0.08, 0.15, 0.28),
  });

  currentY -= 20;

  const uploads: DocumentUpload[] = order.documentUploads || [];
  if (uploads.length === 0) {
    page.drawText('No documents uploaded for this order yet.', { x: margin, y: currentY, size: 9, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
  } else {
    for (const doc of uploads) {
      const isApproved = doc.status === 'approved';
      const statusText = isApproved ? '[APPROVED]' : doc.status === 'rejected' ? '[REJECTED]' : '[PENDING REVIEW]';
      const statusColor = isApproved ? rgb(0.1, 0.6, 0.2) : doc.status === 'rejected' ? rgb(0.8, 0.1, 0.1) : rgb(0.85, 0.45, 0.05);

      page.drawText(statusText, { x: margin, y: currentY, size: 8.5, font: fontBold, color: statusColor });
      page.drawText(doc.requirementLabel, { x: margin + 100, y: currentY, size: 8.5, font: fontBold, color: rgb(0.1, 0.1, 0.1) });

      currentY -= 14;
      if (doc.aiVerification?.summary) {
        page.drawText(`AI Analysis: ${doc.aiVerification.summary} (${doc.aiVerification.confidence}% confidence)`, {
          x: margin + 20,
          y: currentY,
          size: 7.5,
          font: fontRegular,
          color: rgb(0.35, 0.4, 0.45),
        });
        currentY -= 12;
      }
      if (doc.notAvailableReason) {
        page.drawText(`Client Note: "${doc.notAvailableReason}"`, {
          x: margin + 20,
          y: currentY,
          size: 7.5,
          font: fontRegular,
          color: rgb(0.8, 0.4, 0.05),
        });
        currentY -= 12;
      }
      currentY -= 6;
      if (currentY < 100) break;
    }
  }

  currentY -= 20;
  page.drawText('PRE-FILLED TEMPLATES PREPARED FOR STATUTORY FILING:', {
    x: margin,
    y: currentY,
    size: 9.5,
    font: fontBold,
    color: rgb(0.08, 0.15, 0.28),
  });

  currentY -= 16;
  const templatesList = [
    '• Application Cover & Statutory Dossier',
    '• Special Power of Attorney & Director Resolution',
    '• Official Share Certificate (100 Ordinary Shares)',
    "• Accountant's Confirmation & Compliance Letter",
  ];
  for (const item of templatesList) {
    page.drawText(item, { x: margin + 10, y: currentY, size: 8.5, font: fontRegular, color: rgb(0.2, 0.25, 0.3) });
    currentY -= 13;
  }

  const pdfBytes = await pdfDoc.save();
  return {
    buffer: Buffer.from(pdfBytes),
    fileName: `Order_Intake_Verification_Summary_Order_${details.orderId}.pdf`,
  };
}

/**
 * 6. Generates SARS Public Officer Appointment & Director Resolution Draft
 */
export async function generateSarsPublicOfficerResolutionDraft(order: Order, extractedInfo?: any): Promise<{ buffer: Buffer; fileName: string }> {
  const details = { ...extractOrderEntityDetails(order), ...extractedInfo };
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const margin = 50;

  // Header Letterhead
  page.drawText('MY ACCOUNTANT (PTY) LTD', {
    x: margin,
    y: height - 60,
    size: 13,
    font: fontBold,
    color: rgb(0.08, 0.15, 0.28),
  });

  page.drawText('Statutory Compliance & SARS Tax Practitioner Practice', {
    x: margin,
    y: height - 74,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.85, 0.45, 0.05),
  });

  page.drawLine({
    start: { x: margin, y: height - 84 },
    end: { x: width - margin, y: height - 84 },
    thickness: 1.5,
    color: rgb(0.08, 0.15, 0.28),
  });

  let currentY = height - 115;

  page.drawText('DIRECTOR RESOLUTION & APPOINTMENT OF PUBLIC OFFICER', {
    x: margin,
    y: currentY,
    size: 12,
    font: fontBold,
    color: rgb(0.08, 0.15, 0.28),
  });

  currentY -= 16;
  page.drawText('IN TERMS OF SECTION 246 OF THE TAX ADMINISTRATION ACT NO. 28 OF 2011', {
    x: margin,
    y: currentY,
    size: 8.5,
    font: fontBold,
    color: rgb(0.85, 0.45, 0.05),
  });

  currentY -= 25;
  page.drawRectangle({
    x: margin,
    y: currentY - 36,
    width: width - margin * 2,
    height: 48,
    color: rgb(0.96, 0.97, 0.99),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
  });

  page.drawText(`COMPANY NAME: ${details.companyName}`, {
    x: margin + 12,
    y: currentY - 6,
    size: 9.5,
    font: fontBold,
    color: rgb(0.08, 0.15, 0.28),
  });

  page.drawText(`REGISTRATION NUMBER: ${details.regNumber} | ORDER REF: #${details.orderId}`, {
    x: margin + 12,
    y: currentY - 22,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.4),
  });

  currentY -= 55;

  const res1 = `IT WAS NOTED THAT in terms of Section 246 of the Tax Administration Act, every company carrying on business or having an office in the Republic of South Africa must at all times be represented by an individual who is a registered Public Officer / Tax Representative.`;
  const res1Lines = wrapText(res1, width - margin * 2, fontRegular, 9);
  for (const line of res1Lines) {
    page.drawText(line, { x: margin, y: currentY, size: 9, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
    currentY -= 14;
  }

  currentY -= 10;
  page.drawText('IT WAS UNANIMOUSLY RESOLVED THAT:', { x: margin, y: currentY, size: 9.5, font: fontBold, color: rgb(0.08, 0.15, 0.28) });
  currentY -= 18;

  const res2 = `1. ${details.customerName} (Identity / Passport Number: ${details.idNumber}) be and is hereby appointed as the official PUBLIC OFFICER and REGISTERED TAX REPRESENTATIVE of ${details.companyName} with the South African Revenue Service (SARS).`;
  const res2Lines = wrapText(res2, width - margin * 2, fontRegular, 9);
  for (const line of res2Lines) {
    page.drawText(line, { x: margin, y: currentY, size: 9, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
    currentY -= 14;
  }

  currentY -= 8;
  const res3 = `2. The appointed Public Officer is authorised to maintain and manage the SARS eFiling profile of the Company, sign statutory declarations, submit tax returns (Income Tax, VAT, PAYE), and attend to all tax compliance correspondence on behalf of the entity.`;
  const res3Lines = wrapText(res3, width - margin * 2, fontRegular, 9);
  for (const line of res3Lines) {
    page.drawText(line, { x: margin, y: currentY, size: 9, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
    currentY -= 14;
  }

  currentY -= 8;
  const res4 = `3. MY ACCOUNTANT (PTY) LTD (and nominated Tax Practitioners) is authorised as the mandated Tax Advisory Practice to lodge this appointment and statutory profile update with SARS.`;
  const res4Lines = wrapText(res4, width - margin * 2, fontRegular, 9);
  for (const line of res4Lines) {
    page.drawText(line, { x: margin, y: currentY, size: 9, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
    currentY -= 14;
  }

  currentY -= 25;
  page.drawText(`SIGNED AT _____________________ ON THIS _______ DAY OF ______________ 20___`, {
    x: margin,
    y: currentY,
    size: 8.5,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  currentY -= 55;
  page.drawLine({ start: { x: margin, y: currentY }, end: { x: margin + 210, y: currentY }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });
  page.drawLine({ start: { x: width - margin - 210, y: currentY }, end: { x: width - margin, y: currentY }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });

  page.drawText('SIGNATURE OF APPOINTED PUBLIC OFFICER', { x: margin, y: currentY - 14, size: 8, font: fontBold, color: rgb(0.08, 0.15, 0.28) });
  page.drawText(`Name: ${details.customerName} (ID: ${details.idNumber})`, { x: margin, y: currentY - 25, size: 7.5, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

  page.drawText('SIGNATURE OF DIRECTOR / SHAREHOLDER', { x: width - margin - 210, y: currentY - 14, size: 8, font: fontBold, color: rgb(0.08, 0.15, 0.28) });
  page.drawText('For & On Behalf of Board of Directors', { x: width - margin - 210, y: currentY - 25, size: 7.5, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

  const pdfBytes = await pdfDoc.save();
  return {
    buffer: Buffer.from(pdfBytes),
    fileName: `SARS_Public_Officer_Appointment_Resolution_Order_${details.orderId}.pdf`,
  };
}

