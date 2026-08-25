/**
 * Special Power of Attorney: the entity's director appoints Kevin Freese / My Accountant to
 * represent it before a named authority. Signature: client (director) + witnesses; Kevin's
 * acceptance card is drawn via drawKevinSignatureBlock. Single page.
 * Ported layout/wording from v1 generatePowerOfAttorneyResolutionDraft + COIDA pack POA.
 */
import { z } from 'zod';
import { PDFDocument, rgb } from 'pdf-lib';
import { A4, COLORS, FIRM, MARGIN, ansi, drawClientSignatureLine, drawDraftWatermark, drawKevinSignatureBlock, drawLetterhead, drawParagraph, embedFonts, formatDateLong, safeFileName } from '../helpers';
import { MissingFieldsError, type OrderDocumentContext, type TemplateDefinition } from '../types';

const schema = z.object({
  entityName: z.string().min(1),
  registrationNumber: z.string().min(1),
  address: z.string().optional(),
  /** Director / member granting the power. */
  directorName: z.string().min(1),
  directorIdNumber: z.string().optional(),
  directorCapacity: z.string().default('Director'),
  /** The authority before which the representative may act, e.g. 'the Compensation Commissioner', 'SARS'. */
  authority: z.string().min(1),
  /** Governing act / reference line under the title, e.g. 'Compensation for Occupational Injuries and Diseases Act, 1993'. */
  actReference: z.string().optional(),
  /** Enumerated powers granted, in order. */
  powers: z.array(z.string().min(1)).min(1),
  /** ISO date from which the power is effective. Left blank with a warning when absent. */
  effectiveDate: z.string().optional(),
  orderId: z.string().optional(),
});
export type PowerOfAttorneyFields = z.infer<typeof schema>;

export const powerOfAttorney: TemplateDefinition<PowerOfAttorneyFields> = {
  id: 'power_of_attorney',
  title: 'Special Power of Attorney',
  description: 'Director appoints Kevin Freese (My Accountant) to represent the entity before a named authority. Director signs before witnesses; Kevin accepts on approval.',
  category: 'letter',
  signature: 'client',
  schema,
  fieldLabels: {
    entityName: 'Entity name', registrationNumber: 'Registration number', address: 'Registered address', directorName: 'Director / grantor name',
    directorIdNumber: 'Director ID number', directorCapacity: 'Director capacity', authority: 'Authority represented before', actReference: 'Governing act reference',
    powers: 'Powers granted', effectiveDate: 'Effective date', orderId: 'Order reference',
  },
  async render(fields, options) {
    const parsed = schema.safeParse(fields);
    if (!parsed.success) throw new MissingFieldsError('power_of_attorney', parsed.error.issues.map(i => i.path.join('.')));
    const f = parsed.data;
    const warnings: string[] = [];

    const pdf = await PDFDocument.create();
    const page = pdf.addPage(A4);
    const fonts = await embedFonts(pdf);
    const { width } = page.getSize();
    const contentW = width - MARGIN * 2;
    let y = drawLetterhead(page, fonts);

    // Title box
    page.drawRectangle({ x: MARGIN, y: y - 24, width: contentW, height: 26, color: rgb(0.97, 0.98, 0.99), borderColor: rgb(0.85, 0.88, 0.92), borderWidth: 1 });
    page.drawText('SPECIAL POWER OF ATTORNEY & STATUTORY AUTHORISATION', { x: MARGIN + 15, y: y - 12, size: 10.5, font: fonts.bold, color: COLORS.navy });
    page.drawText(ansi(f.actReference ? f.actReference.toUpperCase() : `IN RESPECT OF: ${f.entityName.toUpperCase()} (REGISTRATION NO: ${f.registrationNumber})`), { x: MARGIN + 15, y: y - 21, size: 7, font: fonts.bold, color: COLORS.gold });
    y -= 40;

    const idPart = f.directorIdNumber ? ` (Identity Number: ${f.directorIdNumber})` : '';
    if (!f.directorIdNumber) warnings.push('directorIdNumber not supplied - left blank');
    const addrPart = f.address ? `, having its registered address at ${f.address}` : '';
    if (!f.address) warnings.push('address not supplied - omitted from the introduction');
    const intro = `I, the undersigned, ${f.directorName}${idPart}, in my capacity as ${f.directorCapacity} of ${f.entityName} (Registration Number: ${f.registrationNumber})${addrPart}, do hereby nominate, constitute and appoint:`;
    y = drawParagraph(page, intro, MARGIN, y, contentW, fonts.regular, 8.5, COLORS.body, 12);
    y -= 6;

    // Appointee card
    page.drawRectangle({ x: MARGIN, y: y - 32, width: contentW, height: 34, color: rgb(0.97, 0.98, 0.99), borderColor: rgb(0.85, 0.88, 0.92), borderWidth: 0.5 });
    page.drawText(ansi(`${FIRM.signatory.toUpperCase()} (ID NUMBER: ${FIRM.signatoryId})`), { x: MARGIN + 10, y: y - 11, size: 8.5, font: fonts.bold, color: COLORS.navy });
    page.drawText(ansi(`of ${FIRM.nameTitle} (Registration Number: ${FIRM.regNumber}) | ${FIRM.designationShort} | ${FIRM.practiceNumber}`), { x: MARGIN + 10, y: y - 23, size: 7.5, font: fonts.regular, color: COLORS.body });
    y -= 44;

    const purpose = `to be the true and lawful attorney and agent of ${f.entityName} (the "Company"), with full power and authority to represent the Company before ${f.authority} and, for that purpose, to:`;
    y = drawParagraph(page, purpose, MARGIN, y, contentW, fonts.regular, 8.5, COLORS.body, 12);
    y -= 8;

    f.powers.forEach((p, i) => {
      page.drawText(`${i + 1}.`, { x: MARGIN + 4, y, size: 8.5, font: fonts.bold, color: COLORS.navy });
      y = drawParagraph(page, p, MARGIN + 20, y, contentW - 20, fonts.regular, 8.5, COLORS.body, 12);
      y -= 4;
    });
    y -= 6;

    const effective = f.effectiveDate ? `This Power of Attorney is effective from ${formatDateLong(f.effectiveDate)} and` : 'This Power of Attorney';
    if (!f.effectiveDate) warnings.push('effectiveDate not supplied - validity clause has no commencement date');
    const validity = `${effective} shall remain in full force and effect until revoked in writing by the Company. The Company hereby ratifies and confirms, and agrees to ratify and confirm, all lawful acts done by the appointed representative under this mandate.`;
    y = drawParagraph(page, validity, MARGIN, y, contentW, fonts.regular, 8.5, COLORS.body, 12);
    y -= 16;

    page.drawText('SIGNED AT _____________________ ON THIS _______ DAY OF ______________ 20___', { x: MARGIN, y, size: 8.5, font: fonts.bold, color: COLORS.navy });
    y -= 34;

    if (y < 200) warnings.push('Document is long; signature area is near the bottom margin. Consider shortening the powers.');

    // Grantor (left) with witnesses (right), then Kevin's acceptance below.
    const colW = 220;
    const rightX = MARGIN + contentW - colW;
    drawClientSignatureLine(page, fonts, y, `${f.directorName} - ${f.directorCapacity}, ${f.entityName}`, MARGIN, colW);
    drawClientSignatureLine(page, fonts, y, 'Witness 1 - full name and signature', rightX, colW);
    y -= 38;
    drawClientSignatureLine(page, fonts, y, 'Witness 2 - full name and signature', rightX, colW);
    y -= 44;

    await drawKevinSignatureBlock(pdf, page, fonts, Math.max(y, 70), { signed: options.signed, date: options.date, forEntityLine: 'ACCEPTED BY APPOINTED REPRESENTATIVE:' });

    if (!options.signed) drawDraftWatermark(pdf, fonts);
    const buffer = Buffer.from(await pdf.save());
    return { buffer, fileName: `Power_of_Attorney_${safeFileName(f.entityName)}${f.orderId ? `_${f.orderId}` : ''}.pdf`, warnings, pageCount: 1 };
  },
  suggestFields(ctx: OrderDocumentContext) {
    return {
      entityName: ctx.entity.entityName,
      registrationNumber: ctx.entity.registrationNumber,
      address: ctx.entity.address,
      directorName: ctx.entity.directorName,
      directorIdNumber: ctx.entity.idNumber,
      orderId: ctx.orderNumber,
    };
  },
};
