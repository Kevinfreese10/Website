/**
 * Generic resolution of the directors / shareholders / members of an entity. Plain page (the
 * resolution belongs to the client, not the firm). Signature: client - one blank line per
 * signatory. Single page. Layout ported from v1 generateNcrDirectorResolutionDraft; wording of
 * each resolved item is supplied in `resolutions`, never templated.
 */
import { z } from 'zod';
import { PDFDocument, rgb } from 'pdf-lib';
import { A4, COLORS, MARGIN, ansi, drawClientSignatureLine, drawDraftWatermark, drawParagraph, embedFonts, formatDateLong, safeFileName } from '../helpers';
import { MissingFieldsError, type OrderDocumentContext, type TemplateDefinition } from '../types';

const schema = z.object({
  entityName: z.string().min(1),
  registrationNumber: z.string().min(1),
  /** 'directors' | 'shareholders' | 'members' - controls the title and the "present" label. */
  body: z.enum(['directors', 'shareholders', 'members']).default('directors'),
  /** Statute line under the title, e.g. 'In terms of the Companies Act 71 of 2008'. Optional. */
  statuteReference: z.string().optional(),
  /** ISO date of the meeting / written resolution. */
  meetingDate: z.string().min(1),
  place: z.string().min(1),
  /** Names of directors / members present. */
  directors: z.array(z.string().min(1)).min(1),
  /** Numbered "RESOLVED THAT ..." items, in order. */
  resolutions: z.array(z.string().min(1)).min(1),
  /** Who signs. Defaults to `directors` when omitted. */
  signatories: z.array(z.string().min(1)).optional(),
  orderId: z.string().optional(),
});
export type DirectorResolutionFields = z.infer<typeof schema>;

const TITLES = { directors: 'RESOLUTION OF THE BOARD OF DIRECTORS', shareholders: 'RESOLUTION OF THE SHAREHOLDERS', members: 'RESOLUTION OF THE MEMBERS' } as const;

export const directorResolution: TemplateDefinition<DirectorResolutionFields> = {
  id: 'director_resolution',
  title: 'Resolution of Directors / Shareholders / Members',
  description: 'Numbered resolutions passed by the directors, shareholders or members of an entity. Each signatory signs on a blank line.',
  category: 'resolution',
  signature: 'client',
  schema,
  fieldLabels: {
    entityName: 'Entity name', registrationNumber: 'Registration number', body: 'Resolving body (directors / shareholders / members)', statuteReference: 'Statute reference line',
    meetingDate: 'Date of resolution', place: 'Place of resolution', directors: 'Persons present', resolutions: 'Resolved items', signatories: 'Signatories', orderId: 'Order reference',
  },
  async render(fields, options) {
    const parsed = schema.safeParse(fields);
    if (!parsed.success) throw new MissingFieldsError('director_resolution', parsed.error.issues.map(i => i.path.join('.')));
    const f = parsed.data;
    const warnings: string[] = [];
    const signatories = f.signatories && f.signatories.length ? f.signatories : f.directors;
    if (!f.signatories || !f.signatories.length) warnings.push('signatories not supplied - all persons present are shown as signatories');

    const pdf = await PDFDocument.create();
    const page = pdf.addPage(A4);
    const fonts = await embedFonts(pdf);
    const { width, height } = page.getSize();
    const contentW = width - MARGIN * 2;
    let y = height - 60;

    const title = TITLES[f.body];
    page.drawText(title, { x: (width - fonts.bold.widthOfTextAtSize(title, 14)) / 2, y, size: 14, font: fonts.bold, color: COLORS.navy });
    y -= 16;
    if (f.statuteReference) {
      const sub = ansi(f.statuteReference).toUpperCase();
      page.drawText(sub, { x: (width - fonts.bold.widthOfTextAtSize(sub, 8)) / 2, y, size: 8, font: fonts.bold, color: COLORS.gold });
    }
    y -= 20;

    page.drawRectangle({ x: MARGIN, y: y - 32, width: contentW, height: 34, color: rgb(0.97, 0.98, 0.99), borderColor: rgb(0.85, 0.88, 0.92), borderWidth: 1 });
    page.drawText(ansi(`ENTITY: ${f.entityName.toUpperCase()}`), { x: MARGIN + 12, y: y - 12, size: 9, font: fonts.bold, color: COLORS.navy });
    page.drawText(ansi(`REGISTRATION NUMBER: ${f.registrationNumber}`), { x: MARGIN + 12, y: y - 24, size: 7.5, font: fonts.regular, color: COLORS.body });
    y -= 48;

    const bodyLabel = f.body === 'directors' ? 'Directors' : f.body === 'shareholders' ? 'Shareholders' : 'Members';
    const meeting = `Resolution of the ${bodyLabel} of ${f.entityName} (Registration Number: ${f.registrationNumber}) passed at ${f.place} on ${formatDateLong(f.meetingDate)}.`;
    y = drawParagraph(page, meeting, MARGIN, y, contentW, fonts.regular, 8.5, COLORS.body, 12);
    y -= 8;

    page.drawText('PRESENT:', { x: MARGIN, y, size: 9, font: fonts.bold, color: COLORS.navy });
    y -= 13;
    for (const d of f.directors) {
      page.drawText(ansi(`- ${d}`), { x: MARGIN + 12, y, size: 8.5, font: fonts.regular, color: COLORS.body });
      y -= 12;
    }
    y -= 8;

    page.drawText('IT WAS RESOLVED THAT:', { x: MARGIN, y, size: 9.5, font: fonts.bold, color: COLORS.navy });
    y -= 16;
    f.resolutions.forEach((r, i) => {
      page.drawText(`${i + 1}.`, { x: MARGIN + 4, y, size: 8.5, font: fonts.bold, color: COLORS.navy });
      y = drawParagraph(page, r, MARGIN + 22, y, contentW - 22, fonts.regular, 8.5, COLORS.body, 12.5);
      y -= 6;
    });
    y -= 10;

    page.drawText('DATED AND SIGNED AT _____________________ ON THIS _______ DAY OF ______________ 20___', { x: MARGIN, y, size: 8.5, font: fonts.bold, color: COLORS.navy });
    y -= 36;

    if (y < 60 + signatories.length * 20) warnings.push('Resolution is long; signature lines are near the bottom margin. Consider shortening.');

    const colW = 220;
    const rightX = MARGIN + contentW - colW;
    signatories.forEach((s, i) => {
      const x = i % 2 === 0 ? MARGIN : rightX;
      drawClientSignatureLine(page, fonts, y, `${s} - ${bodyLabel.replace(/s$/, '')}`, x, colW);
      if (i % 2 === 1 || i === signatories.length - 1) y -= 42;
    });

    if (!options.signed) drawDraftWatermark(pdf, fonts);
    const buffer = Buffer.from(await pdf.save());
    return { buffer, fileName: `Resolution_${safeFileName(f.entityName)}${f.orderId ? `_${f.orderId}` : ''}.pdf`, warnings, pageCount: 1 };
  },
  suggestFields(ctx: OrderDocumentContext) {
    return {
      entityName: ctx.entity.entityName,
      registrationNumber: ctx.entity.registrationNumber,
      directors: ctx.entity.directorName ? [ctx.entity.directorName] : undefined,
      orderId: ctx.orderNumber,
    };
  },
};
