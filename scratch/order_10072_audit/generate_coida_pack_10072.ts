import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { drawMyAccHeader } from '../../src/lib/pdf/template-generators';

/**
 * Generates the Special Power of Attorney for COIDA Nature of Business Change
 */
export async function generateCoidaPowerOfAttorneyPdf(data: {
  companyName: string;
  regNumber: string;
  vatNumber?: string;
  coidaRef: string;
  directorName: string;
  directorId: string;
  directorTitle: string;
  city: string;
  province: string;
  dateStr: string;
  targetSubclass: string;
}): Promise<{ buffer: Buffer; fileName: string }> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalicBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);

  const { width, height } = page.getSize();
  const margin = 45;
  const navy = rgb(0.06, 0.13, 0.22);
  const darkSlate = rgb(0.18, 0.22, 0.28);

  // Executive Header
  drawMyAccHeader(page, width, height, fontBold, fontRegular);

  let currentY = height - 92;

  // Title Box
  page.drawRectangle({
    x: margin,
    y: currentY - 26,
    width: width - margin * 2,
    height: 26,
    color: rgb(0.96, 0.97, 0.99),
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 0.75,
  });

  page.drawText('SPECIAL POWER OF ATTORNEY', {
    x: margin + 14,
    y: currentY - 14,
    size: 10.5,
    font: fontBold,
    color: navy,
  });

  page.drawText('COMPENSATION FOR OCCUPATIONAL INJURIES AND DISEASES ACT, 1993 (ACT 130 OF 1993)', {
    x: margin + 14,
    y: currentY - 23,
    size: 7,
    font: fontBold,
    color: rgb(0.5, 0.55, 0.6),
  });

  currentY -= 38;

  // Employer / Appointee Meta Box
  const metaH = 58;
  page.drawRectangle({
    x: margin,
    y: currentY - metaH,
    width: width - margin * 2,
    height: metaH,
    color: rgb(0.98, 0.99, 1.0),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 0.5,
  });

  let my = currentY - 13;
  page.drawText(`Employer / Principal:`, { x: margin + 12, y: my, size: 8, font: fontBold, color: navy });
  page.drawText(data.companyName, { x: margin + 140, y: my, size: 8, font: fontBold, color: navy });
  my -= 13;
  page.drawText(`Registration No / VAT:`, { x: margin + 12, y: my, size: 8, font: fontBold, color: navy });
  page.drawText(`${data.regNumber}  |  VAT: ${data.vatNumber || 'N/A'}`, { x: margin + 140, y: my, size: 8, font: fontRegular, color: darkSlate });
  my -= 13;
  page.drawText(`COIDA Reference Number:`, { x: margin + 12, y: my, size: 8, font: fontBold, color: navy });
  page.drawText(data.coidaRef, { x: margin + 140, y: my, size: 8, font: fontBold, color: rgb(0.04, 0.22, 0.48) });
  my -= 13;
  page.drawText(`Appointed Representative:`, { x: margin + 12, y: my, size: 8, font: fontBold, color: navy });
  page.drawText(`KEVIN FREESE (ID: 8606205046085) · My Accountant (Pty) Ltd`, { x: margin + 140, y: my, size: 8, font: fontRegular, color: darkSlate });

  currentY -= metaH + 16;

  function drawPara(text: string, yPos: number, size = 8.5, lineHeight = 12.5) {
    const words = text.trim().split(/\s+/);
    let line = '';
    let y = yPos;
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
    return y;
  }

  const pIntro = `I, the undersigned, ${data.directorName} (ID Number: ${data.directorId}), in my capacity as ${data.directorTitle} of ${data.companyName} (Registration Number: ${data.regNumber}), hereby nominate, constitute, and appoint Kevin Freese (ID Number: 8606205046085) of My Accountant (Pty) Ltd (Practice CIBA #3561) to act as the company's lawful representative and mandated agent in all statutory matters pertaining to the Compensation Fund (COIDA).`;
  currentY = drawPara(pIntro, currentY);
  currentY -= 6;

  page.drawText('The Appointed Representative is hereby authorised and empowered to:', { x: margin, y: currentY, size: 8.5, font: fontBold, color: navy });
  currentY -= 14;

  const powers = [
    `• Prepare, sign, and lodge the official Form CF-1B Application for Change of Nature of Business / Tariff Reclassification (${data.targetSubclass}).`,
    `• Liaise directly with officials, assessors, and inspectors of the Department of Employment and Labour and the Compensation Commissioner.`,
    `• Request, access, query, and receive statements of account, assessment notices, revised industry tariff determinations, and official Letters of Good Standing (LOGS).`,
    `• Execute all lawful acts, statutory declarations, and procedural submissions necessary to finalize Compensation Fund compliance on behalf of the company.`,
  ];

  for (const pw of powers) {
    currentY = drawPara(pw, currentY, 8, 11.5);
    currentY -= 3;
  }

  currentY -= 4;
  const pValidity = `This Power of Attorney is effective from 01 August 2026 and shall remain in full force and effect until formally revoked in writing. I hereby ratify and confirm all lawful acts performed by the appointed representative under this statutory mandate.`;
  currentY = drawPara(pValidity, currentY, 8, 11.5);

  currentY -= 18;

  // Signatures Section
  page.drawText(`Signed at: ${data.city}, ${data.province}`, { x: margin, y: currentY, size: 8.5, font: fontBold, color: navy });
  page.drawText(`Date: ${data.dateStr}`, { x: width / 2 + 30, y: currentY, size: 8.5, font: fontBold, color: navy });
  currentY -= 14;
  page.drawText(`Capacity: ${data.directorTitle} (Authorised Signatory)`, { x: margin, y: currentY, size: 8, font: fontRegular, color: darkSlate });

  currentY -= 26;

  // Signatory Signature Line
  page.drawLine({ start: { x: margin, y: currentY }, end: { x: margin + 200, y: currentY }, thickness: 0.75, color: rgb(0.6, 0.65, 0.7) });
  page.drawText(data.directorName.toUpperCase(), { x: margin, y: currentY - 11, size: 8, font: fontBold, color: navy });
  page.drawText(`${data.directorTitle} | ${data.companyName}`, { x: margin, y: currentY - 21, size: 7.5, font: fontRegular, color: darkSlate });

  // Representative Card
  const repBoxX = width / 2 + 10;
  const repBoxW = width - margin - repBoxX;
  const repBoxH = 46;

  page.drawRectangle({
    x: repBoxX,
    y: currentY - 32,
    width: repBoxW,
    height: repBoxH,
    color: rgb(0.97, 0.98, 1.0),
    borderColor: rgb(0.8, 0.86, 0.94),
    borderWidth: 0.75,
  });

  page.drawRectangle({
    x: repBoxX,
    y: currentY - 32,
    width: 3.5,
    height: repBoxH,
    color: rgb(0.06, 0.24, 0.46),
  });

  page.drawText('ACCEPTED BY APPOINTED REPRESENTATIVE:', { x: repBoxX + 10, y: currentY - 2, size: 6.5, font: fontBold, color: navy });
  page.drawText('Kevin Freese', { x: repBoxX + 10, y: currentY - 14, size: 12, font: fontItalicBold, color: rgb(0.04, 0.22, 0.48) });
  page.drawText('CIBA CBAP (SA) #3561 • My Accountant (Pty) Ltd', { x: repBoxX + 10, y: currentY - 25, size: 6.5, font: fontRegular, color: darkSlate });

  const pdfBytes = await pdfDoc.save();
  return {
    buffer: Buffer.from(pdfBytes),
    fileName: `Power_of_Attorney_COIDA_Kevin_Freese_${data.companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
  };
}

/**
 * Generates the Form CF-1B Application for Change of Nature of Business
 * using the official 3-page template with exact coordinate alignment
 */
export async function generateCoidaCf1bOfficialPdf(data: {
  employerName: string;
  cfRegNo: string;
  uifRegNo?: string;
  cipcRegNo: string;
  taxNo: string;
  businessAddress: string;
  city: string;
  province: string;
  code: string;
  employerTel: string;
  mobileTel: string;
  employerEmail: string;
  consultantEmail: string;
  consultantTel: string;
  currentNature: string;
  requestedSubclass: string;
  effectiveDate: string;
  clients: { name: string; contact: string; service: string }[];
  keyActivities: string[];
  directorName: string;
  directorTitle: string;
  consultantName: string;
  dateStr: string;
}): Promise<{ buffer: Buffer; fileName: string }> {
  const templatePath = 'C:\\Users\\kev\\OneDrive\\Documents\\CF-1B Form Application for Change of Nature of Business_ORIGINAL_BACKUP.pdf';
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found at: ${templatePath}`);

  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.06, 0.13, 0.22);
  const darkSlate = rgb(0.12, 0.15, 0.2);

  const pages = pdfDoc.getPages();

  // ========================== PAGE 1 ==========================
  const p1 = pages[0];

  // Name of Employer
  p1.drawText(data.employerName, { x: 175, y: 624, size: 8, font: fontBold, color: navy });

  // CF Registration No (exact box X coordinates: 174, 196, 219, 242, 265, 287, 309, 331, 354, 376, 400, 423)
  const cfDigits = data.cfRegNo.replace(/[^0-9]/g, '');
  const cfXCoords = [174, 196, 219, 242, 265, 287, 309, 331, 354, 376, 400, 423];
  for (let i = 0; i < Math.min(cfDigits.length, cfXCoords.length); i++) {
    p1.drawText(cfDigits[i], { x: cfXCoords[i] + 3, y: 601, size: 8.5, font: fontBold, color: navy });
  }

  // UIF Registration No (if available)
  if (data.uifRegNo) {
    const uifDigits = data.uifRegNo.replace(/[^0-9]/g, '');
    const uifXCoords = [174, 196, 219, 242, 265, 287, 309, 331];
    for (let i = 0; i < Math.min(uifDigits.length, uifXCoords.length); i++) {
      p1.drawText(uifDigits[i], { x: uifXCoords[i] + 3, y: 582, size: 8.5, font: fontBold, color: navy });
    }
  }

  // CIPC Reg No (exact box X coordinates: 174, 196, 218, 241, 264, 287, 309, 331, 354, 376, 399, 421)
  const cipcClean = data.cipcRegNo.replace(/[^0-9]/g, '');
  const cipcXCoords = [174, 196, 218, 241, 264, 287, 309, 331, 354, 376, 399, 421];
  for (let i = 0; i < Math.min(cipcClean.length, cipcXCoords.length); i++) {
    p1.drawText(cipcClean[i], { x: cipcXCoords[i] + 3, y: 561, size: 8.5, font: fontBold, color: navy });
  }

  // SARS Tax No (exact box X coordinates: 174, 196, 218, 241, 263, 285, 307, 329, 351, 373)
  const taxClean = data.taxNo.replace(/[^0-9]/g, '');
  const taxXCoords = [174, 196, 218, 241, 263, 285, 307, 329, 351, 373];
  for (let i = 0; i < Math.min(taxClean.length, taxXCoords.length); i++) {
    p1.drawText(taxClean[i], { x: taxXCoords[i] + 3, y: 540, size: 8.5, font: fontBold, color: navy });
  }

  // Business Address, City, Province
  p1.drawText(data.businessAddress, { x: 175, y: 512, size: 8, font: fontRegular, color: darkSlate });
  p1.drawText(data.city, { x: 175, y: 476, size: 8, font: fontRegular, color: darkSlate });
  p1.drawText(data.province, { x: 175, y: 456, size: 8, font: fontRegular, color: darkSlate });

  // Code (Postal Code)
  const codeDigits = data.code.replace(/[^0-9]/g, '');
  const codeXCoords = [175, 197, 220, 241];
  for (let i = 0; i < Math.min(codeDigits.length, codeXCoords.length); i++) {
    p1.drawText(codeDigits[i], { x: codeXCoords[i] + 3, y: 434, size: 8.5, font: fontBold, color: navy });
  }

  // Employer Tel & Mobile
  const telDigits = data.employerTel.replace(/[^0-9]/g, '');
  const telXCoords = [179, 199, 218, 238, 257, 276, 298, 318, 337, 359];
  for (let i = 0; i < Math.min(telDigits.length, telXCoords.length); i++) {
    p1.drawText(telDigits[i], { x: telXCoords[i] + 2, y: 412, size: 8.5, font: fontBold, color: navy });
  }

  const mobDigits = data.mobileTel.replace(/[^0-9]/g, '');
  const mobXCoords = [179, 198, 218, 236, 257, 278, 299, 319, 338, 358];
  for (let i = 0; i < Math.min(mobDigits.length, mobXCoords.length); i++) {
    p1.drawText(mobDigits[i], { x: mobXCoords[i] + 2, y: 391, size: 8.5, font: fontBold, color: navy });
  }

  // Emails
  p1.drawText(data.employerEmail, { x: 195, y: 370, size: 8, font: fontRegular, color: darkSlate });
  p1.drawText(data.consultantEmail, { x: 195, y: 347, size: 8, font: fontRegular, color: darkSlate });

  // Consultant Tel
  const conTelDigits = data.consultantTel.replace(/[^0-9]/g, '');
  const conTelXCoords = [199, 218, 238, 257, 276, 295, 315, 334, 354, 372];
  for (let i = 0; i < Math.min(conTelDigits.length, conTelXCoords.length); i++) {
    p1.drawText(conTelDigits[i], { x: conTelXCoords[i] + 2, y: 327, size: 8.5, font: fontBold, color: navy });
  }

  // Section B - Description of Business Activities (Clean coordinates without overlap)
  p1.drawText('The business operates as a retail buildware & hardware merchant, supplying building materials,', { x: 78, y: 158, size: 7.5, font: fontRegular, color: darkSlate });
  p1.drawText('hardware tools, timber, plumbing materials, paint & tinting (Paint Mecca), and pool chemicals.', { x: 78, y: 144, size: 7.5, font: fontRegular, color: darkSlate });
  p1.drawText(`Requested Industry Subclass: ${data.requestedSubclass}`, { x: 78, y: 116, size: 7.5, font: fontBold, color: navy });
  p1.drawText(`Current Classification on Record: ${data.currentNature}`, { x: 78, y: 102, size: 7.5, font: fontBold, color: navy });
  p1.drawText(`Reason for Change: Business is exclusively retail trade; requires reclassification to Subclass 0710.`, { x: 78, y: 88, size: 7.5, font: fontRegular, color: darkSlate });
  p1.drawText(`Effective Date of Change: ${data.effectiveDate}`, { x: 78, y: 74, size: 7.5, font: fontBold, color: navy });

  // ========================== PAGE 2 ==========================
  const p2 = pages[1];

  // Website
  p2.drawText('N/A', { x: 185, y: 695, size: 8, font: fontRegular, color: darkSlate });

  // Regulatory body tick [NO]
  p2.drawText('X', { x: 414, y: 671, size: 9, font: fontBold, color: navy });

  // 5 Clients List (Clean spacing)
  const clientYCoords = [557, 509, 461, 413, 365];
  for (let i = 0; i < Math.min(data.clients.length, clientYCoords.length); i++) {
    const c = data.clients[i];
    const cText = `${i + 1}. ${c.name} | Contact: ${c.contact} | Service: ${c.service}`;
    p2.drawText(cText, { x: 78, y: clientYCoords[i], size: 7.2, font: fontRegular, color: darkSlate });
  }

  // 5 Key Activities (Clean spacing)
  const actYCoords = [229, 208, 187, 166, 145];
  for (let i = 0; i < Math.min(data.keyActivities.length, actYCoords.length); i++) {
    p2.drawText(data.keyActivities[i], { x: 95, y: actYCoords[i], size: 7.5, font: fontRegular, color: darkSlate });
  }

  // 8 Pictures Checkbox
  p2.drawText('[ X ] YES - 10 colour photographs of business premises & active operations attached.', { x: 74, y: 80, size: 7.8, font: fontBold, color: navy });

  // ========================== PAGE 3 ==========================
  const p3 = pages[2];

  // Section C - Document Ticks
  p3.drawText('X', { x: 443, y: 659, size: 9, font: fontBold, color: navy }); // AFS
  p3.drawText('X', { x: 443, y: 639, size: 9, font: fontBold, color: navy }); // Proof of Address
  p3.drawText('X', { x: 443, y: 619, size: 9, font: fontBold, color: navy }); // Pictures

  // Employer Representative Signatures
  p3.drawText(data.directorName, { x: 195, y: 415, size: 8.5, font: fontBold, color: navy });
  p3.drawText(data.dateStr, { x: 195, y: 393, size: 8.5, font: fontBold, color: navy });
  p3.drawText(data.directorTitle, { x: 195, y: 372, size: 8.5, font: fontBold, color: navy });

  // Consultant Signatures
  p3.drawText(data.consultantName, { x: 195, y: 280, size: 8.5, font: fontBold, color: navy });
  p3.drawText(data.dateStr, { x: 195, y: 258, size: 8.5, font: fontBold, color: navy });
  p3.drawText('Registered Accounting Officer (My Accountant - CIBA #3561)', { x: 195, y: 237, size: 8, font: fontBold, color: navy });

  const pdfBytes = await pdfDoc.save();
  return {
    buffer: Buffer.from(pdfBytes),
    fileName: `COIDA_CF1B_Application_Form_${data.employerName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
  };
}

async function run() {
  const dir = path.resolve('scratch/order_10072_audit');

  const employerData = {
    companyName: 'BUILD X HARDWARE AND BUILDWARE CC',
    regNumber: '2000/027067/23',
    vatNumber: '4700191275',
    coidaRef: '990000235838',
    directorName: 'Clyle Kemm',
    directorId: '7209235069083',
    directorTitle: 'Member',
    city: 'Fochville',
    province: 'Gauteng',
    dateStr: '21 August 2026',
    targetSubclass: 'Subclass 0710 (Commerce / General Retailers & Hardware Merchants)',
  };

  const poa = await generateCoidaPowerOfAttorneyPdf(employerData);
  fs.writeFileSync(path.join(dir, poa.fileName), poa.buffer);
  console.log(`✓ Generated POA: ${poa.fileName}`);

  const cf1bData = {
    employerName: 'BUILD X HARDWARE AND BUILDWARE CC',
    cfRegNo: '990000235838',
    uifRegNo: '72508053',
    cipcRegNo: '200002706723',
    taxNo: '4700191275',
    businessAddress: '127 Church Street, Fochville, Gauteng',
    city: 'Fochville',
    province: 'Gauteng',
    code: '2515',
    employerTel: '0187713833',
    mobileTel: '0825563640',
    employerEmail: 'paintmecca@telkomsa.net',
    consultantEmail: 'kev@thinkestry.co.za',
    consultantTel: '0101091625',
    currentNature: 'Building Construction',
    requestedSubclass: 'Subclass 0710 (Commerce / General Retailers & Hardware Merchants)',
    effectiveDate: '15 September 2025',
    clients: [
      { name: 'Build-Rite Contractors', contact: '018 771 2244', service: 'Retail supply of sand, cement & hardware' },
      { name: 'Fochville Plumbing & Electrical', contact: '018 771 4500', service: 'Supply of plumbing fittings & pipes' },
      { name: 'Disa Renovations CC', contact: '082 334 1290', service: 'Retail supply of timber, paint & roofing' },
      { name: 'Westvaal Construction Services', contact: '018 771 5820', service: 'Supply of building aggregates & tools' },
      { name: 'Local Consumers & DIY Walk-ins', contact: '018 771 3833', service: 'General hardware, tools, paint & pool care' },
    ],
    keyActivities: [
      'Retail sale and supply of general hardware, tools, fasteners, and building consumables',
      'Retail supply and distribution of building sand, aggregate stone, bricks, and cement',
      'Retail supply of plumbing fittings, PVC piping, sanitaryware, and drainage products',
      'Paint mixing, colour tinting, waterproofing, and protective coatings (Paint Mecca)',
      'Retail supply of pool chemicals, timber, wire fencing, and small building equipment',
    ],
    directorName: 'Clyle Kemm',
    directorTitle: 'Member',
    consultantName: 'Kevin Freese',
    dateStr: '21 / 08 / 2026',
  };

  const cf1b = await generateCoidaCf1bOfficialPdf(cf1bData);
  fs.writeFileSync(path.join(dir, cf1b.fileName), cf1b.buffer);
  console.log(`✓ Generated Form CF-1B: ${cf1b.fileName}`);
}

run().catch(console.error);
