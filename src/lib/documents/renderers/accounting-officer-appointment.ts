/**
 * Appointment of My Accountant / Kevin Freese as accounting officer for a stated purpose, with
 * Kevin's consent-to-act (drawKevinSignatureBlock) and a blank director acceptance line.
 * Signature: kevin. Single page. Wording ported from v1 generateAccountingOfficerConsentDraft
 * and audit_and_generate_10138; purpose-specific claims are supplied, not templated.
 */
import { z } from 'zod';
import { PDFDocument, rgb } from 'pdf-lib';
import { A4, COLORS, FIRM, MARGIN, ansi, drawClientSignatureLine, drawDraftWatermark, drawKevinSignatureBlock, drawLetterhead, drawParagraph, embedFonts, formatDateLong, safeFileName } from '../helpers';
import { MissingFieldsError, type OrderDocumentContext, type TemplateDefinition } from '../types';

const schema = z.object({
  entityName: z.string().min(1),
  registrationNumber: z.string().min(1),
  address: z.string().optional(),
  taxNumber: z.string().optional(),
  directorName: z.string().min(1),
  directorIdNumber: z.string().optional(),
  addressee: z.string().default('TO WHOM IT MAY CONCERN'),
  /** Why the appointment is being confirmed, e.g. 'NCR registration as a credit provider'. */
  purpose: z.string().min(1),
  /** Optional extra confirmations (e.g. Reg 67/68 undertakings) drafted from verified facts. */
  additionalParagraphs: z.array(z.string().min(1)).optional(),
  /** ISO date from which the appointment takes effect; defaults to the render date with a warning. */
  effectiveDate: z.string().optional(),
  orderId: z.string().optional(),
});
export type AccountingOfficerAppointmentFields = z.infer<typeof schema>;

export const accountingOfficerAppointment: TemplateDefinition<AccountingOfficerAppointmentFields> = {
  id: 'accounting_officer_appointment',
  title: 'Accounting Officer Appointment & Consent',
  description: 'Letter on My Accountant letterhead confirming appointment of Kevin Freese / My Accountant as accounting officer for a stated purpose. Kevin consents on approval; director accepts on a blank line.',
  category: 'letter',
  signature: 'kevin',
  schema,
  fieldLabels: {
    entityName: 'Entity name', registrationNumber: 'Registration number', address: 'Registered address', taxNumber: 'SARS tax reference', directorName: 'Director name',
    directorIdNumber: 'Director ID number', addressee: 'Addressed to', purpose: 'Purpose of appointment', additionalParagraphs: 'Additional confirmations', effectiveDate: 'Effective date', orderId: 'Order reference',
  },
  async render(fields, options) {
    const parsed = schema.safeParse(fields);
    if (!parsed.success) throw new MissingFieldsError('accounting_officer_appointment', parsed.error.issues.map(i => i.path.join('.')));
    const f = parsed.data;
    const warnings: string[] = [];

    const pdf = await PDFDocument.create();
    const page = pdf.addPage(A4);
    const fonts = await embedFonts(pdf);
    const { width } = page.getSize();
    const contentW = width - MARGIN * 2;
    let y = drawLetterhead(page, fonts);

    page.drawText(formatDateLong(options.date), { x: MARGIN, y, size: 8.5, font: fonts.regular, color: COLORS.body });
    y -= 16;
    page.drawText('CONSENT & CONFIRMATION OF APPOINTMENT AS ACCOUNTING OFFICER', { x: MARGIN, y, size: 10.5, font: fonts.bold, color: COLORS.navy });
    y -= 16;

    const meta: { label: string; value: string }[] = [
      { label: 'Applicant Entity:', value: f.entityName },
      { label: 'Registration Number:', value: f.registrationNumber },
    ];
    if (f.taxNumber) meta.push({ label: 'SARS Tax Reference Number:', value: f.taxNumber });
    meta.push({ label: 'Director / Applicant:', value: `${f.directorName}${f.directorIdNumber ? ` (ID: ${f.directorIdNumber})` : ''}` });
    if (f.address) meta.push({ label: 'Registered Office Address:', value: f.address }); else warnings.push('address not supplied - omitted from the details table');
    meta.push({ label: 'Addressed To:', value: f.addressee });
    const tableH = meta.length * 10.5 + 8;
    page.drawRectangle({ x: MARGIN, y: y - tableH, width: contentW, height: tableH, color: rgb(0.98, 0.98, 0.99), borderColor: rgb(0.88, 0.91, 0.94), borderWidth: 0.75 });
    let my = y - 10;
    for (const row of meta) {
      page.drawText(ansi(row.label), { x: MARGIN + 12, y: my, size: 7.2, font: fonts.bold, color: COLORS.body });
      page.drawText(ansi(row.value), { x: MARGIN + 145, y: my, size: 7.2, font: fonts.regular, color: COLORS.navy });
      my -= 10.5;
    }
    y -= tableH + 14;

    page.drawText(ansi(f.addressee.toUpperCase()), { x: MARGIN, y, size: 8.5, font: fonts.bold, color: COLORS.body });
    y -= 13;
    y = drawParagraph(page, `RE: APPOINTMENT AS ACCOUNTING OFFICER OF ${f.entityName.toUpperCase()} - ${f.purpose.toUpperCase()}`, MARGIN, y, contentW, fonts.bold, 8, COLORS.navy, 10.5);
    y -= 6;

    const effective = f.effectiveDate ? formatDateLong(f.effectiveDate) : formatDateLong(options.date);
    if (!f.effectiveDate) warnings.push('effectiveDate not supplied - appointment shown as effective from the letter date');
    const paras = [
      `I, ${FIRM.signatory} of ${FIRM.nameTitle} (Registration Number: ${FIRM.regNumber}), hereby confirm my consent to act, and my acceptance of appointment, as the Accounting Officer of ${f.entityName} (Registration Number: ${f.registrationNumber}) with effect from ${effective}, for the purpose of ${f.purpose}.`,
      `I confirm that I am in good standing with the ${FIRM.professionalBody} as a Chartered Business Accountant in Practice (${FIRM.designationShort}), registered with SARS as a tax practitioner (PR-0098553), and that neither I nor the practice is disqualified in terms of the Companies Act 71 of 2008 or the Close Corporations Act 69 of 1984 from holding this appointment.`,
      ...(f.additionalParagraphs || []),
      'Please do not hesitate to contact our offices directly should you require any further information or verification.',
    ];
    for (const p of paras) {
      y = drawParagraph(page, p, MARGIN, y, contentW, fonts.regular, 8.5, COLORS.body, 12);
      y -= 8;
    }

    if (y < 200) warnings.push('Letter is long; signature blocks are near the bottom margin. Consider shortening additionalParagraphs.');
    y = await drawKevinSignatureBlock(pdf, page, fonts, Math.max(y - 4, 150), { signed: options.signed, date: options.date, forEntityLine: `CONSENT TO ACT - FOR ${FIRM.name} (REG: ${FIRM.regNumber}):` });
    y -= 20;

    page.drawText(ansi(`ACCEPTED FOR AND ON BEHALF OF ${f.entityName.toUpperCase()}:`), { x: MARGIN, y, size: 7.5, font: fonts.bold, color: COLORS.navy });
    y -= 30;
    drawClientSignatureLine(page, fonts, y, `${f.directorName} - Director | Date: ______________`, MARGIN, 260);

    if (!options.signed) drawDraftWatermark(pdf, fonts);
    const buffer = Buffer.from(await pdf.save());
    return { buffer, fileName: `Accounting_Officer_Appointment_${safeFileName(f.entityName)}${f.orderId ? `_${f.orderId}` : ''}.pdf`, warnings, pageCount: 1 };
  },
  suggestFields(ctx: OrderDocumentContext) {
    return {
      entityName: ctx.entity.entityName,
      registrationNumber: ctx.entity.registrationNumber,
      address: ctx.entity.address,
      taxNumber: ctx.entity.taxNumber,
      directorName: ctx.entity.directorName,
      directorIdNumber: ctx.entity.idNumber,
      orderId: ctx.orderNumber,
    };
  },
};
