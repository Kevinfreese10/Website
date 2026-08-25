/**
 * Request to CIPC for voluntary deregistration under s82(3) of the Companies Act 71 of 2008,
 * on the client's own letterhead, signed by the directors. Signature: client. Single page.
 * The confirmations (no assets/liabilities, not trading, tax affairs in order) are supplied as
 * fields - never assumed.
 */
import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';
import { A4, COLORS, MARGIN, ansi, drawClientSignatureLine, drawDraftWatermark, drawParagraph, embedFonts, formatDateLong, safeFileName } from '../helpers';
import { MissingFieldsError, type OrderDocumentContext, type TemplateDefinition } from '../types';
import { drawClientLetterhead } from './instruction-letter';

const schema = z.object({
  entityName: z.string().min(1),
  registrationNumber: z.string().min(1),
  address: z.string().optional(),
  /** Why the entity is to be deregistered, e.g. 'The company has ceased trading and has no intention of resuming business.' */
  reason: z.string().min(1),
  /** Statements the directors confirm, each drafted from verified facts. */
  confirmations: z.array(z.string().min(1)).min(1),
  /** Directors who sign. */
  directors: z.array(z.string().min(1)).min(1),
  orderId: z.string().optional(),
});
export type DeregistrationRequestLetterFields = z.infer<typeof schema>;

export const deregistrationRequestLetter: TemplateDefinition<DeregistrationRequestLetterFields> = {
  id: 'deregistration_request_letter',
  title: 'CIPC Deregistration Request (s82(3))',
  description: "Letter on the client's own letterhead to CIPC requesting voluntary deregistration under s82(3) of the Companies Act, with the directors' confirmations. All directors sign on blank lines.",
  category: 'letter',
  signature: 'client',
  schema,
  fieldLabels: {
    entityName: 'Entity name', registrationNumber: 'Registration number', address: 'Entity address', reason: 'Reason for deregistration',
    confirmations: "Directors' confirmations", directors: 'Signing directors', orderId: 'Order reference',
  },
  async render(fields, options) {
    const parsed = schema.safeParse(fields);
    if (!parsed.success) throw new MissingFieldsError('deregistration_request_letter', parsed.error.issues.map(i => i.path.join('.')));
    const f = parsed.data;
    const warnings: string[] = [];
    if (!f.address) warnings.push('address not supplied - omitted from the letterhead');

    const pdf = await PDFDocument.create();
    const page = pdf.addPage(A4);
    const fonts = await embedFonts(pdf);
    const { width } = page.getSize();
    const contentW = width - MARGIN * 2;
    let y = drawClientLetterhead(page, fonts, f);

    page.drawText(formatDateLong(options.date), { x: MARGIN, y, size: 8.5, font: fonts.regular, color: COLORS.body });
    y -= 16;
    for (const ln of ['THE COMMISSIONER', 'COMPANIES AND INTELLECTUAL PROPERTY COMMISSION (CIPC)', 'PRETORIA']) {
      page.drawText(ln, { x: MARGIN, y, size: 9, font: fonts.bold, color: COLORS.body }); y -= 12;
    }
    y -= 8;
    y = drawParagraph(page, `RE: APPLICATION FOR VOLUNTARY DEREGISTRATION IN TERMS OF SECTION 82(3) OF THE COMPANIES ACT 71 OF 2008 - ${f.entityName.toUpperCase()} (REGISTRATION NUMBER: ${f.registrationNumber})`, MARGIN, y, contentW, fonts.bold, 9.5, COLORS.navy, 12.5, false);
    y -= 10;

    y = drawParagraph(page, `We, the undersigned, being all the directors of ${f.entityName} (Registration Number: ${f.registrationNumber}) (the "Company"), hereby apply for the deregistration of the Company in terms of section 82(3) of the Companies Act 71 of 2008, read with regulation 40 of the Companies Regulations, 2011.`, MARGIN, y, contentW, fonts.regular, 9, COLORS.body, 13);
    y -= 8;
    y = drawParagraph(page, f.reason, MARGIN, y, contentW, fonts.regular, 9, COLORS.body, 13);
    y -= 8;
    page.drawText('In support of this application we confirm that:', { x: MARGIN, y, size: 9, font: fonts.bold, color: COLORS.navy });
    y -= 14;
    f.confirmations.forEach((c, i) => {
      page.drawText(`${i + 1}.`, { x: MARGIN + 4, y, size: 9, font: fonts.bold, color: COLORS.navy });
      y = drawParagraph(page, c, MARGIN + 20, y, contentW - 20, fonts.regular, 9, COLORS.body, 13);
      y -= 5;
    });
    y -= 6;
    y = drawParagraph(page, 'We request that the Company be deregistered and that written confirmation of the deregistration be issued to the address above. We undertake to furnish any further information the Commission may require.', MARGIN, y, contentW, fonts.regular, 9, COLORS.body, 13);
    y -= 8;
    page.drawText('Yours faithfully,', { x: MARGIN, y, size: 9, font: fonts.regular, color: COLORS.body });
    y -= 44;

    if (y < 60 + Math.ceil(f.directors.length / 2) * 42) warnings.push('Letter is long; signature lines are near the bottom margin. Consider shortening.');
    const colW = 220;
    const rightX = MARGIN + contentW - colW;
    f.directors.forEach((d, i) => {
      drawClientSignatureLine(page, fonts, Math.max(y, 50), `${d} - Director`, i % 2 === 0 ? MARGIN : rightX, colW);
      if (i % 2 === 1) y -= 42;
    });

    if (!options.signed) drawDraftWatermark(pdf, fonts);
    const buffer = Buffer.from(await pdf.save());
    return { buffer, fileName: `CIPC_Deregistration_Request_${safeFileName(f.entityName)}${f.orderId ? `_${f.orderId}` : ''}.pdf`, warnings, pageCount: 1 };
  },
  suggestFields(ctx: OrderDocumentContext) {
    return {
      entityName: ctx.entity.entityName,
      registrationNumber: ctx.entity.registrationNumber,
      address: ctx.entity.address,
      directors: ctx.entity.directorName ? [ctx.entity.directorName] : undefined,
      orderId: ctx.orderNumber,
    };
  },
};
