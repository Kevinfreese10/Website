/**
 * Motivation to SARS for remission of penalties and/or interest, on My Accountant letterhead.
 * Signature: kevin, as registered tax practitioner (PR-0098553). Single page. The grounds are
 * supplied paragraphs drafted from the taxpayer's verified circumstances - never boilerplate.
 */
import { z } from 'zod';
import { PDFDocument, rgb } from 'pdf-lib';
import { A4, COLORS, MARGIN, ansi, drawDraftWatermark, drawKevinSignatureBlock, drawLetterhead, drawParagraph, embedFonts, formatDateLong, safeFileName } from '../helpers';
import { MissingFieldsError, type OrderDocumentContext, type TemplateDefinition } from '../types';

const schema = z.object({
  taxpayerName: z.string().min(1),
  taxReference: z.string().min(1),
  /** e.g. 'Income Tax', 'VAT', 'PAYE', 'Provisional Tax'. */
  taxType: z.string().min(1),
  /** Periods concerned, e.g. ['2024/02', '2025/02'] or ['Period 03/2025']. */
  periods: z.array(z.string().min(1)).min(1),
  /** Formatted amount, e.g. 'R 12,450.00'. */
  penaltyAmount: z.string().min(1),
  interestAmount: z.string().optional(),
  /** Grounds for remission, one paragraph each. */
  grounds: z.array(z.string().min(1)).min(1),
  supportingDocuments: z.array(z.string().min(1)).min(1),
  /** SARS case / dispute reference if one exists. */
  sarsCaseNumber: z.string().optional(),
  orderId: z.string().optional(),
});
export type RemissionMotivationLetterFields = z.infer<typeof schema>;

export const remissionMotivationLetter: TemplateDefinition<RemissionMotivationLetterFields> = {
  id: 'remission_motivation_letter',
  title: 'SARS Remission Motivation Letter',
  description: 'Motivation to SARS for remission of penalties and interest on My Accountant letterhead, signed by Kevin Freese as registered tax practitioner on approval.',
  category: 'letter',
  signature: 'kevin',
  schema,
  fieldLabels: {
    taxpayerName: 'Taxpayer name', taxReference: 'Tax reference number', taxType: 'Tax type', periods: 'Tax periods concerned', penaltyAmount: 'Penalty amount',
    interestAmount: 'Interest amount', grounds: 'Grounds for remission', supportingDocuments: 'Supporting documents attached', sarsCaseNumber: 'SARS case number', orderId: 'Order reference',
  },
  async render(fields, options) {
    const parsed = schema.safeParse(fields);
    if (!parsed.success) throw new MissingFieldsError('remission_motivation_letter', parsed.error.issues.map(i => i.path.join('.')));
    const f = parsed.data;
    const warnings: string[] = [];
    if (!f.interestAmount) warnings.push('interestAmount not supplied - request limited to penalties');

    const pdf = await PDFDocument.create();
    const page = pdf.addPage(A4);
    const fonts = await embedFonts(pdf);
    const { width } = page.getSize();
    const contentW = width - MARGIN * 2;
    let y = drawLetterhead(page, fonts);

    page.drawText(formatDateLong(options.date), { x: MARGIN, y, size: 8.5, font: fonts.regular, color: COLORS.body });
    y -= 16;
    for (const ln of ['THE COMMISSIONER', 'SOUTH AFRICAN REVENUE SERVICE', 'PRETORIA']) {
      page.drawText(ln, { x: MARGIN, y, size: 9, font: fonts.bold, color: COLORS.body }); y -= 11;
    }
    y -= 8;
    const what = f.interestAmount ? 'PENALTIES AND INTEREST' : 'PENALTIES';
    y = drawParagraph(page, `RE: REQUEST FOR REMISSION OF ${what} - ${f.taxType.toUpperCase()} - ${f.taxpayerName.toUpperCase()} (TAX REFERENCE: ${f.taxReference})`, MARGIN, y, contentW, fonts.bold, 9.5, COLORS.navy, 12, false);
    y -= 8;

    // Summary box
    const rows: [string, string][] = [
      ['Taxpayer:', f.taxpayerName],
      ['Tax reference number:', f.taxReference],
      ['Tax type:', f.taxType],
      ['Period(s):', f.periods.join(', ')],
      ['Penalty amount:', f.penaltyAmount],
    ];
    if (f.interestAmount) rows.push(['Interest amount:', f.interestAmount]);
    if (f.sarsCaseNumber) rows.push(['SARS case number:', f.sarsCaseNumber]);
    const boxH = rows.length * 10.5 + 8;
    page.drawRectangle({ x: MARGIN, y: y - boxH, width: contentW, height: boxH, color: rgb(0.98, 0.98, 0.99), borderColor: rgb(0.88, 0.91, 0.94), borderWidth: 0.75 });
    let ry = y - 10;
    for (const [l, v] of rows) {
      page.drawText(ansi(l), { x: MARGIN + 12, y: ry, size: 7.2, font: fonts.bold, color: COLORS.body });
      page.drawText(ansi(v), { x: MARGIN + 130, y: ry, size: 7.2, font: fonts.regular, color: COLORS.navy });
      ry -= 10.5;
    }
    y -= boxH + 14;

    const para = (t: string) => { y = drawParagraph(page, t, MARGIN, y, contentW, fonts.regular, 8.5, COLORS.body, 12); y -= 7; };
    para(`We act as registered tax practitioners for the above taxpayer and are authorised to make this request on its behalf. We request that the ${what.toLowerCase()} levied in respect of the ${f.taxType} period(s) ${f.periods.join(', ')} be remitted in terms of Chapter 15 of the Tax Administration Act 28 of 2011, on the following grounds:`);

    f.grounds.forEach((g, i) => {
      page.drawText(`${i + 1}.`, { x: MARGIN + 4, y, size: 8.5, font: fonts.bold, color: COLORS.navy });
      y = drawParagraph(page, g, MARGIN + 20, y, contentW - 20, fonts.regular, 8.5, COLORS.body, 12);
      y -= 5;
    });
    y -= 4;

    page.drawText('The following documents are attached in support of this request:', { x: MARGIN, y, size: 8.5, font: fonts.bold, color: COLORS.navy });
    y -= 13;
    for (const d of f.supportingDocuments) {
      page.drawText('-', { x: MARGIN + 6, y, size: 8.5, font: fonts.regular, color: COLORS.body });
      y = drawParagraph(page, d, MARGIN + 16, y, contentW - 16, fonts.regular, 8.5, COLORS.body, 11.5);
      y -= 2;
    }
    y -= 8;
    para('We respectfully request that the Commissioner consider the circumstances set out above and remit the amounts concerned. Should any further information be required, please contact our offices directly.');

    if (y < 140) warnings.push('Letter is long; signature block is near the bottom margin. Consider shortening the grounds.');
    await drawKevinSignatureBlock(pdf, page, fonts, Math.max(y - 4, 70), { signed: options.signed, date: options.date, forEntityLine: `FOR ${f.taxpayerName.toUpperCase()} - REGISTERED TAX PRACTITIONER (PR-0098553):` });

    if (!options.signed) drawDraftWatermark(pdf, fonts);
    const buffer = Buffer.from(await pdf.save());
    return { buffer, fileName: `SARS_Remission_Motivation_${safeFileName(f.taxpayerName)}${f.orderId ? `_${f.orderId}` : ''}.pdf`, warnings, pageCount: 1 };
  },
  suggestFields(ctx: OrderDocumentContext) {
    return {
      taxpayerName: ctx.entity.entityName,
      taxReference: ctx.entity.taxNumber,
      orderId: ctx.orderNumber,
    };
  },
};
