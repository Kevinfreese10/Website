/**
 * Share certificate — generated landscape A4 (classical executive layout ported from v1).
 * public/templates/Share_Certificate_Professional.pdf is a flat, pre-filled sample with no
 * AcroForm fields (and a baked-in signature), so the certificate is drawn from scratch.
 * Signature: client (directors sign by hand). Never pre-signed.
 */
import { z } from 'zod';
import { PDFDocument, rgb } from 'pdf-lib';
import { A4_LANDSCAPE, COLORS, ansi, drawDraftWatermark, embedFonts, formatDateLong, safeFileName, wrapText } from '../helpers';
import { answer } from '../context';
import { MissingFieldsError, type OrderDocumentContext, type TemplateDefinition } from '../types';

const schema = z.object({
  entityName: z.string().min(1),
  registrationNumber: z.string().min(1),
  certificateNumber: z.string().min(1),
  shareholderName: z.string().min(1),
  /** ID / registration number of the holder. */
  shareholderId: z.string().optional(),
  shareholderAddress: z.string().optional(),
  numberOfShares: z.number().int().positive(),
  shareClass: z.string().min(1),
  /** e.g. "no par value" or "R1.00 par value". */
  parValueOrNPV: z.string().min(1),
  /** ISO date of issue. */
  issueDate: z.string().min(1),
  /** Distinctive numbers of the shares, e.g. "001 to 100". */
  distinctiveNumbers: z.string().optional(),
  placeOfIssue: z.string().optional(),
  /** Directors who sign; one or two signature lines are drawn (never pre-signed). */
  directors: z.array(z.string().min(1)).min(1).max(2),
  orderId: z.string().optional(),
});
export type ShareCertificateFields = z.infer<typeof schema>;

const ONES = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
const TENS = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
export function numberToWords(n: number): string {
  if (n === 0) return 'ZERO';
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
  if (n < 1000) return ONES[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 ? ' AND ' + numberToWords(n % 100) : '');
  if (n < 1000000) return numberToWords(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 ? ' ' + numberToWords(n % 1000) : '');
  return String(n);
}

export const shareCertificate: TemplateDefinition<ShareCertificateFields> = {
  id: 'share_certificate',
  title: 'Share Certificate',
  description: 'Landscape A4 share certificate under the Companies Act 71 of 2008. Directors sign by hand; number/class/par value are explicit fields.',
  category: 'certificate',
  signature: 'client',
  schema,
  fieldLabels: {
    entityName: 'Company name', registrationNumber: 'Registration number', certificateNumber: 'Certificate number', shareholderName: 'Shareholder full name',
    shareholderId: 'Shareholder ID / registration number', shareholderAddress: 'Shareholder address', numberOfShares: 'Number of shares', shareClass: 'Class of shares',
    parValueOrNPV: 'Par value / no par value', issueDate: 'Date of issue', distinctiveNumbers: 'Distinctive numbers', placeOfIssue: 'Place of issue',
    directors: 'Signing director(s)', orderId: 'Order number',
  },
  async render(fields, options) {
    const parsed = schema.safeParse(fields);
    if (!parsed.success) throw new MissingFieldsError('share_certificate', parsed.error.issues.map(i => i.path.join('.')));
    const f = parsed.data;
    const warnings: string[] = [];

    const pdf = await PDFDocument.create();
    const page = pdf.addPage(A4_LANDSCAPE);
    const fonts = await embedFonts(pdf);
    const { width, height } = page.getSize();
    const margin = 35;
    const navy = COLORS.navy, gold = COLORS.gold, slate = rgb(0.3, 0.35, 0.4), ink = rgb(0.1, 0.1, 0.1);
    const centre = (text: string, y: number, size: number, font = fonts.regular, color = ink) => {
      const t = ansi(text); page.drawText(t, { x: (width - font.widthOfTextAtSize(t, size)) / 2, y, size, font, color });
    };

    page.drawRectangle({ x: margin, y: margin, width: width - margin * 2, height: height - margin * 2, borderColor: navy, borderWidth: 3.5 });
    page.drawRectangle({ x: margin + 6, y: margin + 6, width: width - (margin + 6) * 2, height: height - (margin + 6) * 2, borderColor: gold, borderWidth: 1.5 });

    page.drawText(ansi(`Certificate No. ${f.certificateNumber}`), { x: margin + 25, y: height - margin - 35, size: 11, font: fonts.bold, color: navy });
    const nos = ansi(`No. of Shares: ${f.numberOfShares.toLocaleString('en-ZA')}`);
    page.drawText(nos, { x: width - margin - 25 - fonts.bold.widthOfTextAtSize(nos, 11), y: height - margin - 35, size: 11, font: fonts.bold, color: navy });

    centre(f.entityName.toUpperCase(), height - margin - 75, 20, fonts.bold, navy);
    centre(`(Registration Number: ${f.registrationNumber})`, height - margin - 95, 10, fonts.bold, gold);
    centre('(Incorporated under the Companies Act 71 of 2008 in the Republic of South Africa)', height - margin - 110, 9, fonts.regular, slate);
    centre('SHARE CERTIFICATE', height - margin - 148, 22, fonts.bold, navy);

    let y = height - margin - 185;
    centre('THIS IS TO CERTIFY THAT:', y, 11, fonts.bold, slate);
    y -= 26;
    centre(f.shareholderId ? `${f.shareholderName} (ID / Reg No: ${f.shareholderId})` : f.shareholderName, y, 14, fonts.bold, navy);
    if (!f.shareholderId) warnings.push('Shareholder ID / registration number not supplied - omitted');
    y -= 16;
    if (f.shareholderAddress) centre(`Of: ${f.shareholderAddress}`, y, 9.5, fonts.regular, slate); else warnings.push('Shareholder address not supplied - omitted');
    y -= 18;
    page.drawLine({ start: { x: width / 2 - 220, y }, end: { x: width / 2 + 220, y }, thickness: 1, color: gold });
    y -= 26;

    const body = `is the registered holder of ${numberToWords(f.numberOfShares)} (${f.numberOfShares.toLocaleString('en-ZA')}) ${f.shareClass.toUpperCase()} SHARES of ${f.parValueOrNPV}` +
      `${f.distinctiveNumbers ? `, numbered ${f.distinctiveNumbers},` : ''} in the above-named Company, fully paid up, subject to the Memorandum of Incorporation and the rules of the Company.`;
    for (const ln of wrapText(body, width - margin * 2 - 120, fonts.regular, 10.5)) { centre(ln, y, 10.5, fonts.regular, ink); y -= 18; }
    if (!f.distinctiveNumbers) warnings.push('Distinctive share numbers not supplied - omitted');

    y -= 14;
    const place = f.placeOfIssue || '';
    if (!place) warnings.push('Place of issue not supplied - "GIVEN at" line shows date only');
    centre(`GIVEN${place ? ` at ${place}` : ''} on ${formatDateLong(f.issueDate)}, under the authority of the Board of Directors of the Company.`, y, 9.5, fonts.italic, slate);

    // Signatures — always blank lines. Two lines: director 1 and director 2 (or secretary / same director twice).
    const sigY = margin + 55;
    const lineW = 200;
    const leftX = margin + 60, rightX = width - margin - 60 - lineW;
    const [d1, d2] = f.directors;
    const sigLine = (x: number, name: string, role: string, note: string) => {
      page.drawLine({ start: { x, y: sigY }, end: { x: x + lineW, y: sigY }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });
      const nm = ansi(name.toUpperCase());
      page.drawText(nm, { x: x + (lineW - fonts.bold.widthOfTextAtSize(nm, 8.5)) / 2, y: sigY - 12, size: 8.5, font: fonts.bold, color: navy });
      page.drawText(role, { x: x + (lineW - fonts.bold.widthOfTextAtSize(role, 7.5)) / 2, y: sigY - 22, size: 7.5, font: fonts.bold, color: slate });
      page.drawText(note, { x: x + (lineW - fonts.regular.widthOfTextAtSize(note, 6.5)) / 2, y: sigY - 31, size: 6.5, font: fonts.regular, color: rgb(0.4, 0.45, 0.5) });
    };
    sigLine(leftX, d1, 'DIRECTOR', 'Authorised signatory');
    if (d2) sigLine(rightX, d2, 'DIRECTOR', 'Authorised signatory');
    else { sigLine(rightX, d1, 'DIRECTOR / SECRETARY', 'If no secretary, the director signs twice'); warnings.push('Only one director supplied - second signature line repeats the same director'); }

    page.drawCircle({ x: width / 2, y: sigY - 5, size: 26, borderColor: gold, borderWidth: 1, color: rgb(0.98, 0.97, 0.95) });
    page.drawText('OFFICIAL', { x: width / 2 - 18, y: sigY - 2, size: 7, font: fonts.bold, color: gold });
    page.drawText('SEAL', { x: width / 2 - 10, y: sigY - 11, size: 7, font: fonts.bold, color: gold });

    if (!options.signed) drawDraftWatermark(pdf, fonts);
    const buffer = Buffer.from(await pdf.save());
    return { buffer, fileName: `Share_Certificate_${safeFileName(f.entityName)}_${safeFileName(f.certificateNumber)}${f.orderId ? `_${f.orderId}` : ''}.pdf`, warnings, pageCount: 1 };
  },
  suggestFields(ctx: OrderDocumentContext): Partial<ShareCertificateFields> {
    const out: Partial<ShareCertificateFields> = {};
    const e = ctx.entity;
    if (e.entityName) out.entityName = e.entityName;
    if (e.registrationNumber) out.registrationNumber = e.registrationNumber;
    // The director is a justified signatory; whether they are also the shareholder is not assumed.
    if (e.directorName) out.directors = [e.directorName];
    const shares = answer(ctx, 'share');
    const n = shares ? parseInt(shares.replace(/[^0-9]/g, ''), 10) : NaN;
    if (Number.isFinite(n) && n > 0) out.numberOfShares = n;
    if (ctx.orderNumber) out.orderId = ctx.orderNumber;
    return out;
  },
};
