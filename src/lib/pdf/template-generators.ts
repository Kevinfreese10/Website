import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Order, DocumentUpload } from '@/lib/types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Helper to wrap text into multiple lines given a max width and font
 */
export function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  const words = text.split(/\s+/);
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
 * Helper to render justified or wrapped text blocks.
 * For all lines except the last in a paragraph, words are spaced evenly across target width.
 */
export function drawJustifiedParagraph(
  page: any,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  font: any,
  fontSize: number,
  color: any,
  lineHeight: number = 13
): number {
  const words = text.trim().split(/\s+/);
  if (words.length === 0) return y;

  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentWidth = 0;

  for (const word of words) {
    const wordWidth = font.widthOfTextAtSize(word, fontSize);
    const spaceWidth = font.widthOfTextAtSize(' ', fontSize);
    const testWidth = currentLine.length === 0 ? wordWidth : currentWidth + spaceWidth + wordWidth;

    if (testWidth <= maxWidth) {
      currentLine.push(word);
      currentWidth = testWidth;
    } else {
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }
      currentLine = [word];
      currentWidth = wordWidth;
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  let currentY = y;

  for (let i = 0; i < lines.length; i++) {
    const lineWords = lines[i];
    const isLastLine = i === lines.length - 1;

    if (isLastLine || lineWords.length === 1) {
      // Left-align last line or single word
      page.drawText(lineWords.join(' '), {
        x,
        y: currentY,
        size: fontSize,
        font,
        color,
      });
    } else {
      // Justify across maxWidth
      const wordsTotalWidth = lineWords.reduce((sum, w) => sum + font.widthOfTextAtSize(w, fontSize), 0);
      const totalAvailableSpace = maxWidth - wordsTotalWidth;
      const spaceBetweenWords = totalAvailableSpace / (lineWords.length - 1);

      let wordX = x;
      for (let j = 0; j < lineWords.length; j++) {
        const w = lineWords[j];
        page.drawText(w, {
          x: wordX,
          y: currentY,
          size: fontSize,
          font,
          color,
        });
        wordX += font.widthOfTextAtSize(w, fontSize) + spaceBetweenWords;
      }
    }
    currentY -= lineHeight;
  }

  return currentY;
}

/**
 * Extracts business & director information from an Order's customer details and uploaded texts
 */
export function extractOrderEntityDetails(order: Order) {
  const uploads = order.documentUploads || [];
  
  // Look for any AI verified extracted data across uploads
  let aiExtractedCompany = '';
  let aiExtractedReg = '';
  let aiExtractedAddress = '';
  let aiExtractedDirector = '';
  let aiExtractedId = '';
  let aiExtractedTax = '';

  for (const u of uploads) {
    const ext = (u as any).aiVerification?.extractedData;
    if (ext) {
      if (ext.companyName || ext.enterpriseName) aiExtractedCompany = ext.companyName || ext.enterpriseName;
      if (ext.registrationNumber || ext.regNumber) aiExtractedReg = ext.registrationNumber || ext.regNumber;
      if (ext.registeredAddress || ext.address) aiExtractedAddress = ext.registeredAddress || ext.address;
      if (ext.directorName || ext.director || ext.directors?.[0]?.name) aiExtractedDirector = ext.directorName || ext.director || ext.directors?.[0]?.name;
      if (ext.idNumber || ext.directors?.[0]?.idNumber) aiExtractedId = ext.idNumber || ext.directors?.[0]?.idNumber;
      if (ext.taxNumber || ext.incomeTaxNumber) aiExtractedTax = ext.taxNumber || ext.incomeTaxNumber;
    }
  }

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
  const taxNoDoc = uploads.find(u => 
    u.requirementLabel.toLowerCase().includes('tax') || 
    u.requirementLabel.toLowerCase().includes('sars')
  );

  const customerName = aiExtractedDirector || (order as any).companyRepresentative || order.endCustomerName || order.customerName || '';
  const companyName = companyNameDoc?.textValue || (order as any).companyName || (order as any).businessName || aiExtractedCompany || order.endCustomerName || order.customerName || '';
  const regNumber = regNoDoc?.textValue || (order as any).registrationNumber || (order as any).companyRegistrationNumber || aiExtractedReg || '';
  const idNumber = idNoDoc?.textValue || (order as any).idNumber || aiExtractedId || '';
  const address = addressDoc?.textValue || (order as any).companyAddress || (order as any).address || aiExtractedAddress || '';
  const taxNumber = taxNoDoc?.textValue || (order as any).taxNumber || aiExtractedTax || '';
  const email = order.endCustomerEmail || order.customerEmail || '';
  const phone = order.endCustomerPhone || order.customerPhone || '';

  return {
    customerName,
    companyName: companyName.toUpperCase(),
    regNumber,
    idNumber,
    address,
    taxNumber,
    email,
    phone,
    serviceTitle: order.items?.[0]?.title || 'Professional Business Service',
    orderId: order.id,
    orderDate: order.date ? (order.date.toDate ? order.date.toDate().toLocaleDateString('en-ZA') : new Date(order.date).toLocaleDateString('en-ZA')) : new Date().toLocaleDateString('en-ZA'),
  };
}

/**
 * Validates that all required statutory fields exist before generating official regulatory documents.
 * Throws a descriptive error instead of silently substituting fake or placeholder data.
 */
export function validateStatutoryPrerequisites(
  details: ReturnType<typeof extractOrderEntityDetails>,
  requiredFields: (keyof ReturnType<typeof extractOrderEntityDetails>)[],
  documentType: string
) {
  const missing = requiredFields.filter(f => !details[f] || (typeof details[f] === 'string' && !details[f].trim()));
  if (missing.length > 0) {
    const fieldLabels: Record<string, string> = {
      customerName: 'Director / Representative Full Name',
      companyName: 'Company / Enterprise Legal Name',
      regNumber: 'CIPC Registration Number',
      idNumber: 'South African ID / Passport Number',
      address: 'Physical Registered Address',
      taxNumber: 'SARS Tax Reference Number',
      email: 'Contact Email Address',
      phone: 'Contact Phone Number',
    };
    const missingLabels = missing.map(m => fieldLabels[m as string] || m);
    throw new Error(`Cannot generate official ${documentType}: Missing essential statutory details (${missingLabels.join(', ')}). Please provide or request these details before drafting.`);
  }
}

/**
 * Common Header for My Accountant Official Documents
 */
export function drawMyAccHeader(page: any, width: number, height: number, fontBold: any, fontRegular: any) {
  const margin = 40;
  
  // Brand Header
  page.drawText('MY ACCOUNTANT (PTY) LTD', {
    x: margin,
    y: height - 38,
    size: 14,
    font: fontBold,
    color: rgb(0.06, 0.13, 0.22), // #0F2137
  });

  page.drawText('REGISTRATION NUMBER: 2020 / 548105 / 07', {
    x: margin,
    y: height - 48,
    size: 6.5,
    font: fontBold,
    color: rgb(0.44, 0.5, 0.59),
  });

  page.drawText('ACCOUNTING • PAYROLL • TAX • ADVISORY', {
    x: margin,
    y: height - 57,
    size: 6.5,
    font: fontBold,
    color: rgb(0.77, 0.63, 0.35), // #C5A059 Gold
  });

  // Practice Details (Right aligned)
  const contactText = 'Ground Floor, Waterstone Building, Stonemill Office Park\n300 Acacia Road, Darrenwood, Johannesburg, 2195\nTel: 010 109 1625 | Email: info@myacc.co.za | Web: www.myacc.co.za';
  const contactLines = contactText.split('\n');
  let cy = height - 38;
  for (const cl of contactLines) {
    const textW = fontRegular.widthOfTextAtSize(cl, 7.2);
    page.drawText(cl, {
      x: width - margin - textW,
      y: cy,
      size: 7.2,
      font: fontRegular,
      color: rgb(0.44, 0.5, 0.59),
    });
    cy -= 9.5;
  }

  // Gold dividing line
  page.drawLine({
    start: { x: margin, y: height - 68 },
    end: { x: width - margin, y: height - 68 },
    thickness: 1.5,
    color: rgb(0.77, 0.63, 0.35),
  });
}

/**
 * 1. NCR Form 2 — Statutory Application for Registration as a Credit Provider
 * Always uses the official NCR Form 2 fillable template (C:\Users\kev\Downloads\NCR_Form_2_Fillable.pdf or public/templates/NCR_Form_2_Fillable.pdf)
 */
export async function generateNcrForm2Draft(order: Order, extractedInfo?: any): Promise<{ buffer: Buffer; fileName: string }> {
  const details = { ...extractOrderEntityDetails(order), ...extractedInfo };
  validateStatutoryPrerequisites(details, ['companyName', 'customerName', 'idNumber'], 'NCR Form 2 Application');

  const possibleTemplatePaths = [
    path.join(process.cwd(), 'public/templates/NCR_Form_2_Fillable.pdf'),
    'C:\\Users\\kev\\Downloads\\NCR_Form_2_Fillable.pdf',
  ];

  let templateBytes: Buffer | null = null;
  for (const p of possibleTemplatePaths) {
    if (fs.existsSync(p)) {
      templateBytes = fs.readFileSync(p);
      break;
    }
  }

  if (!templateBytes) {
    throw new Error('Official NCR Form 2 Fillable template not found.');
  }

  const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();

  const setField = (name: string, val: string) => {
    try {
      const field = form.getTextField(name);
      if (field && val) field.setText(String(val));
    } catch (e) {}
  };

  const checkField = (name: string) => {
    try {
      const field = form.getCheckBox(name);
      if (field) field.check();
    } catch (e) {}
  };

  // Part 1: Applicant & Entity Details
  setField('p1_applicant_name', details.companyName);
  setField('p1_trading_name', details.companyName);
  setField('p1_reg_number', details.regNumber);
  setField('p1_cipc_reg_date', details.orderDate);
  
  const addressParts = (details.address || '').split(',').map((s: string) => s.trim());
  setField('p1_physical_address_line1', addressParts[0] || details.address);
  setField('p1_physical_address_line2', addressParts[1] || '');
  setField('p1_physical_address_line3_city', addressParts[2] || 'South Africa');
  setField('p1_physical_postal_code', addressParts[addressParts.length - 1] || '');

  setField('p1_postal_address_line1', addressParts[0] || details.address);
  setField('p1_postal_address_line2', addressParts[1] || '');
  setField('p1_postal_address_line3_city', addressParts[2] || 'South Africa');
  setField('p1_postal_code', addressParts[addressParts.length - 1] || '');

  setField('p1_telephone_number', details.phone || '010 109 1625');
  setField('p1_email_address', details.email || 'info@myacc.co.za');

  // Part 2: Contact Person & Auditor Details
  const nameParts = (details.customerName || '').split(' ');
  setField('p2_contact_name', nameParts.slice(0, -1).join(' ') || details.customerName);
  setField('p2_contact_surname', nameParts[nameParts.length - 1] || details.customerName);
  setField('p2_contact_cell_number', details.phone || '');
  setField('p2_contact_email', details.email || '');

  // Designated Accounting Officer: My Accountant (Pty) Ltd / Kevin Freese CBA (SA) #3561
  setField('p2_auditor_firm_name', 'My Accountant (Pty) Ltd');
  setField('p2_auditor_individual_name', 'Kevin Freese');
  setField('p2_auditor_physical_address_line1', 'Ground Floor, Waterstone Building, Stonemill Office Park');
  setField('p2_auditor_physical_address_line2', '300 Acacia Road, Darrenwood');
  setField('p2_auditor_physical_city', 'Johannesburg');
  setField('p2_auditor_physical_postal_code', '2195');
  setField('p2_auditor_postal_address_line1', 'Ground Floor, Waterstone Building, Stonemill Office Park');
  setField('p2_auditor_postal_address_line2', '300 Acacia Road, Darrenwood');
  setField('p2_auditor_postal_city', 'Johannesburg');
  setField('p2_auditor_postal_code', '2195');
  setField('p2_auditor_tel_number', '010 109 1625');
  setField('p2_auditor_email', 'info@myacc.co.za');
  setField('p2_auditor_practice_number', 'CIBA CBAP SA #3561 / PR-0098553');
  setField('p2_auditor_professional_body', 'Chartered Institute of Business Accountants (CIBA / SAIBA)');

  checkField('p2_product_unsecured_credit');
  checkField('p2_product_developmental_credit');

  // Part 3: Official Languages & BBBEE
  setField('p3_language_area1_desc', addressParts[2] || 'Head Office Region');
  setField('p3_language_area1_lang1', 'English');
  setField('p3_language_area1_lang2', 'Sepedi');

  // Part 4: Regulatory Disqualifications (all default to No)
  checkField('p4_control_credit_bureau_no');
  checkField('p4_control_debt_collection_no');
  checkField('p4_control_adr_agent_no');
  checkField('p4_control_credit_repair_no');

  setField('p4_premises_total_count', '1');
  setField('p4_premises_normal_credit_count', '1');
  setField('p4_premise1_trading_name', details.companyName);
  setField('p4_premise1_address_line1', addressParts[0] || details.address);
  setField('p4_premise1_city', addressParts[1] ? `${addressParts[1]}, ${addressParts[2] || ''}` : details.address);
  setField('p4_premise1_postal_code', addressParts[addressParts.length - 1] || '');
  setField('p4_premise1_contact_person', details.customerName);
  setField('p4_premise1_tel_number', details.phone || '');
  setField('p4_premise1_email', details.email || '');

  // Part 5: Representative declaration
  setField('p5_rep_name', details.customerName);
  setField('p5_rep_capacity', 'Director');
  setField('p5_rep_date', details.orderDate);

  // Part 6 & 7: Natural Person Disqualifications
  setField('p6_person_name', details.customerName);
  setField('p6_person_id_number', details.idNumber);
  setField('p6_person_date', details.orderDate);

  checkField('p6_q1_gambling_register_no');
  checkField('p6_q2_mentally_unfit_no');
  checkField('p6_q3_misconduct_removal_no');
  checkField('p6_q4_deregistered_entity_no');
  checkField('p6_q5_disrepute_entity_no');
  checkField('p6_q6_disregard_consumer_rights_no');
  checkField('p6_q7_fraud_conviction_no');
  checkField('p6_q8_violence_conviction_no');
  checkField('p7_q9_nca_offence_no');
  checkField('p7_q10_saps_permission_yes');
  setField('p7_cert_date', details.orderDate);

  const pdfBytes = await pdfDoc.save();
  return {
    buffer: Buffer.from(pdfBytes),
    fileName: `NCR_Form_2_Application_Draft_${details.orderId}.pdf`,
  };
}

/**
 * 2. NCR Director Resolution & Mandate
 */
export async function generateNcrDirectorResolutionDraft(order: Order, extractedInfo?: any): Promise<{ buffer: Buffer; fileName: string }> {
  const details = { ...extractOrderEntityDetails(order), ...extractedInfo };
  validateStatutoryPrerequisites(details, ['companyName', 'customerName'], 'NCR Director Resolution');
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const margin = 45;

  let currentY = height - 55;

  // Title Header
  const resTitle = 'RESOLUTION OF THE BOARD OF DIRECTORS';
  const titleW = fontBold.widthOfTextAtSize(resTitle, 14);
  page.drawText(resTitle, {
    x: (width - titleW) / 2,
    y: currentY,
    size: 14,
    font: fontBold,
    color: rgb(0.06, 0.13, 0.22),
  });

  currentY -= 16;
  const subTitle = 'IN TERMS OF THE COMPANIES ACT 71 OF 2008 & NATIONAL CREDIT ACT 34 OF 2005';
  const subW = fontBold.widthOfTextAtSize(subTitle, 8);
  page.drawText(subTitle, {
    x: (width - subW) / 2,
    y: currentY,
    size: 8,
    font: fontBold,
    color: rgb(0.77, 0.63, 0.35),
  });

  currentY -= 20;

  // Entity Details Box
  page.drawRectangle({
    x: margin,
    y: currentY - 32,
    width: width - margin * 2,
    height: 34,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 1,
  });

  page.drawText(`ENTITY: ${details.companyName}`, {
    x: margin + 12,
    y: currentY - 12,
    size: 9,
    font: fontBold,
    color: rgb(0.06, 0.13, 0.22),
  });

  page.drawText(`REGISTRATION NUMBER: ${details.regNumber} | REGISTERED OFFICE: ${details.address}`, {
    x: margin + 12,
    y: currentY - 24,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.4),
  });

  currentY -= 48;

  const meetingText = `Resolution of the Directors of ${details.companyName} taken at Johannesburg on the ${new Date().getDate()} day of ${new Date().toLocaleString('en-US', { month: 'long' })}, ${new Date().getFullYear()}.`;
  currentY = drawJustifiedParagraph(page, meetingText, margin, currentY, width - margin * 2, fontRegular, 8.5, rgb(0.2, 0.25, 0.3), 12);

  currentY -= 8;
  page.drawText('IT WAS UNANIMOUSLY RESOLVED THAT:', { x: margin, y: currentY, size: 9.5, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
  currentY -= 16;

  const clauses = [
    `1. APPLICATION FOR REGISTRATION: The entity ${details.companyName} applies to the National Credit Regulator (NCR) for formal registration as a Credit Provider in terms of Section 40 of the National Credit Act, Act 34 of 2005.`,
    `2. APPOINTMENT OF AUTHORISED SIGNATORY: ${details.customerName} (Identity Number: ${details.idNumber}) is hereby authorized by the entity to sign all statutory NCR documentation (including Form NCR 2, Annexure of Fees, Share Certificates, and statutory declarations) and to take all necessary actions to give effect to this application.`,
    `3. APPOINTMENT OF MANDATED ACCOUNTING OFFICER: MY ACCOUNTANT (PTY) LTD (Practice No: CIBA #3561) is appointed as the mandated Accounting Officer and Compliance Representative to compile, audit, and lodge this application with the NCR and attend to all regulatory liaison.`,
  ];

  for (const clause of clauses) {
    currentY = drawJustifiedParagraph(page, clause, margin, currentY, width - margin * 2, fontRegular, 8.5, rgb(0.18, 0.22, 0.28), 12.5);
    currentY -= 6;
  }

  currentY -= 12;
  page.drawText(`DATED AND SIGNED AT _____________________ ON THIS _______ DAY OF ______________ 20___`, {
    x: margin,
    y: currentY,
    size: 8.5,
    font: fontBold,
    color: rgb(0.06, 0.13, 0.22),
  });

  currentY -= 20;

  // Signature Blocks
  const boxW = (width - margin * 2 - 20) / 2;

  // Signatory Box
  page.drawRectangle({
    x: margin,
    y: currentY - 80,
    width: boxW,
    height: 80,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
  });

  page.drawText('AUTHORIZED DIRECTOR / SIGNATORY:', { x: margin + 10, y: currentY - 12, size: 7.5, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
  page.drawRectangle({
    x: margin + 10,
    y: currentY - 48,
    width: boxW - 20,
    height: 30,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.7, 0.75, 0.8),
    borderWidth: 0.5,
  });
  page.drawText('× SIGN HERE ×', { x: margin + boxW / 2 - 28, y: currentY - 34, size: 7.5, font: fontBold, color: rgb(0.6, 0.65, 0.7) });
  page.drawText(`Name: ${details.customerName}`, { x: margin + 10, y: currentY - 60, size: 7.5, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
  page.drawText(`Capacity: Director | Date: ${details.orderDate}`, { x: margin + 10, y: currentY - 70, size: 7, font: fontRegular, color: rgb(0.4, 0.45, 0.5) });

  // Co-Director / Witness Box
  const coX = margin + boxW + 20;
  page.drawRectangle({
    x: coX,
    y: currentY - 80,
    width: boxW,
    height: 80,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
  });

  page.drawText('CO-DIRECTOR / SECRETARY / WITNESS:', { x: coX + 10, y: currentY - 12, size: 7.5, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
  page.drawRectangle({
    x: coX + 10,
    y: currentY - 48,
    width: boxW - 20,
    height: 30,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.7, 0.75, 0.8),
    borderWidth: 0.5,
  });
  page.drawText('× SIGN HERE ×', { x: coX + boxW / 2 - 28, y: currentY - 34, size: 7.5, font: fontBold, color: rgb(0.6, 0.65, 0.7) });
  page.drawText('Name: ___________________________', { x: coX + 10, y: currentY - 60, size: 7.5, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
  page.drawText('Capacity: Co-Director / Secretary | Date: ________', { x: coX + 10, y: currentY - 70, size: 7, font: fontRegular, color: rgb(0.4, 0.45, 0.5) });

  const pdfBytes = await pdfDoc.save();
  return {
    buffer: Buffer.from(pdfBytes),
    fileName: `NCR_Director_Resolution_Draft_${details.orderId}.pdf`,
  };
}

/**
 * 3. NCR Annexure: Confirmation of Payment of Fees
 * Always uses the official fillable template (C:\Users\kev\Downloads\NCR_Annexure_Confirmation_of_Fees_Fillable.pdf or public/templates/NCR_Annexure_Confirmation_of_Fees_Fillable.pdf)
 */
export async function generateNcrAnnexureFeesDraft(order: Order, extractedInfo?: any): Promise<{ buffer: Buffer; fileName: string }> {
  const details = { ...extractOrderEntityDetails(order), ...extractedInfo };

  const possibleTemplatePaths = [
    path.join(process.cwd(), 'public/templates/NCR_Annexure_Confirmation_of_Fees_Fillable.pdf'),
    'C:\\Users\\kev\\Downloads\\NCR_Annexure_Confirmation_of_Fees_Fillable.pdf',
  ];

  let templateBytes: Buffer | null = null;
  for (const p of possibleTemplatePaths) {
    if (fs.existsSync(p)) {
      templateBytes = fs.readFileSync(p);
      break;
    }
  }

  if (!templateBytes) {
    throw new Error('Official NCR Annexure Confirmation of Fees Fillable template not found.');
  }

  const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();

  const setField = (name: string, val: string) => {
    try {
      const field = form.getTextField(name);
      if (field && val) field.setText(String(val));
    } catch (e) {}
  };

  setField('credit_provider_name', details.companyName);
  setField('application_number', details.orderId ? `APP-${details.orderId}` : '-');
  setField('application_date', details.orderDate);
  setField('contact_person_name', details.customerName);
  setField('contact_telephone_number', details.phone || '');
  setField('amount_paid_rands', 'R 1,800.00');

  try {
    form.getCheckBox('pay_method_electronic_transfer').check();
  } catch (e) {}

  setField('fee_application_amount', 'R 550.00');
  setField('fee_principal_debt_date', details.orderDate);
  setField('fee_principal_debt_amount', 'R 0.00');
  setField('fee_initial_reg_amount', 'R 1,250.00');
  setField('fee_branches_count', '1');
  setField('fee_branches_amount', 'R 0.00');
  setField('fee_total_amount', 'R 1,800.00');

  setField('declaration_date', details.orderDate);
  setField('representative_name', details.customerName);
  setField('representative_designation', 'Director');

  const pdfBytes = await pdfDoc.save();
  return {
    buffer: Buffer.from(pdfBytes),
    fileName: `NCR_Annexure_Confirmation_of_Fees_${details.orderId}.pdf`,
  };
}

/**
 * 4. Official Company Share Certificate (Classical Executive Layout)
 */
export async function generateShareCertificateDraft(order: Order, extractedInfo?: any): Promise<{ buffer: Buffer; fileName: string }> {
  const details = { ...extractOrderEntityDetails(order), ...extractedInfo };
  validateStatutoryPrerequisites(details, ['companyName', 'customerName'], 'Share Certificate');
  const pdfDoc = await PDFDocument.create();
  // Landscape A4 for Share Certificate
  const page = pdfDoc.addPage([841.89, 595.28]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const { width, height } = page.getSize();
  const margin = 35;

  // Outer Border (Navy)
  page.drawRectangle({
    x: margin,
    y: margin,
    width: width - margin * 2,
    height: height - margin * 2,
    borderColor: rgb(0.06, 0.13, 0.22),
    borderWidth: 3.5,
  });

  // Inner Border (Gold/Amber)
  page.drawRectangle({
    x: margin + 6,
    y: margin + 6,
    width: width - (margin + 6) * 2,
    height: height - (margin + 6) * 2,
    borderColor: rgb(0.77, 0.63, 0.35),
    borderWidth: 1.5,
  });

  // Top Corner Header Details
  page.drawText(`Certificate No. 1`, {
    x: margin + 25,
    y: height - margin - 35,
    size: 11,
    font: fontBold,
    color: rgb(0.06, 0.13, 0.22),
  });

  page.drawText(`No of Shares: 100`, {
    x: width - margin - 150,
    y: height - margin - 35,
    size: 11,
    font: fontBold,
    color: rgb(0.06, 0.13, 0.22),
  });

  // Company Name Center
  const companyTitle = details.companyName;
  const compWidth = fontBold.widthOfTextAtSize(companyTitle, 20);
  page.drawText(companyTitle, {
    x: (width - compWidth) / 2,
    y: height - margin - 75,
    size: 20,
    font: fontBold,
    color: rgb(0.06, 0.13, 0.22),
  });

  const regNoText = `(Registration Number: ${details.regNumber})`;
  const regNoWidth = fontBold.widthOfTextAtSize(regNoText, 10);
  page.drawText(regNoText, {
    x: (width - regNoWidth) / 2,
    y: height - margin - 95,
    size: 10,
    font: fontBold,
    color: rgb(0.77, 0.63, 0.35),
  });

  const regSubtitle = `(Incorporated under the Companies Act 71 of 2008 in the Republic of South Africa)`;
  const subWidth = fontRegular.widthOfTextAtSize(regSubtitle, 9);
  page.drawText(regSubtitle, {
    x: (width - subWidth) / 2,
    y: height - margin - 110,
    size: 9,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.4),
  });

  // Central Title: SHARE CERTIFICATE
  const certBanner = 'SHARE CERTIFICATE';
  const certBannerWidth = fontBold.widthOfTextAtSize(certBanner, 22);
  page.drawText(certBanner, {
    x: (width - certBannerWidth) / 2,
    y: height - margin - 148,
    size: 22,
    font: fontBold,
    color: rgb(0.06, 0.13, 0.22),
  });

  // Certification Body
  let bodyY = height - margin - 185;
  const certText = `THIS IS TO CERTIFY THAT:`;
  page.drawText(certText, { x: (width - fontBold.widthOfTextAtSize(certText, 11)) / 2, y: bodyY, size: 11, font: fontBold, color: rgb(0.3, 0.35, 0.4) });

  bodyY -= 26;
  const shareholderText = `${details.customerName} (ID No: ${details.idNumber})`;
  page.drawText(shareholderText, { x: (width - fontBold.widthOfTextAtSize(shareholderText, 14)) / 2, y: bodyY, size: 14, font: fontBold, color: rgb(0.06, 0.13, 0.22) });

  bodyY -= 16;
  const addressText = `Of: ${details.address}`;
  page.drawText(addressText, { x: (width - fontRegular.widthOfTextAtSize(addressText, 9.5)) / 2, y: bodyY, size: 9.5, font: fontRegular, color: rgb(0.3, 0.35, 0.4) });

  bodyY -= 18;
  page.drawLine({ start: { x: width / 2 - 220, y: bodyY }, end: { x: width / 2 + 220, y: bodyY }, thickness: 1, color: rgb(0.77, 0.63, 0.35) });

  bodyY -= 26;
  const textLine1 = `is the registered holder of ONE HUNDRED (100) ORDINARY SHARES of no-par value in the above-named Company,`;
  page.drawText(textLine1, { x: (width - fontRegular.widthOfTextAtSize(textLine1, 10.5)) / 2, y: bodyY, size: 10.5, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });

  bodyY -= 18;
  const textLine2 = `fully paid up, subject to the Memorandum of Incorporation and the rules of the Company.`;
  page.drawText(textLine2, { x: (width - fontRegular.widthOfTextAtSize(textLine2, 10.5)) / 2, y: bodyY, size: 10.5, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });

  bodyY -= 32;
  const givenDate = `GIVEN at Johannesburg on this ${new Date().getDate()} day of ${new Date().toLocaleString('en-US', { month: 'long' })}, ${new Date().getFullYear()}`;
  page.drawText(givenDate, { x: (width - fontOblique.widthOfTextAtSize(givenDate, 9.5)) / 2, y: bodyY, size: 9.5, font: fontOblique, color: rgb(0.3, 0.35, 0.4) });

  // Signatures
  const sigY = margin + 55;
  page.drawLine({ start: { x: margin + 60, y: sigY }, end: { x: margin + 260, y: sigY }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });
  page.drawLine({ start: { x: width - margin - 260, y: sigY }, end: { x: width - margin - 60, y: sigY }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });

  page.drawText('DIRECTOR', { x: margin + 130, y: sigY - 16, size: 9, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
  page.drawText('(Both signatures required / Sign in capacity)', { x: margin + 80, y: sigY - 26, size: 6.5, font: fontRegular, color: rgb(0.4, 0.45, 0.5) });

  page.drawText('SECRETARY / CO-DIRECTOR', { x: width - margin - 225, y: sigY - 16, size: 9, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
  page.drawText('(If no secretary, director signs twice)', { x: width - margin - 215, y: sigY - 26, size: 6.5, font: fontRegular, color: rgb(0.4, 0.45, 0.5) });

  // Seal Placeholder
  page.drawCircle({
    x: width / 2,
    y: sigY - 5,
    size: 26,
    borderColor: rgb(0.77, 0.63, 0.35),
    borderWidth: 1,
    color: rgb(0.98, 0.97, 0.95),
  });
  page.drawText('OFFICIAL', { x: width / 2 - 18, y: sigY - 2, size: 7, font: fontBold, color: rgb(0.77, 0.63, 0.35) });
  page.drawText('SEAL', { x: width / 2 - 10, y: sigY - 11, size: 7, font: fontBold, color: rgb(0.77, 0.63, 0.35) });

  const pdfBytes = await pdfDoc.save();
  return {
    buffer: Buffer.from(pdfBytes),
    fileName: `Share_Certificate_Draft_Order_${details.orderId}.pdf`,
  };
}

/**
 * 5. Special Power of Attorney & Authorizing Mandate (Executive 1-Page Format)
 */
export async function generatePowerOfAttorneyResolutionDraft(order: Order, extractedInfo?: any): Promise<{ buffer: Buffer; fileName: string }> {
  const details = { ...extractOrderEntityDetails(order), ...extractedInfo };
  validateStatutoryPrerequisites(details, ['companyName', 'customerName', 'idNumber'], 'Power of Attorney');
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const margin = 40;

  drawMyAccHeader(page, width, height, fontBold, fontRegular);

  let currentY = height - 88;

  // Title Box
  page.drawRectangle({
    x: margin,
    y: currentY - 24,
    width: width - margin * 2,
    height: 26,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 1,
  });

  page.drawText('SPECIAL POWER OF ATTORNEY & STATUTORY AUTHORIZATION', {
    x: margin + 15,
    y: currentY - 14,
    size: 10.5,
    font: fontBold,
    color: rgb(0.06, 0.13, 0.22),
  });

  page.drawText(`IN RESPECT OF: ${details.companyName} (REGISTRATION NO: ${details.regNumber})`, {
    x: margin + 15,
    y: currentY - 22,
    size: 7,
    font: fontBold,
    color: rgb(0.77, 0.63, 0.35),
  });

  currentY -= 36;

  const introText = `I/WE, the undersigned, being the duly appointed Director(s) / Member(s) of ${details.companyName} (Registration Number: ${details.regNumber}), having our registered principal address at ${details.address}:`;
  currentY = drawJustifiedParagraph(page, introText, margin, currentY, width - margin * 2, fontRegular, 8.5, rgb(0.18, 0.22, 0.28), 12);

  currentY -= 6;
  page.drawText('HEREBY NOMINATE, CONSTITUTE AND APPOINT:', { x: margin, y: currentY, size: 8.5, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
  currentY -= 14;

  // Appointee Card
  page.drawRectangle({
    x: margin,
    y: currentY - 32,
    width: width - margin * 2,
    height: 32,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 0.5,
  });

  page.drawText('MANDATED ACCOUNTING & COMPLIANCE OFFICER: KEVIN FREESE', { x: margin + 10, y: currentY - 12, size: 8, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
  page.drawText('PRACTICE: MY ACCOUNTANT (PTY) LTD | CIBA CBAP(SA) #3561 | SAIT #9329460225', { x: margin + 10, y: currentY - 24, size: 7.5, font: fontRegular, color: rgb(0.3, 0.35, 0.4) });

  currentY -= 42;

  const clauses = [
    `1. MANDATE & SCOPE: To act on behalf of the Company in all matters pertaining to statutory compliance, registrations, and liaison with regulatory authorities including the National Credit Regulator (NCR), CIPC, SARS, and the Department of Labour (COIDA/UIF).`,
    `2. STATUTORY SUBMISSIONS: To complete, sign, lodge, and deliver all statutory applications, annual returns, resolutions, and supporting documentation required for ${details.serviceTitle} (Reference Order #${details.orderId}).`,
    `3. REGULATORY REPRESENTATION: To engage with regulatory officials, query application statuses, receive official statutory certificates, and rectify any administrative requisitions.`,
  ];

  for (const clause of clauses) {
    currentY = drawJustifiedParagraph(page, clause, margin, currentY, width - margin * 2, fontRegular, 8.5, rgb(0.18, 0.22, 0.28), 12);
    currentY -= 4;
  }

  currentY -= 10;
  page.drawText(`SIGNED AT _____________________ ON THIS _______ DAY OF ______________ 20___`, {
    x: margin,
    y: currentY,
    size: 8.5,
    font: fontBold,
    color: rgb(0.06, 0.13, 0.22),
  });

  currentY -= 18;

  // Single Page Unified Signatures
  const boxW = (width - margin * 2 - 20) / 2;

  // Director Box
  page.drawRectangle({
    x: margin,
    y: currentY - 80,
    width: boxW,
    height: 80,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
  });

  page.drawText('DIRECTOR / PRINCIPAL GRANTOR:', { x: margin + 10, y: currentY - 12, size: 7.5, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
  page.drawRectangle({
    x: margin + 10,
    y: currentY - 48,
    width: boxW - 20,
    height: 30,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.7, 0.75, 0.8),
    borderWidth: 0.5,
  });
  page.drawText('× SIGN HERE ×', { x: margin + boxW / 2 - 28, y: currentY - 34, size: 7.5, font: fontBold, color: rgb(0.6, 0.65, 0.7) });
  page.drawText(`Name: ${details.customerName}`, { x: margin + 10, y: currentY - 60, size: 7.5, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
  page.drawText(`ID Number: ${details.idNumber}`, { x: margin + 10, y: currentY - 70, size: 7, font: fontRegular, color: rgb(0.4, 0.45, 0.5) });

  // Agent Acceptance Box
  const agX = margin + boxW + 20;
  page.drawRectangle({
    x: agX,
    y: currentY - 80,
    width: boxW,
    height: 80,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
  });

  page.drawText('ACCEPTED BY MANDATED AGENT:', { x: agX + 10, y: currentY - 12, size: 7.5, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
  page.drawText('Kevin Freese', { x: agX + 10, y: currentY - 30, size: 14, font: fontBold, color: rgb(0, 0.2, 0.4) });
  page.drawText('DIGITALLY SIGNED • CBA (SA) #3561', { x: agX + 10, y: currentY - 40, size: 6.5, font: fontBold, color: rgb(0.17, 0.42, 0.69) });
  page.drawText('For & On Behalf of My Accountant (Pty) Ltd', { x: agX + 10, y: currentY - 58, size: 7, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
  page.drawText(`Date: ${details.orderDate}`, { x: agX + 10, y: currentY - 68, size: 6.5, font: fontRegular, color: rgb(0.4, 0.45, 0.5) });

  const pdfBytes = await pdfDoc.save();
  return {
    buffer: Buffer.from(pdfBytes),
    fileName: `Power_of_Attorney_Mandate_${details.orderId}.pdf`,
  };
}

/**
 * 6. Professional Engagement Letter & Service Agreement
 */
export async function generateEngagementLetterDraft(order: Order, extractedInfo?: any): Promise<{ buffer: Buffer; fileName: string }> {
  const details = { ...extractOrderEntityDetails(order), ...extractedInfo };
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const margin = 40;

  drawMyAccHeader(page, width, height, fontBold, fontRegular);

  let currentY = height - 88;

  page.drawText('PROFESSIONAL ENGAGEMENT LETTER & TERMS OF SERVICE', {
    x: margin,
    y: currentY,
    size: 11,
    font: fontBold,
    color: rgb(0.06, 0.13, 0.22),
  });

  page.drawText(`CLIENT: ${details.companyName} (REG: ${details.regNumber}) | ORDER REF: #${details.orderId}`, {
    x: margin,
    y: currentY - 12,
    size: 8,
    font: fontBold,
    color: rgb(0.77, 0.63, 0.35),
  });

  currentY -= 26;

  const intro = `This Engagement Agreement confirms the terms and conditions under which My Accountant (Pty) Ltd ("the Practice") will provide professional accounting, statutory registration, tax compliance, and advisory services to ${details.companyName} ("the Client"), represented by ${details.customerName}.`;
  currentY = drawJustifiedParagraph(page, intro, margin, currentY, width - margin * 2, fontRegular, 8.5, rgb(0.18, 0.22, 0.28), 12);

  currentY -= 6;
  page.drawText('1. SCOPE OF PROFESSIONAL SERVICES:', { x: margin, y: currentY, size: 9, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
  currentY -= 14;

  const scope = [
    `• Professional execution of ${details.serviceTitle} in accordance with relevant statutory acts (Companies Act, National Credit Act, Tax Administration Act).`,
    `• Statutory document drafting, KYC verification, compliance checks, and regulatory liaison with relevant bodies (CIPC, NCR, SARS, Labour).`,
    `• Quality assurance and sign-off by a registered Chartered Business Accountant in Practice (CIBA CBAP SA #3561).`,
  ];
  for (const s of scope) {
    currentY = drawJustifiedParagraph(page, s, margin + 5, currentY, width - margin * 2 - 10, fontRegular, 8, rgb(0.18, 0.22, 0.28), 11.5);
    currentY -= 2;
  }

  currentY -= 6;
  page.drawText('2. CLIENT RESPONSIBILITIES & STATUTORY ACCURACY:', { x: margin, y: currentY, size: 9, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
  currentY -= 14;

  const clientResp = `The Client confirms that all records, bank statements, identification copies, and declarations furnished are authentic, complete, and legally valid. The Client remains solely responsible for the operational management of the business.`;
  currentY = drawJustifiedParagraph(page, clientResp, margin, currentY, width - margin * 2, fontRegular, 8.5, rgb(0.18, 0.22, 0.28), 12);

  currentY -= 6;
  page.drawText('3. CONFIDENTIALITY & DATA PROTECTION (POPIA):', { x: margin, y: currentY, size: 9, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
  currentY -= 14;

  const popia = `All confidential business and personal information provided by the Client is processed in strict compliance with the Protection of Personal Information Act (POPIA) and professional accounting ethical standards.`;
  currentY = drawJustifiedParagraph(page, popia, margin, currentY, width - margin * 2, fontRegular, 8.5, rgb(0.18, 0.22, 0.28), 12);

  currentY -= 16;

  // Dual Signature Blocks
  const boxW = (width - margin * 2 - 20) / 2;

  // Practice Sign-off
  page.drawRectangle({
    x: margin,
    y: currentY - 80,
    width: boxW,
    height: 80,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: rgb(0.88, 0.91, 0.94),
    borderWidth: 1,
  });

  page.drawText('FOR MY ACCOUNTANT (PTY) LTD:', { x: margin + 10, y: currentY - 12, size: 7.5, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
  page.drawText('Kevin Freese', { x: margin + 10, y: currentY - 30, size: 14, font: fontBold, color: rgb(0, 0.2, 0.4) });
  page.drawText('DIGITALLY SIGNED • CBA (SA) #3561', { x: margin + 10, y: currentY - 40, size: 6.5, font: fontBold, color: rgb(0.17, 0.42, 0.69) });
  page.drawText('Kevin Freese (Director)', { x: margin + 10, y: currentY - 52, size: 7, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
  page.drawText(`Date: ${details.orderDate}`, { x: margin + 10, y: currentY - 62, size: 6.5, font: fontRegular, color: rgb(0.4, 0.45, 0.5) });

  // Client Acceptance
  const clX = margin + boxW + 20;
  page.drawRectangle({
    x: clX,
    y: currentY - 80,
    width: boxW,
    height: 80,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: rgb(0.88, 0.91, 0.94),
    borderWidth: 1,
  });

  page.drawText('ACCEPTED BY CLIENT / DIRECTOR:', { x: clX + 10, y: currentY - 12, size: 7.5, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
  page.drawRectangle({
    x: clX + 10,
    y: currentY - 48,
    width: boxW - 20,
    height: 30,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.7, 0.75, 0.8),
    borderWidth: 0.5,
  });
  page.drawText('× CLIENT SIGNATURE ×', { x: clX + boxW / 2 - 38, y: currentY - 34, size: 7, font: fontBold, color: rgb(0.6, 0.65, 0.7) });
  page.drawText(`Name: ${details.customerName}`, { x: clX + 10, y: currentY - 60, size: 7, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
  page.drawText(`Date: ${details.orderDate}`, { x: clX + 10, y: currentY - 70, size: 6.5, font: fontRegular, color: rgb(0.4, 0.45, 0.5) });

  const pdfBytes = await pdfDoc.save();
  return {
    buffer: Buffer.from(pdfBytes),
    fileName: `Engagement_Letter_Agreement_${details.orderId}.pdf`,
  };
}

/**
 * 7. SARS Public Officer Appointment & Director Resolution Draft
 */
export async function generateSarsPublicOfficerResolutionDraft(order: Order, extractedInfo?: any): Promise<{ buffer: Buffer; fileName: string }> {
  const details = { ...extractOrderEntityDetails(order), ...extractedInfo };
  validateStatutoryPrerequisites(details, ['companyName', 'customerName', 'idNumber'], 'SARS Public Officer Resolution');
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const margin = 40;

  drawMyAccHeader(page, width, height, fontBold, fontRegular);

  let currentY = height - 88;

  page.drawText('DIRECTOR RESOLUTION & APPOINTMENT OF PUBLIC OFFICER', {
    x: margin,
    y: currentY,
    size: 11,
    font: fontBold,
    color: rgb(0.06, 0.13, 0.22),
  });

  currentY -= 14;
  page.drawText('IN TERMS OF SECTION 246 OF THE TAX ADMINISTRATION ACT NO. 28 OF 2011', {
    x: margin,
    y: currentY,
    size: 8,
    font: fontBold,
    color: rgb(0.77, 0.63, 0.35),
  });

  currentY -= 20;
  page.drawRectangle({
    x: margin,
    y: currentY - 32,
    width: width - margin * 2,
    height: 34,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: rgb(0.88, 0.91, 0.94),
    borderWidth: 1,
  });

  page.drawText(`COMPANY NAME: ${details.companyName}`, {
    x: margin + 12,
    y: currentY - 12,
    size: 9,
    font: fontBold,
    color: rgb(0.06, 0.13, 0.22),
  });

  page.drawText(`REGISTRATION NUMBER: ${details.regNumber} | TAX NUMBER: ${details.taxNumber}`, {
    x: margin + 12,
    y: currentY - 24,
    size: 8,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.4),
  });

  currentY -= 45;

  const res1 = `IT WAS NOTED THAT in terms of Section 246 of the Tax Administration Act, every company carrying on business or having an office in the Republic of South Africa must at all times be represented by an individual who is a registered Public Officer / Tax Representative.`;
  currentY = drawJustifiedParagraph(page, res1, margin, currentY, width - margin * 2, fontRegular, 8.5, rgb(0.18, 0.22, 0.28), 12);

  currentY -= 8;
  page.drawText('IT WAS UNANIMOUSLY RESOLVED THAT:', { x: margin, y: currentY, size: 9, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
  currentY -= 16;

  const res2 = `1. ${details.customerName} (Identity Number: ${details.idNumber}) be and is hereby appointed as the official PUBLIC OFFICER and REGISTERED TAX REPRESENTATIVE of ${details.companyName} with the South African Revenue Service (SARS).`;
  currentY = drawJustifiedParagraph(page, res2, margin, currentY, width - margin * 2, fontRegular, 8.5, rgb(0.18, 0.22, 0.28), 12);

  currentY -= 6;
  const res3 = `2. The appointed Public Officer is authorised to maintain and manage the SARS eFiling profile of the Company, sign statutory declarations, submit tax returns, and attend to all tax compliance correspondence on behalf of the entity.`;
  currentY = drawJustifiedParagraph(page, res3, margin, currentY, width - margin * 2, fontRegular, 8.5, rgb(0.18, 0.22, 0.28), 12);

  currentY -= 6;
  const res4 = `3. MY ACCOUNTANT (PTY) LTD (and nominated Tax Practitioners) is authorised as the mandated Tax Advisory Practice to lodge this appointment and statutory profile update with SARS.`;
  currentY = drawJustifiedParagraph(page, res4, margin, currentY, width - margin * 2, fontRegular, 8.5, rgb(0.18, 0.22, 0.28), 12);

  currentY -= 16;
  page.drawText(`SIGNED AT _____________________ ON THIS _______ DAY OF ______________ 20___`, {
    x: margin,
    y: currentY,
    size: 8.5,
    font: fontBold,
    color: rgb(0.06, 0.13, 0.22),
  });

  currentY -= 20;

  // Single Page Signatures
  const boxW = (width - margin * 2 - 20) / 2;

  // Director Box
  page.drawRectangle({
    x: margin,
    y: currentY - 80,
    width: boxW,
    height: 80,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
  });

  page.drawText('FOR & ON BEHALF OF THE COMPANY:', { x: margin + 10, y: currentY - 12, size: 7.5, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
  page.drawRectangle({
    x: margin + 10,
    y: currentY - 48,
    width: boxW - 20,
    height: 30,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.7, 0.75, 0.8),
    borderWidth: 0.5,
  });
  page.drawText('× DIRECTOR SIGNATURE ×', { x: margin + boxW / 2 - 40, y: currentY - 34, size: 7.5, font: fontBold, color: rgb(0.6, 0.65, 0.7) });
  page.drawText(`Name: ${details.customerName}`, { x: margin + 10, y: currentY - 60, size: 7.5, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
  page.drawText(`Date: ${details.orderDate}`, { x: margin + 10, y: currentY - 70, size: 6.5, font: fontRegular, color: rgb(0.4, 0.45, 0.5) });

  // Appointee Acceptance Box
  const poX = margin + boxW + 20;
  page.drawRectangle({
    x: poX,
    y: currentY - 80,
    width: boxW,
    height: 80,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
  });

  page.drawText('ACCEPTANCE BY APPOINTED PUBLIC OFFICER:', { x: poX + 10, y: currentY - 12, size: 7.5, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
  page.drawRectangle({
    x: poX + 10,
    y: currentY - 48,
    width: boxW - 20,
    height: 30,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.7, 0.75, 0.8),
    borderWidth: 0.5,
  });
  page.drawText('× PUBLIC OFFICER SIGNATURE ×', { x: poX + boxW / 2 - 50, y: currentY - 34, size: 7.5, font: fontBold, color: rgb(0.6, 0.65, 0.7) });
  page.drawText(`Name: ${details.customerName}`, { x: poX + 10, y: currentY - 60, size: 7.5, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
  page.drawText(`Date: ${details.orderDate}`, { x: poX + 10, y: currentY - 70, size: 6.5, font: fontRegular, color: rgb(0.4, 0.45, 0.5) });

  const pdfBytes = await pdfDoc.save();
  return {
    buffer: Buffer.from(pdfBytes),
    fileName: `SARS_Public_Officer_Resolution_${details.orderId}.pdf`,
  };
}

/**
 * 8. Accounting Officer Consent & Confirmation Letter
 */
export async function generateAccountingOfficerConsentDraft(order: Order, extractedInfo?: any): Promise<{ buffer: Buffer; fileName: string }> {
  const details = { ...extractOrderEntityDetails(order), ...extractedInfo };
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalicBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);

  const { width, height } = page.getSize();
  const margin = 40;
  const contentWidth = width - margin * 2;

  // 1. Header
  page.drawText('MY ACCOUNTANT (PTY) LTD', {
    x: margin,
    y: height - 36,
    size: 14,
    font: fontBold,
    color: rgb(0.06, 0.13, 0.22),
  });

  page.drawText('REGISTRATION NUMBER: 2020 / 548105 / 07', {
    x: margin,
    y: height - 46,
    size: 6.5,
    font: fontBold,
    color: rgb(0.44, 0.5, 0.59),
  });

  page.drawText('ACCOUNTING  •  PAYROLL  •  TAX  •  ADVISORY', {
    x: margin,
    y: height - 55,
    size: 6.5,
    font: fontBold,
    color: rgb(0.77, 0.63, 0.35),
  });

  const headerRightText = 'Ground Floor, Waterstone Building, Stonemill Office Park\n300 Acacia Road, Darrenwood, Johannesburg, 2195\nTel: 010 109 1625 | Email: info@myacc.co.za | Web: www.myacc.co.za';
  page.drawText(headerRightText, {
    x: width - margin - 240,
    y: height - 36,
    size: 6.5,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.5),
    lineHeight: 8.5,
  });

  page.drawLine({
    start: { x: margin, y: height - 66 },
    end: { x: width - margin, y: height - 66 },
    thickness: 1,
    color: rgb(0.06, 0.13, 0.22),
  });

  let currentY = height - 82;

  // 2. Title
  page.drawText('CONSENT & CONFIRMATION OF APPOINTMENT AS ACCOUNTING OFFICER', {
    x: margin,
    y: currentY,
    size: 10.5,
    font: fontBold,
    color: rgb(0.06, 0.13, 0.22),
  });

  currentY -= 16;

  // 3. Metadata Table
  const metaRows: { label: string; value: string }[] = [
    { label: 'Applicant Entity:', value: details.companyName },
    { label: 'Registration Number:', value: details.regNumber },
  ];

  if (details.taxNumber && details.taxNumber !== '9000000000' && details.taxNumber !== 'N/A' && details.taxNumber.trim() !== '') {
    metaRows.push({ label: 'SARS Tax Reference Number:', value: details.taxNumber });
  }

  metaRows.push(
    { label: 'Director / Applicant:', value: `${details.customerName}${details.idNumber && details.idNumber !== '0000000000000' ? ` (ID: ${details.idNumber})` : ''}` },
    { label: 'Registered Office Address:', value: details.address },
    { label: 'Addressed To:', value: 'The National Credit Regulator (NCR) - Registration Department' }
  );

  const tableHeight = metaRows.length * 10.5 + 8;
  page.drawRectangle({
    x: margin,
    y: currentY - tableHeight,
    width: contentWidth,
    height: tableHeight,
    color: rgb(0.98, 0.98, 0.99),
    borderColor: rgb(0.88, 0.91, 0.94),
    borderWidth: 0.75,
  });

  const leftColX = margin + 12;
  const valColX = margin + 145;
  let metaY = currentY - 10;

  for (const row of metaRows) {
    page.drawText(row.label, { x: leftColX, y: metaY, size: 7.2, font: fontBold, color: rgb(0.2, 0.25, 0.3) });
    page.drawText(row.value, { x: valColX, y: metaY, size: 7.2, font: fontRegular, color: rgb(0.06, 0.13, 0.22) });
    metaY -= 10.5;
  }

  currentY -= (tableHeight + 12);

  // 4. Salutation & Subject
  page.drawText('To Whom It May Concern,', { x: margin, y: currentY, size: 8, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
  currentY -= 12;

  const subjectText = 'RE: APPOINTMENT AS ACCOUNTING OFFICER & VERIFICATION OF FINANCIAL INFORMATION IN TERMS OF THE NATIONAL CREDIT ACT (ACT NO. 34 OF 2005)';
  currentY = drawJustifiedParagraph(page, subjectText, margin, currentY, contentWidth, fontBold, 7.5, rgb(0.06, 0.13, 0.22), 10);
  currentY -= 4;

  // 5. Body Paragraphs
  const p1 = `I, Kevin Freese from My Accountant (Pty) Ltd, hereby confirm our consent and formal appointment as the independent Accounting Officer / Assurance Practitioner for ${details.companyName} (Registration Number: ${details.regNumber}) in support of their application for registration as a Credit Provider with the National Credit Regulator (NCR).`;
  currentY = drawJustifiedParagraph(page, p1, margin, currentY, contentWidth, fontRegular, 8, rgb(0.18, 0.22, 0.28), 10.5);

  currentY -= 4;
  const p2 = `We confirm that our practice and signing accounting officers are duly registered and in good standing with recognized South African accounting and regulatory bodies:`;
  currentY = drawJustifiedParagraph(page, p2, margin, currentY, contentWidth, fontRegular, 8, rgb(0.18, 0.22, 0.28), 10.5);

  currentY -= 2;
  const bullets1 = [
    '• Professional Body: Chartered Institute of Business Accountants (CIBA / SAIBA)',
    '• Designation: Chartered Business Accountant in Practice — (CBAP) SA #3561',
    '• SARS Tax Practitioner Registration: PR-0098553',
  ];
  for (const b of bullets1) {
    page.drawText(b, { x: margin + 12, y: currentY, size: 7.8, font: fontRegular, color: rgb(0.18, 0.22, 0.28) });
    currentY -= 10;
  }

  currentY -= 4;
  page.drawText('Financial & Operational Verification:', { x: margin, y: currentY, size: 8, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
  currentY -= 10;

  const p3 = `Based on our review of the company's CIPC statutory incorporation documents, bank records, and representations provided by the director, we confirm that:`;
  currentY = drawJustifiedParagraph(page, p3, margin, currentY, contentWidth, fontRegular, 8, rgb(0.18, 0.22, 0.28), 10.5);

  currentY -= 2;
  const bullets2 = [
    '• The financial records and source documentation provided in support of the NCR Form 2 application have been reviewed by our practice and are, to the best of our professional knowledge, accurate and fairly presented.',
    '• As the appointed Accounting Officer, My Accountant (Pty) Ltd will oversee the ongoing financial management, statutory bookkeeping, and annual assurance engagements required under Regulations 67 and 68 of the National Credit Act, including the timely preparation and submission of NCR Form 39 and Form 40 statutory annual returns.'
  ];
  for (const b of bullets2) {
    currentY = drawJustifiedParagraph(page, b, margin + 12, currentY, contentWidth - 12, fontRegular, 7.8, rgb(0.18, 0.22, 0.28), 10);
    currentY -= 2;
  }

  currentY -= 2;
  const pClosing = `Please do not hesitate to contact our offices directly should you require any further information or verification.`;
  currentY = drawJustifiedParagraph(page, pClosing, margin, currentY, contentWidth, fontRegular, 8, rgb(0.18, 0.22, 0.28), 10.5);

  currentY -= 10;

  // 6. Sign-off Block
  page.drawText('FOR MY ACCOUNTANT (PTY) LTD:', { x: margin, y: currentY, size: 7.5, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
  currentY -= 9;
  page.drawText('Registration Number: 2020 / 548105 / 07', { x: margin, y: currentY, size: 7, font: fontRegular, color: rgb(0.35, 0.4, 0.45) });
  currentY -= 14;

  const sigDateFormatted = '20 August 2026';

  // Digital Signature Box
  const sigBoxW = 270;
  const sigBoxH = 46;
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

  page.drawText('Kevin Freese', { 
    x: margin + 10, 
    y: currentY - 8, 
    size: 15, 
    font: fontItalicBold, 
    color: rgb(0.04, 0.22, 0.48) 
  });

  page.drawText('DIGITALLY SIGNED • CBA (SA) #3561', { 
    x: margin + 10, 
    y: currentY - 18, 
    size: 6.5, 
    font: fontBold, 
    color: rgb(0.17, 0.42, 0.69) 
  });

  page.drawText(`Date: ${sigDateFormatted}`, { 
    x: margin + 10, 
    y: currentY - 27, 
    size: 6.8, 
    font: fontBold, 
    color: rgb(0.2, 0.25, 0.3) 
  });

  currentY -= (sigBoxH + 2);

  page.drawText('Chartered Business Accountant in Practice (CBAP SA #3561)', { x: margin, y: currentY, size: 7.5, font: fontRegular, color: rgb(0.2, 0.25, 0.3) });
  currentY -= 9;
  page.drawText('SARS Registered Tax Practitioner (PR-0098553)', { x: margin, y: currentY, size: 7.5, font: fontRegular, color: rgb(0.2, 0.25, 0.3) });
  currentY -= 9;
  page.drawText('Director, My Accountant (Pty) Ltd', { x: margin, y: currentY, size: 7.5, font: fontRegular, color: rgb(0.2, 0.25, 0.3) });

  // 7. Footer
  page.drawLine({
    start: { x: margin, y: 35 },
    end: { x: width - margin, y: 35 },
    thickness: 0.5,
    color: rgb(0.85, 0.88, 0.92),
  });

  page.drawText(`Date: ${sigDateFormatted}`, { x: margin, y: 24, size: 7, font: fontRegular, color: rgb(0.5, 0.55, 0.6) });
  page.drawText('Tel: 010 109 1625', { x: width - margin - 60, y: 24, size: 7, font: fontRegular, color: rgb(0.5, 0.55, 0.6) });

  const pdfBytes = await pdfDoc.save();
  return {
    buffer: Buffer.from(pdfBytes),
    fileName: `Accounting_Officer_Appointment_Letter_${details.orderId}.pdf`,
  };
}

/**
 * 9. Accountants Confirmation Letter
 */
export async function generateAccountantsLetterDraft(order: Order, extractedInfo?: any): Promise<{ buffer: Buffer; fileName: string }> {
  const details = { ...extractOrderEntityDetails(order), ...extractedInfo };
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalicBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);

  const { width, height } = page.getSize();
  const margin = 40;

  drawMyAccHeader(page, width, height, fontBold, fontRegular);

  let currentY = height - 88;

  page.drawText('TO WHOM IT MAY CONCERN', {
    x: margin,
    y: currentY,
    size: 10,
    font: fontBold,
    color: rgb(0.2, 0.25, 0.3),
  });

  currentY -= 18;
  page.drawText('CONFIRMATION OF REGISTRATION, COMPLIANCE & FINANCIAL RECORDS', {
    x: margin,
    y: currentY,
    size: 10,
    font: fontBold,
    color: rgb(0.06, 0.13, 0.22),
  });
  currentY -= 14;
  page.drawText(`CLIENT ENTITY: ${details.companyName} (REG NO: ${details.regNumber})`, {
    x: margin,
    y: currentY,
    size: 9,
    font: fontBold,
    color: rgb(0.77, 0.63, 0.35),
  });

  currentY -= 24;
  const p1 = `We confirm that My Accountant (Pty) Ltd has been formally retained as the appointed Accounting and Statutory Compliance Advisory Practice for ${details.companyName} in respect of ${details.serviceTitle} (Reference Order #${details.orderId}).`;
  currentY = drawJustifiedParagraph(page, p1, margin, currentY, width - margin * 2, fontRegular, 8.5, rgb(0.18, 0.22, 0.28), 12);

  currentY -= 8;
  const p2 = `Based on our review and verification of the statutory documentation, CIPC incorporation records, verified proof of address, verified business banking records, and director identification furnished by ${details.customerName}, we confirm that the entity is active, compliant, and duly prepared for statutory operations and regulatory licensing.`;
  currentY = drawJustifiedParagraph(page, p2, margin, currentY, width - margin * 2, fontRegular, 8.5, rgb(0.18, 0.22, 0.28), 12);

  currentY -= 8;
  const p3 = `Should you require any further validation or statutory schedules regarding this confirmation, please do not hesitate to contact our office directly at info@myacc.co.za or 010 109 1625.`;
  currentY = drawJustifiedParagraph(page, p3, margin, currentY, width - margin * 2, fontRegular, 8.5, rgb(0.18, 0.22, 0.28), 12);

  currentY -= 22;

  // Signature Block
  const sigDateFormatted = '20 August 2026';
  const sigBoxW = (width - margin * 2) * 0.65;
  const sigBoxH = 50;

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
    y: currentY - 29, 
    size: 6.5, 
    font: fontBold, 
    color: rgb(0.17, 0.42, 0.69) 
  });

  page.drawText('Chartered Business Accountant in Practice (CBAP SA #3561) • PR-0098553', { 
    x: margin + 10, 
    y: currentY - 38, 
    size: 6.5, 
    font: fontRegular, 
    color: rgb(0.2, 0.25, 0.3) 
  });

  const pdfBytes = await pdfDoc.save();
  return {
    buffer: Buffer.from(pdfBytes),
    fileName: `Accountants_Confirmation_Letter_Order_${details.orderId}.pdf`,
  };
}

/**
 * 10. COIDA CF-1B Application Form Draft
 */
export async function generateCoidaCf1bApplicationDraft(order: Order, extractedInfo?: any): Promise<{ buffer: Buffer; fileName: string }> {
  const details = { ...extractOrderEntityDetails(order), ...extractedInfo };
  validateStatutoryPrerequisites(details, ['companyName', 'customerName'], 'COIDA CF-1B Application');
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const margin = 40;

  // Header Banner
  page.drawRectangle({
    x: margin,
    y: height - 85,
    width: width - margin * 2,
    height: 48,
    color: rgb(0.06, 0.13, 0.22),
  });

  page.drawText('DEPARTMENT OF EMPLOYMENT AND LABOUR', {
    x: margin + 15,
    y: height - 58,
    size: 12,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('CF-1B: APPLICATION FOR CHANGE OF NATURE OF BUSINESS / TARIFF CLASSIFICATION', {
    x: margin + 15,
    y: height - 72,
    size: 7.5,
    font: fontBold,
    color: rgb(0.77, 0.63, 0.35),
  });

  let currentY = height - 105;

  const drawRow = (lbl: string, val: string, y: number) => {
    page.drawText(lbl, { x: margin + 10, y, size: 8, font: fontBold, color: rgb(0.25, 0.3, 0.35) });
    page.drawText(val || 'N/A', { x: margin + 185, y, size: 8, font: fontRegular, color: rgb(0.05, 0.05, 0.05) });
    page.drawLine({ start: { x: margin + 180, y: y - 2 }, end: { x: width - margin - 10, y: y - 2 }, thickness: 0.5, color: rgb(0.88, 0.91, 0.94) });
    return y - 16;
  };

  const drawHeader = (title: string, y: number) => {
    page.drawRectangle({
      x: margin,
      y: y - 16,
      width: width - margin * 2,
      height: 18,
      color: rgb(0.95, 0.97, 0.99),
      borderColor: rgb(0.85, 0.88, 0.92),
      borderWidth: 1,
    });
    page.drawText(title, { x: margin + 10, y: y - 12, size: 8.5, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
    return y - 24;
  };

  currentY = drawHeader('SECTION A: EMPLOYER PARTICULARS', currentY);
  currentY = drawRow('Employer Registered Legal Name:', details.companyName, currentY);
  currentY = drawRow('CIPC Registration Number:', details.regNumber, currentY);
  currentY = drawRow('Compensation Fund (COIDA) Ref No:', '9900000000', currentY);
  currentY = drawRow('SARS PAYE Reference Number:', '7000000000', currentY);
  currentY = drawRow('Physical Operating Address:', details.address, currentY);

  currentY -= 6;
  currentY = drawHeader('SECTION B: NATURE OF BUSINESS & APPOINTED CONSULTANT', currentY);
  currentY = drawRow('Current Registered Business Classification:', 'Previous Sub-Class Activity', currentY);
  currentY = drawRow('Proposed New Business Classification:', 'Auto Valet, Detailing & Fleet Cleaning Services', currentY);
  currentY = drawRow('Operational Commencement Date:', details.orderDate, currentY);
  currentY = drawRow('Mandated Consultant / Representative:', 'Kevin Freese (kev@thinkestry.co.za / 010 109 1625)', currentY);
  currentY = drawRow('Consultant Practice:', 'My Accountant (Pty) Ltd | CIBA #3561', currentY);

  currentY -= 8;
  const dec = 'I, the undersigned, hereby declare that the particulars provided above and in the attached supporting documentation (including operational site photographs, lease agreements, and vehicle lists) are true and correct.';
  currentY = drawJustifiedParagraph(page, dec, margin + 10, currentY, width - margin * 2 - 20, fontRegular, 8, rgb(0.2, 0.25, 0.3), 11.5);

  currentY -= 16;
  page.drawText(`Date: ${details.orderDate}`, { x: margin + 10, y: currentY, size: 8.5, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
  page.drawText(`Authorized Director Signature: ________________________________`, { x: margin + 10, y: currentY - 18, size: 8.5, font: fontBold, color: rgb(0.06, 0.13, 0.22) });

  const pdfBytes = await pdfDoc.save();
  return {
    buffer: Buffer.from(pdfBytes),
    fileName: `COIDA_CF1B_Application_Draft_${details.orderId}.pdf`,
  };
}

/**
 * 11. Order Intake Summary PDF
 */
export async function generateOrderIntakeSummaryPdf(order: Order, aiVerifications?: any[]): Promise<{ buffer: Buffer; fileName: string }> {
  const details = extractOrderEntityDetails(order);
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const margin = 40;

  drawMyAccHeader(page, width, height, fontBold, fontRegular);

  let currentY = height - 88;

  page.drawText('CLIENT INTAKE & COMPLIANCE AUDIT DOSSIER', {
    x: margin,
    y: currentY,
    size: 11,
    font: fontBold,
    color: rgb(0.06, 0.13, 0.22),
  });

  page.drawText(`ORDER REF: #${details.orderId} | CLIENT: ${details.companyName}`, {
    x: margin,
    y: currentY - 12,
    size: 8,
    font: fontBold,
    color: rgb(0.77, 0.63, 0.35),
  });

  currentY -= 28;

  const intro = `This intake summary provides the consolidated compliance audit trail, verified entity particulars, and automated checklist progress for Order #${details.orderId} (${details.serviceTitle}).`;
  currentY = drawJustifiedParagraph(page, intro, margin, currentY, width - margin * 2, fontRegular, 8.5, rgb(0.18, 0.22, 0.28), 12);

  currentY -= 10;
  page.drawText('VERIFIED DOCUMENT AUDIT TRAIL:', { x: margin, y: currentY, size: 9, font: fontBold, color: rgb(0.06, 0.13, 0.22) });
  currentY -= 16;

  const uploads = order.documentUploads || [];
  for (const doc of uploads) {
    const statusText = doc.status === 'approved' ? '[APPROVED]' : doc.status === 'rejected' ? '[REJECTED]' : '[PENDING]';
    const recText = doc.aiVerification?.recommendation ? `(AI: ${doc.aiVerification.recommendation.toUpperCase()})` : '';
    page.drawText(`• ${doc.requirementLabel} — ${statusText} ${recText}`, { x: margin + 5, y: currentY, size: 8, font: fontRegular, color: rgb(0.1, 0.15, 0.2) });
    currentY -= 12;
  }

  currentY -= 20;
  page.drawText(`AUDITED BY MY ACCOUNTANT AUTOMATED COMPLIANCE ENGINE`, { x: margin, y: currentY, size: 7.5, font: fontBold, color: rgb(0.4, 0.45, 0.5) });
  page.drawText(`Generated on: ${new Date().toLocaleString('en-ZA')}`, { x: margin, y: currentY - 10, size: 7, font: fontRegular, color: rgb(0.5, 0.55, 0.6) });

  const pdfBytes = await pdfDoc.save();
  return {
    buffer: Buffer.from(pdfBytes),
    fileName: `Order_Intake_Audit_Summary_${details.orderId}.pdf`,
  };
}
