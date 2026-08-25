/**
 * Accountant's confirmation letter (general / income confirmation).
 * Signature: Kevin. Single page. Fields are explicit — the letter body is supplied, not invented.
 */
import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';
import { A4, COLORS, MARGIN, ansi, drawDraftWatermark, drawKevinSignatureBlock, drawLetterhead, drawParagraph, embedFonts, formatDateLong, safeFileName } from '../helpers';
import { MissingFieldsError, type TemplateDefinition } from '../types';

const schema = z.object({
  entityName: z.string().min(1),
  registrationNumber: z.string().optional(),
  addressee: z.string().default('TO WHOM IT MAY CONCERN'),
  subject: z.string().min(1),
  /** Body paragraphs, in order. Drafted by Kevin/agent from verified facts; never templated boilerplate about compliance. */
  paragraphs: z.array(z.string().min(1)).min(1),
  /** Optional financial table rows, e.g. statement period → verified credit inflows. */
  table: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  footnote: z.string().optional(),
  orderId: z.string().optional(),
});
export type AccountantsLetterFields = z.infer<typeof schema>;

export const accountantsLetter: TemplateDefinition<AccountantsLetterFields> = {
  id: 'accountants_letter',
  title: "Accountant's Letter",
  description: 'Letter on My Accountant letterhead confirming specified facts (income, engagement, drawings). Kevin signs on approval.',
  category: 'letter',
  signature: 'kevin',
  schema,
  fieldLabels: { entityName: 'Client / entity name', subject: 'Letter subject line', paragraphs: 'Letter body paragraphs', registrationNumber: 'Registration number', table: 'Financial summary rows', footnote: 'Footnote' },
  async render(fields, options) {
    const parsed = schema.safeParse(fields);
    if (!parsed.success) throw new MissingFieldsError('accountants_letter', parsed.error.issues.map(i => i.path.join('.')));
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
    page.drawText(ansi(f.addressee).toUpperCase(), { x: MARGIN, y, size: 10, font: fonts.bold, color: COLORS.body });
    y -= 18;
    page.drawText(ansi(f.subject).toUpperCase(), { x: MARGIN, y, size: 10, font: fonts.bold, color: COLORS.navy });
    y -= 14;
    page.drawText(ansi(`CLIENT ENTITY: ${f.entityName.toUpperCase()}${f.registrationNumber ? ` (REG NO: ${f.registrationNumber})` : ''}`), { x: MARGIN, y, size: 9, font: fonts.bold, color: COLORS.gold });
    y -= 22;

    for (const p of f.paragraphs) {
      y = drawParagraph(page, p, MARGIN, y, contentW, fonts.regular, 8.5, COLORS.body, 12);
      y -= 8;
    }

    if (f.table && f.table.length) {
      y -= 4;
      const rowH = 15;
      for (const row of f.table) {
        page.drawRectangle({ x: MARGIN, y: y - 4, width: contentW, height: rowH, borderColor: COLORS.grey, borderWidth: 0.4 });
        page.drawText(ansi(row.label), { x: MARGIN + 6, y, size: 8, font: fonts.bold, color: COLORS.navy });
        const vw = fonts.regular.widthOfTextAtSize(ansi(row.value), 8);
        page.drawText(ansi(row.value), { x: MARGIN + contentW - 6 - vw, y, size: 8, font: fonts.regular, color: COLORS.body });
        y -= rowH;
      }
      y -= 20; // generous spacing before the next heading (skill rule)
    }
    if (f.footnote) { y = drawParagraph(page, f.footnote, MARGIN, y, contentW, fonts.italic, 7.5, COLORS.grey, 10); y -= 10; }

    if (y < 120) warnings.push('Letter is long; signature block is near the bottom margin. Consider shortening.');
    y = await drawKevinSignatureBlock(pdf, page, fonts, Math.max(y - 6, 70), { signed: options.signed, date: options.date });

    if (!options.signed) drawDraftWatermark(pdf, fonts);
    const buffer = Buffer.from(await pdf.save());
    return { buffer, fileName: `Accountants_Letter_${safeFileName(f.entityName)}${f.orderId ? `_${f.orderId}` : ''}.pdf`, warnings, pageCount: 1 };
  },
};
