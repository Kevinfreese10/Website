/**
 * Shared drawing helpers for generated My Accountant documents (letterhead, paragraphs,
 * signature block). Ported from the recovered v1 template-generators and tidied.
 * pdf-lib only; WinAnsi-safe text (no smart quotes / unicode bullets).
 */

import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts, type RGB } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

export const FIRM = {
  name: 'MY ACCOUNTANT (PTY) LTD',
  nameTitle: 'My Accountant (Pty) Ltd',
  regNumber: '2020 / 548105 / 07',
  tagline: 'ACCOUNTING • PAYROLL • TAX • ADVISORY',
  addressLines: ['Ground Floor, Waterstone Building, Stonemill Office Park', '300 Acacia Road, Darrenwood, Johannesburg, 2195'],
  addressLine1: 'Ground Floor, Waterstone Building, Stonemill Office Park',
  addressLine2: '300 Acacia Road, Darrenwood',
  city: 'Johannesburg',
  postalCode: '2195',
  tel: '010 109 1625',
  email: 'info@myacc.co.za',
  web: 'www.myacc.co.za',
  signatory: 'Kevin Freese',
  signatoryId: '8606205046085',
  designation: 'Chartered Business Accountant in Practice (CBAP SA #3561) • PR-0098553',
  designationShort: 'CBA (SA) #3561',
  practiceNumber: 'CIBA CBAP SA #3561 / PR-0098553',
  professionalBody: 'Chartered Institute of Business Accountants (CIBA / SAIBA)',
} as const;

export const COLORS = {
  navy: rgb(0.06, 0.13, 0.22),
  gold: rgb(0.77, 0.63, 0.35),
  grey: rgb(0.44, 0.5, 0.59),
  body: rgb(0.18, 0.22, 0.28),
  ink: rgb(0.04, 0.22, 0.48),
  blue: rgb(0.17, 0.42, 0.69),
  draft: rgb(0.85, 0.2, 0.2),
};

export const A4: [number, number] = [595.28, 841.89];
export const A4_LANDSCAPE: [number, number] = [841.89, 595.28];
export const MARGIN = 40;

export function templatePath(file: string): string {
  const p = path.join(process.cwd(), 'public', 'templates', file);
  if (!fs.existsSync(p)) throw new Error(`Template file not found: public/templates/${file}`);
  return p;
}

export function loadTemplateBytes(file: string): Buffer {
  return fs.readFileSync(templatePath(file));
}

/** Strip characters WinAnsi can't encode (pdf-lib standard fonts). */
export function ansi(s: string | undefined | null): string {
  return String(s ?? '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/–|—/g, '-')
    .replace(/•/g, '-')
    .replace(/[^\x00-\xFF]/g, '');
}

export function formatDateLong(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDateShort(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export async function embedFonts(pdf: PDFDocument) {
  return {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    italic: await pdf.embedFont(StandardFonts.HelveticaOblique),
    scriptBold: await pdf.embedFont(StandardFonts.TimesRomanBoldItalic),
  };
}
export type Fonts = Awaited<ReturnType<typeof embedFonts>>;

export function wrapText(text: string, maxWidth: number, font: PDFFont, size: number): string[] {
  const words = ansi(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) line = test;
    else { if (line) lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  return lines;
}

/** Draws a justified paragraph; returns the y after the last line. */
export function drawParagraph(page: PDFPage, text: string, x: number, y: number, maxWidth: number, font: PDFFont, size: number, color: RGB = COLORS.body, lineHeight = 13, justify = true): number {
  const lines = wrapText(text, maxWidth, font, size);
  let cy = y;
  lines.forEach((ln, i) => {
    const words = ln.split(' ');
    const last = i === lines.length - 1;
    if (!justify || last || words.length === 1) {
      page.drawText(ln, { x, y: cy, size, font, color });
    } else {
      const wordsW = words.reduce((s, w) => s + font.widthOfTextAtSize(w, size), 0);
      const gap = (maxWidth - wordsW) / (words.length - 1);
      let wx = x;
      for (const w of words) { page.drawText(w, { x: wx, y: cy, size, font, color }); wx += font.widthOfTextAtSize(w, size) + gap; }
    }
    cy -= lineHeight;
  });
  return cy;
}

export function drawLetterhead(page: PDFPage, fonts: Fonts): number {
  const { width, height } = page.getSize();
  page.drawText(FIRM.name, { x: MARGIN, y: height - 38, size: 14, font: fonts.bold, color: COLORS.navy });
  page.drawText(`REGISTRATION NUMBER: ${FIRM.regNumber}`, { x: MARGIN, y: height - 48, size: 6.5, font: fonts.bold, color: COLORS.grey });
  page.drawText(ansi(FIRM.tagline), { x: MARGIN, y: height - 57, size: 6.5, font: fonts.bold, color: COLORS.gold });
  const contact = [...FIRM.addressLines, `Tel: ${FIRM.tel} | Email: ${FIRM.email} | Web: ${FIRM.web}`];
  let cy = height - 38;
  for (const cl of contact) {
    const w = fonts.regular.widthOfTextAtSize(cl, 7.2);
    page.drawText(cl, { x: width - MARGIN - w, y: cy, size: 7.2, font: fonts.regular, color: COLORS.grey });
    cy -= 9.5;
  }
  page.drawLine({ start: { x: MARGIN, y: height - 68 }, end: { x: width - MARGIN, y: height - 68 }, thickness: 1.5, color: COLORS.gold });
  return height - 88; // first usable y
}

/**
 * Kevin's signature block. Unsigned drafts show a clear DRAFT marker instead of the signature
 * image, so a draft can never be mistaken for (or forwarded as) a signed document.
 */
export async function drawKevinSignatureBlock(pdf: PDFDocument, page: PDFPage, fonts: Fonts, y: number, opts: { signed: boolean; date?: string; forEntityLine?: string }): Promise<number> {
  const { width } = page.getSize();
  const boxW = (width - MARGIN * 2) * 0.65;
  const boxH = 58;
  page.drawRectangle({ x: MARGIN, y: y - boxH + 10, width: boxW, height: boxH, color: rgb(0.97, 0.98, 1.0), borderColor: rgb(0.8, 0.86, 0.94), borderWidth: 0.75 });
  page.drawRectangle({ x: MARGIN, y: y - boxH + 10, width: 3.5, height: boxH, color: COLORS.ink });
  page.drawText(opts.forEntityLine || `FOR ${FIRM.name} (REG: ${FIRM.regNumber}):`, { x: MARGIN + 10, y: y - 2, size: 7, font: fonts.bold, color: COLORS.navy });

  if (opts.signed) {
    try {
      const png = await pdf.embedPng(loadTemplateBytes('Signature_Kevin_New.png'));
      const h = 26; const w = (png.width / png.height) * h;
      page.drawImage(png, { x: MARGIN + 10, y: y - 30, width: Math.min(w, 120), height: h });
    } catch {
      page.drawText(FIRM.signatory, { x: MARGIN + 10, y: y - 18, size: 15, font: fonts.scriptBold, color: COLORS.ink });
    }
    page.drawText(`DIGITALLY SIGNED • ${FIRM.designationShort} • Date: ${formatDateLong(opts.date)}`.replace('•', '-').replace('•', '-'), { x: MARGIN + 10, y: y - 37, size: 6.5, font: fonts.bold, color: COLORS.blue });
  } else {
    page.drawText('DRAFT - UNSIGNED', { x: MARGIN + 10, y: y - 20, size: 13, font: fonts.bold, color: COLORS.draft });
    page.drawText(`To be signed by ${FIRM.signatory}, ${FIRM.designationShort}, on approval`, { x: MARGIN + 10, y: y - 37, size: 6.5, font: fonts.regular, color: COLORS.grey });
  }
  page.drawText(ansi(FIRM.designation).replace('•', '-'), { x: MARGIN + 10, y: y - 46, size: 6.5, font: fonts.regular, color: COLORS.body });
  return y - boxH;
}

/** A client/director signature line (never pre-signed). */
export function drawClientSignatureLine(page: PDFPage, fonts: Fonts, y: number, label: string, x = MARGIN, width = 220): number {
  page.drawLine({ start: { x, y }, end: { x: x + width, y }, thickness: 0.75, color: COLORS.navy });
  page.drawText(ansi(label), { x, y: y - 10, size: 7, font: fonts.regular, color: COLORS.grey });
  return y - 24;
}

/** Diagonal DRAFT watermark on every page of an unsigned document. */
export function drawDraftWatermark(pdf: PDFDocument, fonts: Fonts) {
  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    page.drawText('DRAFT', { x: width / 2 - 90, y: height / 2 - 30, size: 90, font: fonts.bold, color: rgb(0.92, 0.92, 0.92), rotate: { type: 'degrees', angle: 35 } as any, opacity: 0.5 });
  }
}

export function safeFileName(s: string): string {
  return ansi(s).replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'Document';
}

/** Set an AcroForm text field if it exists; returns false when the field is absent. */
export function setTextField(form: ReturnType<PDFDocument['getForm']>, name: string, value: string | undefined | null): boolean {
  if (value === undefined || value === null || value === '') return true;
  try { form.getTextField(name).setText(ansi(String(value))); return true; } catch { return false; }
}
export function checkBox(form: ReturnType<PDFDocument['getForm']>, name: string): boolean {
  try { form.getCheckBox(name).check(); return true; } catch { return false; }
}

export function splitName(full: string): { first: string; last: string } {
  const parts = ansi(full).trim().split(/\s+/);
  if (parts.length < 2) return { first: parts[0] || '', last: '' };
  return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] };
}

export function splitPhone(raw: string): { code: string; number: string } {
  const d = String(raw || '').replace(/\D/g, '');
  if (d.length >= 10) return { code: d.slice(-10, -7), number: d.slice(-7) };
  return { code: '', number: raw || '' };
}
