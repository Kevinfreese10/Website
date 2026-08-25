/**
 * Letter of engagement between My Accountant and a client. Signature: kevin (practice sign-off)
 * with a blank client acceptance line. Single page. Layout ported from v1
 * generateEngagementLetterDraft; scope, fee terms and start date are fields, not boilerplate.
 */
import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';
import { A4, COLORS, FIRM, MARGIN, ansi, drawClientSignatureLine, drawDraftWatermark, drawKevinSignatureBlock, drawLetterhead, drawParagraph, embedFonts, formatDateLong, safeFileName } from '../helpers';
import { MissingFieldsError, type OrderDocumentContext, type TemplateDefinition } from '../types';

const schema = z.object({
  entityName: z.string().min(1),
  registrationNumber: z.string().optional(),
  clientContactName: z.string().min(1),
  clientContactCapacity: z.string().default('Director'),
  /** Services engaged, one per line. */
  services: z.array(z.string().min(1)).min(1),
  /** Fee basis and payment terms, e.g. 'R 2,500 once-off, payable in advance'. */
  feeTerms: z.string().min(1),
  /** ISO date the engagement starts. */
  startDate: z.string().min(1),
  orderId: z.string().optional(),
});
export type EngagementLetterFields = z.infer<typeof schema>;

export const engagementLetter: TemplateDefinition<EngagementLetterFields> = {
  id: 'engagement_letter',
  title: 'Letter of Engagement',
  description: 'Professional engagement letter and terms of service on My Accountant letterhead. Kevin signs on approval; the client accepts on a blank line.',
  category: 'letter',
  signature: 'kevin',
  schema,
  fieldLabels: {
    entityName: 'Client / entity name', registrationNumber: 'Registration number', clientContactName: 'Client contact name', clientContactCapacity: 'Client contact capacity',
    services: 'Services engaged', feeTerms: 'Fee and payment terms', startDate: 'Engagement start date', orderId: 'Order reference',
  },
  async render(fields, options) {
    const parsed = schema.safeParse(fields);
    if (!parsed.success) throw new MissingFieldsError('engagement_letter', parsed.error.issues.map(i => i.path.join('.')));
    const f = parsed.data;
    const warnings: string[] = [];
    if (!f.registrationNumber) warnings.push('registrationNumber not supplied - omitted from the client line');

    const pdf = await PDFDocument.create();
    const page = pdf.addPage(A4);
    const fonts = await embedFonts(pdf);
    const { width } = page.getSize();
    const contentW = width - MARGIN * 2;
    let y = drawLetterhead(page, fonts);

    page.drawText(formatDateLong(options.date), { x: MARGIN, y, size: 8.5, font: fonts.regular, color: COLORS.body });
    y -= 16;
    page.drawText('PROFESSIONAL ENGAGEMENT LETTER & TERMS OF SERVICE', { x: MARGIN, y, size: 11, font: fonts.bold, color: COLORS.navy });
    y -= 12;
    page.drawText(ansi(`CLIENT: ${f.entityName.toUpperCase()}${f.registrationNumber ? ` (REG: ${f.registrationNumber})` : ''}${f.orderId ? ` | ORDER REF: #${f.orderId}` : ''}`), { x: MARGIN, y, size: 8, font: fonts.bold, color: COLORS.gold });
    y -= 20;

    const heading = (t: string) => { page.drawText(t, { x: MARGIN, y, size: 9, font: fonts.bold, color: COLORS.navy }); y -= 14; };
    const para = (t: string, size = 8.5, lh = 12) => { y = drawParagraph(page, t, MARGIN, y, contentW, fonts.regular, size, COLORS.body, lh); y -= 6; };

    para(`This letter confirms the terms on which ${FIRM.nameTitle} ("the Practice") will provide professional services to ${f.entityName} ("the Client"), represented by ${f.clientContactName} (${f.clientContactCapacity}), with effect from ${formatDateLong(f.startDate)}.`);

    heading('1. SCOPE OF PROFESSIONAL SERVICES');
    for (const s of f.services) {
      page.drawText('-', { x: MARGIN + 5, y, size: 8, font: fonts.regular, color: COLORS.body });
      y = drawParagraph(page, s, MARGIN + 14, y, contentW - 14, fonts.regular, 8, COLORS.body, 11.5);
      y -= 2;
    }
    y -= 6;

    heading('2. FEES & PAYMENT TERMS');
    para(f.feeTerms);

    heading('3. CLIENT RESPONSIBILITIES & STATUTORY ACCURACY');
    para('The Client confirms that all records, bank statements, identification copies and declarations furnished to the Practice are authentic, complete and legally valid, and undertakes to notify the Practice promptly of any change. The Client remains solely responsible for the operational management of its business and for the completeness of the information on which the Practice relies.');

    heading('4. CONFIDENTIALITY & DATA PROTECTION (POPIA)');
    para('All confidential business and personal information provided by the Client is processed in compliance with the Protection of Personal Information Act 4 of 2013 and the ethical standards of the ' + FIRM.professionalBody + '. Information is disclosed to regulators only as required to perform the services above.');

    heading('5. ACCEPTANCE');
    para('Signature of this letter by both parties confirms acceptance of these terms. Either party may terminate the engagement on written notice; fees for work performed to the date of termination remain payable.');
    y -= 6;

    if (y < 200) warnings.push('Letter is long; signature blocks are near the bottom margin. Consider shortening the services list.');
    y = await drawKevinSignatureBlock(pdf, page, fonts, Math.max(y, 150), { signed: options.signed, date: options.date });
    y -= 20;

    page.drawText(ansi(`ACCEPTED FOR AND ON BEHALF OF ${f.entityName.toUpperCase()}:`), { x: MARGIN, y, size: 7.5, font: fonts.bold, color: COLORS.navy });
    y -= 30;
    drawClientSignatureLine(page, fonts, y, `${f.clientContactName} - ${f.clientContactCapacity} | Date: ______________`, MARGIN, 260);

    if (!options.signed) drawDraftWatermark(pdf, fonts);
    const buffer = Buffer.from(await pdf.save());
    return { buffer, fileName: `Engagement_Letter_${safeFileName(f.entityName)}${f.orderId ? `_${f.orderId}` : ''}.pdf`, warnings, pageCount: 1 };
  },
  suggestFields(ctx: OrderDocumentContext) {
    return {
      entityName: ctx.entity.entityName,
      registrationNumber: ctx.entity.registrationNumber,
      clientContactName: ctx.entity.orderingContactName || ctx.entity.directorName,
      services: ctx.serviceTitle ? [ctx.serviceTitle] : undefined,
      orderId: ctx.orderNumber,
    };
  },
};
