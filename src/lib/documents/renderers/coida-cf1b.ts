/**
 * COIDA Form CF-1B — Application for change of nature of business / tariff classification.
 * The official 3-page Compensation Fund PDF is not in public/templates (v1 read it from a local
 * Downloads folder), so this renders a faithful generated 3-page equivalent with the same
 * sections (Section A employer particulars, Section B business description, page 2 trade
 * clients / key activities / photographs, page 3 supporting documents + signature blocks).
 * Employer signs by hand; Kevin's consultant block is drawn via drawKevinSignatureBlock.
 */
import { z } from 'zod';
import { PDFDocument, rgb, type PDFPage } from 'pdf-lib';
import { A4, COLORS, FIRM, MARGIN, ansi, drawClientSignatureLine, drawDraftWatermark, drawKevinSignatureBlock, drawParagraph, embedFonts, formatDateLong, safeFileName, type Fonts } from '../helpers';
import { answer } from '../context';
import { MissingFieldsError, type OrderDocumentContext, type TemplateDefinition } from '../types';

const schema = z.object({
  employerName: z.string().min(1),
  cfRegistrationNumber: z.string().min(1),
  uifRegistrationNumber: z.string().optional(),
  cipcRegistrationNumber: z.string().min(1),
  taxNumber: z.string().optional(),
  address: z.string().min(1),
  city: z.string().min(1),
  province: z.string().min(1),
  postalCode: z.string().optional(),
  telephone: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().optional(),
  businessDescription: z.string().min(1),
  currentClassification: z.string().min(1),
  targetSubclass: z.string().min(1),
  reasonForChange: z.string().min(1),
  /** ISO or display date from which the new classification applies. */
  effectiveDate: z.string().min(1),
  tradeClients: z.array(z.object({ name: z.string().min(1), contact: z.string().optional(), goodsServices: z.string().optional() })).max(5).optional(),
  keyActivities: z.array(z.string().min(1)).max(5).optional(),
  photographsAttached: z.boolean().optional(),
  supportingDocuments: z.object({
    financialStatements: z.boolean().optional(),
    proofOfAddress: z.boolean().optional(),
    photographs: z.boolean().optional(),
    other: z.array(z.string()).optional(),
  }).optional(),
  employerSignatoryName: z.string().min(1),
  employerSignatoryCapacity: z.string().min(1),
  orderId: z.string().optional(),
});
export type CoidaCf1bFields = z.infer<typeof schema>;

export const coidaCf1b: TemplateDefinition<CoidaCf1bFields> = {
  id: 'coida_cf1b',
  title: 'COIDA Form CF-1B - Change of Nature of Business',
  description: 'Generated 3-page equivalent of the Compensation Fund CF-1B (change of nature of business / subclass). Employer signs; My Accountant consultant block on page 3.',
  category: 'statutory_form',
  signature: 'client',
  schema,
  fieldLabels: {
    employerName: 'Employer registered name', cfRegistrationNumber: 'Compensation Fund registration number', uifRegistrationNumber: 'UIF registration number',
    cipcRegistrationNumber: 'CIPC registration number', taxNumber: 'Income tax number', address: 'Business physical address', city: 'City / town', province: 'Province',
    postalCode: 'Postal code', telephone: 'Telephone', mobile: 'Mobile', email: 'Employer email', businessDescription: 'Description of business activities',
    currentClassification: 'Current classification on record', targetSubclass: 'Requested subclass', reasonForChange: 'Reason for change', effectiveDate: 'Effective date of change',
    tradeClients: 'Five representative trade clients', keyActivities: 'Five key business activities', photographsAttached: 'Photographs of premises attached',
    supportingDocuments: 'Supporting documents attached', employerSignatoryName: 'Employer signatory name', employerSignatoryCapacity: 'Employer signatory capacity', orderId: 'Order number',
  },
  async render(fields, options) {
    const parsed = schema.safeParse(fields);
    if (!parsed.success) throw new MissingFieldsError('coida_cf1b', parsed.error.issues.map(i => i.path.join('.')));
    const f = parsed.data;
    const warnings: string[] = ['Generated equivalent of CF-1B - confirm the Compensation Fund accepts it, or add the official PDF to public/templates/CF-1B.pdf'];

    const pdf = await PDFDocument.create();
    const fonts = await embedFonts(pdf);
    const [width, height] = A4;
    const contentW = width - MARGIN * 2;
    const navy = COLORS.navy, slate = COLORS.body, grey = COLORS.grey;

    const newPage = (n: number): { page: PDFPage; y: number } => {
      const page = pdf.addPage(A4);
      page.drawRectangle({ x: MARGIN, y: height - 85, width: contentW, height: 48, color: navy });
      page.drawText('COMPENSATION FUND - DEPARTMENT OF EMPLOYMENT AND LABOUR', { x: MARGIN + 15, y: height - 58, size: 11, font: fonts.bold, color: rgb(1, 1, 1) });
      page.drawText('FORM CF-1B: APPLICATION FOR CHANGE OF NATURE OF BUSINESS / TARIFF CLASSIFICATION', { x: MARGIN + 15, y: height - 72, size: 7.5, font: fonts.bold, color: COLORS.gold });
      page.drawText(`Page ${n} of 3`, { x: width - MARGIN - 50, y: height - 72, size: 7, font: fonts.regular, color: rgb(0.85, 0.88, 0.92) });
      page.drawText(ansi(`Employer: ${f.employerName}  |  CF Reg No: ${f.cfRegistrationNumber}`), { x: MARGIN, y: height - 97, size: 7, font: fonts.regular, color: grey });
      page.drawText('Compensation for Occupational Injuries and Diseases Act, 1993 (Act 130 of 1993)', { x: MARGIN, y: 30, size: 6.5, font: fonts.italic, color: grey });
      return { page, y: height - 115 };
    };
    const header = (page: PDFPage, title: string, y: number) => {
      page.drawRectangle({ x: MARGIN, y: y - 16, width: contentW, height: 18, color: rgb(0.95, 0.97, 0.99), borderColor: rgb(0.85, 0.88, 0.92), borderWidth: 1 });
      page.drawText(ansi(title), { x: MARGIN + 10, y: y - 12, size: 8.5, font: fonts.bold, color: navy });
      return y - 26;
    };
    const row = (page: PDFPage, label: string, value: string | undefined, y: number, warnLabel?: string) => {
      page.drawText(ansi(label), { x: MARGIN + 10, y, size: 8, font: fonts.bold, color: rgb(0.25, 0.3, 0.35) });
      if (value) page.drawText(ansi(value), { x: MARGIN + 185, y, size: 8, font: fonts.regular, color: rgb(0.05, 0.05, 0.05) });
      else if (warnLabel) warnings.push(`${warnLabel} not supplied - left blank`);
      page.drawLine({ start: { x: MARGIN + 180, y: y - 2 }, end: { x: width - MARGIN - 10, y: y - 2 }, thickness: 0.5, color: rgb(0.88, 0.91, 0.94) });
      return y - 16;
    };
    const boxLine = (page: PDFPage, label: string, value: string | undefined, y: number, digits: number, warnLabel?: string) => {
      page.drawText(ansi(label), { x: MARGIN + 10, y, size: 8, font: fonts.bold, color: rgb(0.25, 0.3, 0.35) });
      const d = (value || '').replace(/\D/g, '');
      if (!value && warnLabel) warnings.push(`${warnLabel} not supplied - left blank`);
      const bw = 15;
      for (let i = 0; i < digits; i++) {
        const x = MARGIN + 185 + i * bw;
        page.drawRectangle({ x, y: y - 4, width: bw, height: 14, borderColor: grey, borderWidth: 0.5 });
        if (d[i]) page.drawText(d[i], { x: x + 4, y, size: 8.5, font: fonts.bold, color: navy });
      }
      if (value && d.length > digits) page.drawText(ansi(`(${value})`), { x: MARGIN + 190 + digits * bw, y, size: 6.5, font: fonts.regular, color: grey });
      return y - 20;
    };
    const tick = (page: PDFPage, x: number, y: number, checked: boolean | undefined) => {
      page.drawRectangle({ x, y: y - 2, width: 10, height: 10, borderColor: navy, borderWidth: 0.75 });
      if (checked) page.drawText('X', { x: x + 2, y, size: 8, font: fonts.bold, color: navy });
    };
    const paraBox = (page: PDFPage, text: string, y: number, minH: number) => {
      const bottom = drawParagraph(page, text, MARGIN + 12, y - 12, contentW - 24, fonts.regular, 8, slate, 11.5, false);
      const h = Math.max(minH, y - bottom + 6);
      page.drawRectangle({ x: MARGIN, y: y - h, width: contentW, height: h + 2, borderColor: rgb(0.85, 0.88, 0.92), borderWidth: 0.75 });
      return y - h - 10;
    };

    // ---- Page 1: Section A + B
    let { page, y } = newPage(1);
    y = header(page, 'SECTION A: EMPLOYER PARTICULARS', y);
    y = row(page, 'Registered name of employer:', f.employerName, y);
    y = boxLine(page, 'Compensation Fund reg no:', f.cfRegistrationNumber, y, 12);
    y = boxLine(page, 'UIF reference number:', f.uifRegistrationNumber, y, 8, 'UIF reference number');
    y = boxLine(page, 'CIPC registration number:', f.cipcRegistrationNumber, y, 12);
    y = boxLine(page, 'Income tax number:', f.taxNumber, y, 10, 'Income tax number');
    y = row(page, 'Business physical address:', f.address, y);
    y = row(page, 'City / town:', f.city, y);
    y = row(page, 'Province:', f.province, y);
    y = boxLine(page, 'Postal code:', f.postalCode, y, 4, 'Postal code');
    y = boxLine(page, 'Telephone number:', f.telephone, y, 10, 'Telephone');
    y = boxLine(page, 'Mobile number:', f.mobile, y, 10, 'Mobile');
    y = row(page, 'Employer e-mail address:', f.email, y, 'Employer email');
    y = row(page, 'Consultant e-mail address:', FIRM.email, y);
    y = row(page, 'Consultant telephone:', FIRM.tel, y);

    y -= 8;
    y = header(page, 'SECTION B: NATURE OF BUSINESS', y);
    page.drawText('Detailed description of business activities:', { x: MARGIN + 10, y, size: 8, font: fonts.bold, color: rgb(0.25, 0.3, 0.35) });
    y -= 6;
    y = paraBox(page, f.businessDescription, y, 60);
    y = row(page, 'Current classification on record:', f.currentClassification, y);
    y = row(page, 'Requested industry subclass:', f.targetSubclass, y);
    page.drawText('Reason for change:', { x: MARGIN + 10, y, size: 8, font: fonts.bold, color: rgb(0.25, 0.3, 0.35) });
    y -= 6;
    y = paraBox(page, f.reasonForChange, y, 30);
    y = row(page, 'Effective date of change:', f.effectiveDate, y);

    // ---- Page 2: trade clients, key activities, photographs
    ({ page, y } = newPage(2));
    y = header(page, 'SECTION B (CONTINUED): REPRESENTATIVE TRADE CLIENTS', y);
    page.drawText('List five representative clients / customers, a contact number and the goods or services supplied to each:', { x: MARGIN + 10, y, size: 7.5, font: fonts.italic, color: grey });
    y -= 14;
    const clients = f.tradeClients || [];
    if (clients.length < 5) warnings.push(`${clients.length} of 5 trade clients supplied - remaining rows left blank`);
    for (let i = 0; i < 5; i++) {
      const c = clients[i];
      page.drawRectangle({ x: MARGIN, y: y - 30, width: contentW, height: 40, borderColor: rgb(0.85, 0.88, 0.92), borderWidth: 0.75 });
      page.drawText(`${i + 1}.`, { x: MARGIN + 8, y: y - 6, size: 9, font: fonts.bold, color: navy });
      page.drawText('Client:', { x: MARGIN + 28, y: y - 6, size: 7, font: fonts.bold, color: grey });
      page.drawText('Contact:', { x: MARGIN + 330, y: y - 6, size: 7, font: fonts.bold, color: grey });
      page.drawText('Goods / services supplied:', { x: MARGIN + 28, y: y - 22, size: 7, font: fonts.bold, color: grey });
      if (c) {
        page.drawText(ansi(c.name), { x: MARGIN + 60, y: y - 6, size: 8, font: fonts.regular, color: slate });
        if (c.contact) page.drawText(ansi(c.contact), { x: MARGIN + 368, y: y - 6, size: 8, font: fonts.regular, color: slate });
        if (c.goodsServices) page.drawText(ansi(c.goodsServices), { x: MARGIN + 128, y: y - 22, size: 8, font: fonts.regular, color: slate });
      }
      y -= 48;
    }

    y -= 6;
    y = header(page, 'KEY BUSINESS ACTIVITIES', y);
    const acts = f.keyActivities || [];
    if (acts.length < 5) warnings.push(`${acts.length} of 5 key activities supplied - remaining lines left blank`);
    for (let i = 0; i < 5; i++) {
      page.drawText(`${i + 1}.`, { x: MARGIN + 10, y, size: 8.5, font: fonts.bold, color: navy });
      if (acts[i]) page.drawText(ansi(acts[i]), { x: MARGIN + 28, y, size: 8, font: fonts.regular, color: slate });
      page.drawLine({ start: { x: MARGIN + 26, y: y - 3 }, end: { x: width - MARGIN - 10, y: y - 3 }, thickness: 0.5, color: rgb(0.88, 0.91, 0.94) });
      y -= 20;
    }

    y -= 6;
    y = header(page, 'PHOTOGRAPHS OF BUSINESS PREMISES AND OPERATIONS', y);
    if (f.photographsAttached === undefined) warnings.push('Photographs attached (yes/no) not supplied - neither box ticked');
    tick(page, MARGIN + 10, y, f.photographsAttached === true);
    page.drawText('YES - colour photographs of the business premises and active operations are attached', { x: MARGIN + 26, y, size: 8, font: fonts.regular, color: slate });
    y -= 16;
    tick(page, MARGIN + 10, y, f.photographsAttached === false);
    page.drawText('NO - photographs not attached', { x: MARGIN + 26, y, size: 8, font: fonts.regular, color: slate });

    // ---- Page 3: supporting documents, declaration, signatures
    ({ page, y } = newPage(3));
    y = header(page, 'SECTION C: SUPPORTING DOCUMENTS ATTACHED', y);
    const sd = f.supportingDocuments || {};
    if (!f.supportingDocuments) warnings.push('Supporting document ticks not supplied - all boxes left unticked');
    const docs: Array<[string, boolean | undefined]> = [
      ['Latest annual financial statements / management accounts', sd.financialStatements],
      ['Proof of business address (lease / municipal account)', sd.proofOfAddress],
      ['Photographs of premises and operations', sd.photographs],
      ...((sd.other || []).map(o => [o, true] as [string, boolean])),
    ];
    for (const [label, checked] of docs) {
      page.drawText(ansi(label), { x: MARGIN + 10, y, size: 8, font: fonts.regular, color: slate });
      tick(page, width - MARGIN - 30, y, checked);
      page.drawLine({ start: { x: MARGIN + 10, y: y - 4 }, end: { x: width - MARGIN - 10, y: y - 4 }, thickness: 0.5, color: rgb(0.88, 0.91, 0.94) });
      y -= 20;
    }

    y -= 10;
    y = header(page, 'SECTION D: DECLARATION BY EMPLOYER', y);
    const dec = `I, the undersigned, ${f.employerSignatoryName}, in my capacity as ${f.employerSignatoryCapacity} of ${f.employerName} (CF Reg No ${f.cfRegistrationNumber}), declare that the particulars provided in this application and in the attached supporting documentation are true and correct, and apply to the Compensation Commissioner for the nature of business of the employer to be re-classified to ${f.targetSubclass} with effect from ${f.effectiveDate}.`;
    y = drawParagraph(page, dec, MARGIN + 10, y, contentW - 20, fonts.regular, 8.5, slate, 12.5);
    y -= 30;
    drawClientSignatureLine(page, fonts, y, `Signature: ${f.employerSignatoryName} (${f.employerSignatoryCapacity})`, MARGIN + 10, 240);
    drawClientSignatureLine(page, fonts, y, 'Date', MARGIN + 280, 120);
    y -= 44;
    page.drawText(ansi(`Full name: ${f.employerSignatoryName}`), { x: MARGIN + 10, y, size: 8, font: fonts.bold, color: navy });
    page.drawText(ansi(`Capacity: ${f.employerSignatoryCapacity}`), { x: MARGIN + 280, y, size: 8, font: fonts.bold, color: navy });

    y -= 36;
    y = header(page, 'SECTION E: APPOINTED CONSULTANT / REPRESENTATIVE', y);
    y = row(page, 'Consultant name:', FIRM.signatory, y);
    y = row(page, 'Practice:', `${FIRM.nameTitle} - ${FIRM.practiceNumber}`, y);
    y = row(page, 'Contact:', `${FIRM.tel} | ${FIRM.email}`, y);
    y = row(page, 'Date:', formatDateLong(options.date), y);
    y -= 8;
    await drawKevinSignatureBlock(pdf, page, fonts, y, { signed: options.signed, date: options.date, forEntityLine: `CONSULTANT FOR ${ansi(f.employerName).toUpperCase()} - ${FIRM.name}:` });

    if (!options.signed) drawDraftWatermark(pdf, fonts);
    const buffer = Buffer.from(await pdf.save());
    return { buffer, fileName: `COIDA_CF1B_${safeFileName(f.employerName)}${f.orderId ? `_${f.orderId}` : ''}.pdf`, warnings, pageCount: pdf.getPageCount() };
  },
  suggestFields(ctx: OrderDocumentContext): Partial<CoidaCf1bFields> {
    const out: Partial<CoidaCf1bFields> = {};
    const e = ctx.entity;
    if (e.entityName) out.employerName = e.entityName;
    if (e.registrationNumber) out.cipcRegistrationNumber = e.registrationNumber;
    if (e.taxNumber) out.taxNumber = e.taxNumber;
    if (e.address) out.address = e.address;
    const phone = answer(ctx, 'telephone') || e.phone;
    if (phone) out.telephone = phone;
    const email = answer(ctx, 'email') || e.email;
    if (email) out.email = email;
    if (e.directorName) out.employerSignatoryName = e.directorName;
    if (ctx.orderNumber) out.orderId = ctx.orderNumber;
    return out;
  },
};
// Fonts type imported for helper signatures above.
export type { Fonts as _CoidaFonts };
