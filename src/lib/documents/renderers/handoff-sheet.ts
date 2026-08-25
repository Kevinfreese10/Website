/**
 * Internal hand-off sheet: everything a human needs to complete a portal filing or manual step.
 * Never client-facing. No signature.
 */
import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';
import { A4, COLORS, MARGIN, ansi, drawLetterhead, drawParagraph, embedFonts, formatDateLong, safeFileName, wrapText } from '../helpers';
import { MissingFieldsError, type TemplateDefinition } from '../types';

const schema = z.object({
  title: z.string().min(1),
  orderNumber: z.string().min(1),
  serviceTitle: z.string().min(1),
  stepTitle: z.string().min(1),
  instructions: z.string().optional(),
  rows: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
  checklist: z.array(z.string()).default([]),
  orderId: z.string().optional(),
});
export type HandoffSheetFields = z.infer<typeof schema>;

export const handoffSheet: TemplateDefinition<HandoffSheetFields> = {
  id: 'handoff_sheet',
  title: 'Hand-off sheet (internal)',
  description: 'One-page internal sheet with the prepared values, instructions and a checklist for a human completing a portal filing or manual step.',
  category: 'internal',
  signature: 'none',
  schema,
  fieldLabels: { title: 'Title', orderNumber: 'Order number', serviceTitle: 'Service', stepTitle: 'Step', instructions: 'Instructions', rows: 'Prepared values', checklist: 'Checklist' },
  suggestFields: ctx => ({ orderNumber: ctx.orderNumber, serviceTitle: ctx.serviceTitle }),
  async render(fields, options) {
    const parsed = schema.safeParse(fields);
    if (!parsed.success) throw new MissingFieldsError('handoff_sheet', parsed.error.issues.map(i => i.path.join('.')));
    const f = parsed.data;
    const pdf = await PDFDocument.create();
    const fonts = await embedFonts(pdf);
    let page = pdf.addPage(A4);
    const { width } = page.getSize();
    const contentW = width - MARGIN * 2;
    let y = drawLetterhead(page, fonts);
    const newPageIfNeeded = () => { if (y < 80) { page = pdf.addPage(A4); y = drawLetterhead(page, fonts); } };

    page.drawText('INTERNAL - NOT FOR CLIENT DISTRIBUTION', { x: MARGIN, y, size: 7, font: fonts.bold, color: COLORS.draft });
    y -= 14;
    page.drawText(ansi(f.title).toUpperCase(), { x: MARGIN, y, size: 12, font: fonts.bold, color: COLORS.navy });
    y -= 14;
    page.drawText(ansi(`Order #${f.orderNumber} - ${f.serviceTitle} - ${f.stepTitle} - prepared ${formatDateLong(options.date)}`), { x: MARGIN, y, size: 8, font: fonts.regular, color: COLORS.grey });
    y -= 20;

    if (f.instructions) {
      page.drawText('INSTRUCTIONS', { x: MARGIN, y, size: 8, font: fonts.bold, color: COLORS.gold });
      y -= 12;
      for (const para of f.instructions.split(/\n+/)) { newPageIfNeeded(); y = drawParagraph(page, para, MARGIN, y, contentW, fonts.regular, 8.5, COLORS.body, 12, false); y -= 4; }
      y -= 8;
    }

    if (f.rows.length) {
      page.drawText('PREPARED VALUES', { x: MARGIN, y, size: 8, font: fonts.bold, color: COLORS.gold });
      y -= 12;
      const labelW = 170;
      for (const r of f.rows) {
        newPageIfNeeded();
        const lines = wrapText(r.value, contentW - labelW - 10, fonts.regular, 8.5);
        const h = Math.max(1, lines.length) * 11 + 4;
        page.drawRectangle({ x: MARGIN, y: y - h + 9, width: contentW, height: h, borderColor: COLORS.grey, borderWidth: 0.3 });
        page.drawText(ansi(r.label), { x: MARGIN + 4, y, size: 8, font: fonts.bold, color: COLORS.navy });
        let ly = y;
        for (const ln of lines) { page.drawText(ln, { x: MARGIN + labelW, y: ly, size: 8.5, font: fonts.regular, color: COLORS.body }); ly -= 11; }
        y -= h;
      }
      y -= 10;
    }

    if (f.checklist.length) {
      newPageIfNeeded();
      page.drawText('CHECKLIST', { x: MARGIN, y, size: 8, font: fonts.bold, color: COLORS.gold });
      y -= 12;
      for (const item of f.checklist) {
        newPageIfNeeded();
        page.drawRectangle({ x: MARGIN, y: y - 1, width: 8, height: 8, borderColor: COLORS.navy, borderWidth: 0.6 });
        y = drawParagraph(page, item, MARGIN + 14, y, contentW - 14, fonts.regular, 8.5, COLORS.body, 12, false);
        y -= 2;
      }
    }

    const buffer = Buffer.from(await pdf.save());
    return { buffer, fileName: `Handoff_${safeFileName(f.stepTitle)}_${f.orderNumber}.pdf`, warnings: [], pageCount: pdf.getPageCount() };
  },
};
