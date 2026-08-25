/**
 * B-BBEE Sworn Affidavit — EME (General). Text overlay on the official dtic template
 * public/templates/Affidavit-EME-Gen.pdf (2 pages, no AcroForm fields). Coordinates are the
 * calibrated ones from v1. Deponent signature, date and the Commissioner of Oaths block are
 * left blank: the deponent swears the affidavit before a commissioner.
 */
import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';
import { COLORS, ansi, drawDraftWatermark, embedFonts, loadTemplateBytes, safeFileName, wrapText } from '../helpers';
import { MissingFieldsError, type OrderDocumentContext, type TemplateDefinition } from '../types';

const SOURCE = 'Affidavit-EME-Gen.pdf';
const pct = z.union([z.number(), z.string()]).transform(v => String(v).replace('%', '').trim());

const schema = z.object({
  deponentName: z.string().min(1),
  deponentId: z.string().min(1),
  entityName: z.string().min(1),
  tradingName: z.string().optional(),
  registrationNumber: z.string().min(1),
  address: z.string().min(1),
  /** e.g. "Private Company ((Pty) Ltd)", "Close Corporation", "Sole Proprietor". */
  entityType: z.string().optional(),
  natureOfBusiness: z.string().min(1),
  /** Last financial year end as it must appear, e.g. "28 February 2026". */
  financialYearEnd: z.string().min(1),
  /** Annual turnover for the year (must be <= R10m for an EME). Not printed - used to check the EME threshold. */
  turnover: z.union([z.number(), z.string()]),
  blackOwnedPercent: pct,
  blackFemaleOwnedPercent: pct,
  blackDesignatedGroupPercent: pct.optional(),
  blackYouthPercent: pct.optional(),
  blackDisabledPercent: pct.optional(),
  blackUnemployedPercent: pct.optional(),
  blackRuralPercent: pct.optional(),
  blackMilitaryVeteransPercent: pct.optional(),
  orderId: z.string().optional(),
});
export type BeeAffidavitFields = z.infer<typeof schema>;

export const beeAffidavit: TemplateDefinition<BeeAffidavitFields> = {
  id: 'bee_affidavit',
  title: 'B-BBEE Sworn Affidavit (EME - General)',
  description: 'Overlays the enterprise and ownership particulars on the official dtic EME General affidavit. Deponent swears before a Commissioner of Oaths; signature and commissioner blocks stay blank.',
  category: 'affidavit',
  signature: 'client_commissioner',
  schema,
  sourceFile: SOURCE,
  fieldLabels: {
    deponentName: 'Deponent full name and surname', deponentId: 'Deponent identity number', entityName: 'Enterprise name', tradingName: 'Trading name (if applicable)',
    registrationNumber: 'Registration number', address: 'Enterprise physical address', entityType: 'Type of entity', natureOfBusiness: 'Nature of business',
    financialYearEnd: 'Latest financial year end', turnover: 'Annual turnover (EME threshold check)', blackOwnedPercent: '% Black owned', blackFemaleOwnedPercent: '% Black female owned',
    blackDesignatedGroupPercent: '% Black designated group owned', blackYouthPercent: '% Black youth', blackDisabledPercent: '% Black disabled', blackUnemployedPercent: '% Black unemployed',
    blackRuralPercent: '% Black people living in rural areas', blackMilitaryVeteransPercent: '% Black military veterans', orderId: 'Order number',
  },
  async render(fields, options) {
    const parsed = schema.safeParse(fields);
    if (!parsed.success) throw new MissingFieldsError('bee_affidavit', parsed.error.issues.map(i => i.path.join('.')));
    const f = parsed.data;
    const warnings: string[] = [];

    const turnover = parseFloat(String(f.turnover).replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(turnover)) warnings.push('Turnover could not be parsed - EME threshold (R10m) not verified');
    else if (turnover > 10_000_000) warnings.push(`Turnover R${turnover.toLocaleString('en-ZA')} exceeds the R10m EME threshold - this affidavit is not appropriate`);
    warnings.push('Turnover is not printed on the dtic form (it states "R10,000,000.00 or less"); it was used only for the threshold check');

    const pdf = await PDFDocument.load(loadTemplateBytes(SOURCE), { ignoreEncryption: true });
    const fonts = await embedFonts(pdf);
    const navy = COLORS.navy;
    const p1 = pdf.getPage(0);
    const p2 = pdf.getPage(1);
    const t = (page: typeof p1, text: string, x: number, y: number, size: number, bold = true) =>
      page.drawText(ansi(text), { x, y, size, font: bold ? fonts.bold : fonts.regular, color: navy });

    // ---- Page 1: deponent + enterprise
    t(p1, f.deponentName.toUpperCase(), 220, 694.7, 9.5);
    t(p1, f.deponentId, 220, 681.6, 9.5);
    t(p1, f.entityName.toUpperCase(), 220, 567.0, 9.5);
    if (f.tradingName) t(p1, f.tradingName.toUpperCase(), 220, 544.0, 9.5, false); else warnings.push('Trading name not supplied - left blank');
    t(p1, f.registrationNumber, 220, 528.1, 9.5);
    const addrLines = wrapText(f.address, 330, fonts.regular, 8.5);
    if (addrLines.length === 1) t(p1, addrLines[0], 220, 508.0, 8.5, false);
    else { t(p1, addrLines[0], 220, 512.0, 8, false); t(p1, addrLines.slice(1).join(' '), 220, 501.0, 8, false); }
    if (f.entityType) t(p1, f.entityType, 220, 455.0, 9, false); else warnings.push('Type of entity not supplied - left blank');
    t(p1, f.natureOfBusiness, 220, 437.7, 9, false);

    // ---- Page 2: ownership declarations
    const opt = (v: string | undefined, label: string) => { if (v === undefined || v === '') { warnings.push(`${label} not supplied - left blank`); return undefined; } return v; };
    t(p2, f.blackOwnedPercent, 235, 721.2, 9.5);
    t(p2, f.blackFemaleOwnedPercent, 235, 682.7, 9.5);
    const dg = opt(f.blackDesignatedGroupPercent, '% Black designated group'); if (dg !== undefined) t(p2, dg, 235, 644.0, 9.5);
    const breakdown: Array<[string | undefined, string, number, number]> = [
      [f.blackYouthPercent, '% Black youth', 245, 579.3], [f.blackDisabledPercent, '% Black disabled', 255, 559.6], [f.blackUnemployedPercent, '% Black unemployed', 275, 540.0],
      [f.blackRuralPercent, '% Black rural', 335, 520.3], [f.blackMilitaryVeteransPercent, '% Black military veterans', 290, 500.6],
    ];
    for (const [v, label, x, y] of breakdown) { const s = opt(v, label); if (s !== undefined) t(p2, s, x, y, 9); }

    // Financial year end must fit between x=246.5 and x=314.2 (~67pt) - font <= 7.2pt, shrink further if needed.
    let fyeSize = 7.2;
    while (fyeSize > 5 && fonts.bold.widthOfTextAtSize(ansi(f.financialYearEnd), fyeSize) > 66) fyeSize -= 0.2;
    if (fonts.bold.widthOfTextAtSize(ansi(f.financialYearEnd), fyeSize) > 66) warnings.push('Financial year end text is too long for the blank line - check for overlap');
    t(p2, f.financialYearEnd, 247, 455.7, fyeSize);

    // Level contributor table tick, derived from the supplied black-ownership %.
    const bo = parseFloat(f.blackOwnedPercent);
    if (!Number.isFinite(bo)) warnings.push('Black-owned % is not numeric - level contributor box not ticked');
    else t(p2, 'X', 476, bo >= 100 ? 385.0 : bo >= 51 ? 359.0 : 333.0, 12);

    // Deponent signature/date and Commissioner of Oaths block intentionally left blank.

    if (!options.signed) drawDraftWatermark(pdf, fonts);
    const buffer = Buffer.from(await pdf.save());
    return { buffer, fileName: `BEE_Affidavit_EME_${safeFileName(f.entityName)}${f.orderId ? `_${f.orderId}` : ''}.pdf`, warnings, pageCount: pdf.getPageCount() };
  },
  suggestFields(ctx: OrderDocumentContext): Partial<BeeAffidavitFields> {
    const out: Partial<BeeAffidavitFields> = {};
    const e = ctx.entity;
    if (e.entityName) out.entityName = e.entityName;
    if (e.registrationNumber) out.registrationNumber = e.registrationNumber;
    if (e.address) out.address = e.address;
    if (e.directorName) out.deponentName = e.directorName;
    if (e.idNumber) out.deponentId = e.idNumber;
    if (ctx.orderNumber) out.orderId = ctx.orderNumber;
    return out;
  },
};
