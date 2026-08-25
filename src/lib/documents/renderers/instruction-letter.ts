/**
 * A letter the CLIENT signs on its OWN letterhead (COIDA instruction letters, director
 * resignation letters, etc.). Plain page with the client's entity name / address as header.
 * No My Accountant letterhead and no Kevin signature. Signature: client. Single page.
 */
import { z } from 'zod';
import { PDFDocument, type PDFPage } from 'pdf-lib';
import { A4, COLORS, MARGIN, ansi, drawClientSignatureLine, drawDraftWatermark, drawParagraph, embedFonts, formatDateLong, safeFileName, type Fonts } from '../helpers';
import { MissingFieldsError, type OrderDocumentContext, type TemplateDefinition } from '../types';

/** Client entity letterhead: name, registration number, address, gold rule. Returns first usable y. */
export function drawClientLetterhead(page: PDFPage, fonts: Fonts, entity: { entityName: string; registrationNumber?: string; address?: string }): number {
  const { width, height } = page.getSize();
  page.drawText(ansi(entity.entityName).toUpperCase(), { x: MARGIN, y: height - 40, size: 13, font: fonts.bold, color: COLORS.navy });
  let cy = height - 51;
  if (entity.registrationNumber) { page.drawText(ansi(`Registration Number: ${entity.registrationNumber}`), { x: MARGIN, y: cy, size: 7, font: fonts.bold, color: COLORS.grey }); cy -= 9; }
  if (entity.address) {
    for (const ln of ansi(entity.address).split(/\s*[\n,]\s*/).filter(Boolean).slice(0, 4)) {
      page.drawText(ln, { x: MARGIN, y: cy, size: 7, font: fonts.regular, color: COLORS.grey }); cy -= 9;
    }
  }
  const ruleY = Math.min(cy - 4, height - 68);
  page.drawLine({ start: { x: MARGIN, y: ruleY }, end: { x: width - MARGIN, y: ruleY }, thickness: 1.2, color: COLORS.gold });
  return ruleY - 22;
}

const schema = z.object({
  entityName: z.string().min(1),
  registrationNumber: z.string().optional(),
  address: z.string().optional(),
  addressee: z.string().min(1),
  subject: z.string().min(1),
  paragraphs: z.array(z.string().min(1)).min(1),
  signatoryName: z.string().min(1),
  signatoryCapacity: z.string().min(1),
  orderId: z.string().optional(),
});
export type InstructionLetterFields = z.infer<typeof schema>;

export const instructionLetter: TemplateDefinition<InstructionLetterFields> = {
  id: 'instruction_letter',
  title: 'Client Instruction Letter',
  description: "Letter on the client's own letterhead (entity name and address as header) signed by a director. Used for COIDA instruction letters, director resignation letters and similar.",
  category: 'letter',
  signature: 'client',
  schema,
  fieldLabels: {
    entityName: 'Entity name', registrationNumber: 'Registration number', address: 'Entity address', addressee: 'Addressed to', subject: 'Subject line',
    paragraphs: 'Letter body paragraphs', signatoryName: 'Signatory name', signatoryCapacity: 'Signatory capacity', orderId: 'Order reference',
  },
  async render(fields, options) {
    const parsed = schema.safeParse(fields);
    if (!parsed.success) throw new MissingFieldsError('instruction_letter', parsed.error.issues.map(i => i.path.join('.')));
    const f = parsed.data;
    const warnings: string[] = [];
    if (!f.registrationNumber) warnings.push('registrationNumber not supplied - omitted from the letterhead');
    if (!f.address) warnings.push('address not supplied - omitted from the letterhead');

    const pdf = await PDFDocument.create();
    const page = pdf.addPage(A4);
    const fonts = await embedFonts(pdf);
    const { width } = page.getSize();
    const contentW = width - MARGIN * 2;
    let y = drawClientLetterhead(page, fonts, f);

    page.drawText(formatDateLong(options.date), { x: MARGIN, y, size: 8.5, font: fonts.regular, color: COLORS.body });
    y -= 16;
    for (const ln of ansi(f.addressee).split(/\s*\n\s*/).filter(Boolean)) {
      page.drawText(ln.toUpperCase(), { x: MARGIN, y, size: 9, font: fonts.bold, color: COLORS.body }); y -= 12;
    }
    y -= 8;
    y = drawParagraph(page, `RE: ${f.subject.toUpperCase()}`, MARGIN, y, contentW, fonts.bold, 10, COLORS.navy, 13, false);
    y -= 10;

    for (const p of f.paragraphs) {
      y = drawParagraph(page, p, MARGIN, y, contentW, fonts.regular, 9, COLORS.body, 13);
      y -= 8;
    }
    y -= 4;
    page.drawText('Yours faithfully,', { x: MARGIN, y, size: 9, font: fonts.regular, color: COLORS.body });
    y -= 44;

    if (y < 80) warnings.push('Letter is long; signature line is near the bottom margin. Consider shortening.');
    drawClientSignatureLine(page, fonts, Math.max(y, 70), `${f.signatoryName} - ${f.signatoryCapacity}, ${f.entityName}`, MARGIN, 240);

    if (!options.signed) drawDraftWatermark(pdf, fonts);
    const buffer = Buffer.from(await pdf.save());
    return { buffer, fileName: `Letter_${safeFileName(f.subject)}_${safeFileName(f.entityName)}${f.orderId ? `_${f.orderId}` : ''}.pdf`, warnings, pageCount: 1 };
  },
  suggestFields(ctx: OrderDocumentContext) {
    return {
      entityName: ctx.entity.entityName,
      registrationNumber: ctx.entity.registrationNumber,
      address: ctx.entity.address,
      signatoryName: ctx.entity.directorName,
      orderId: ctx.orderNumber,
    };
  },
};
