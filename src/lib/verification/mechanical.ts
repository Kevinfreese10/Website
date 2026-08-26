/**
 * Layer 1 — mechanical checks for client uploads. No AI, no network, pure functions.
 *
 * See AI-ORDER-AGENT-PLAN.md §6.2. These run the instant a client submits a requirement and
 * produce plain-language, client-safe feedback. They are deliberately conservative: anything
 * they cannot decide is a `warn`, never a `fail`. Layer 2 (extraction) and Layer 3 (rules)
 * build on the facts recorded here.
 */

import { createHash } from 'crypto';
import type { ServiceRequirement } from '@/lib/types';

export type MechanicalIssueCode =
  | 'EMPTY_FILE'
  | 'FILE_TOO_LARGE'
  | 'UNREADABLE_PDF'
  | 'PASSWORD_PROTECTED'
  | 'TYPE_MISMATCH'
  | 'UNSUPPORTED_TYPE'
  | 'DUPLICATE_FILE'
  | 'INVALID_SA_ID'
  | 'INVALID_CIPC_NUMBER'
  | 'INVALID_PHONE'
  | 'INVALID_EMAIL'
  | 'EMPTY_TEXT'
  | 'FILE_FETCH_FAILED';

export type MechanicalIssue = {
  code: MechanicalIssueCode;
  severity: 'fail' | 'warn';
  /** Plain South African English, safe to show the client verbatim. */
  message: string;
};

export type MechanicalFacts = {
  sha256?: string;
  byteLength?: number;
  detectedType?: 'pdf' | 'jpeg' | 'png' | 'webp' | 'heic' | 'xlsx' | 'csv' | 'docx' | 'zip' | 'unknown';
  pdfPageCount?: number;
  pdfEncrypted?: boolean;
  saId?: { number: string; dateOfBirth: string; ageYears: number; gender: 'male' | 'female'; citizenship: 'citizen' | 'permanent_resident' };
  cipcNumber?: { normalized: string; year: number; entityTypeCode: string; entityType: string };
  phone?: { normalized: string };
  email?: { normalized: string };
  /** Per-file facts when a requirement carries several files (e.g. 12 bank statements). */
  files?: { fileName: string; sha256?: string; byteLength?: number; detectedType?: MechanicalFacts['detectedType']; pdfPageCount?: number }[];
};

export type MechanicalCheckResult = {
  version: 1;
  checkedAt: string;
  status: 'pass' | 'warn' | 'fail';
  issues: MechanicalIssue[];
  facts: MechanicalFacts;
};

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

// ---------------------------------------------------------------------------------------------
// Identity / reference number validators
// ---------------------------------------------------------------------------------------------

/** South African 13-digit ID number: YYMMDD SSSS C A Z, Luhn checksum on the whole number. */
export function validateSaIdNumber(input: string): { valid: boolean; reason?: string; facts?: MechanicalFacts['saId'] } {
  const digits = String(input || '').replace(/\s+/g, '');
  if (!/^\d{13}$/.test(digits)) return { valid: false, reason: 'must be exactly 13 digits' };

  // Luhn
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    let d = Number(digits[i]);
    if ((13 - i) % 2 === 0) { // every second digit from the right, excluding the check digit
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  if (sum % 10 !== 0) return { valid: false, reason: 'checksum failed — one or more digits are wrong' };

  const yy = Number(digits.slice(0, 2));
  const mm = Number(digits.slice(2, 4));
  const dd = Number(digits.slice(4, 6));
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return { valid: false, reason: 'date of birth portion is not a real date' };

  const now = new Date();
  const currentYY = now.getFullYear() % 100;
  const century = yy <= currentYY ? 2000 : 1900;
  const dob = new Date(Date.UTC(century + yy, mm - 1, dd));
  if (dob.getUTCMonth() !== mm - 1 || dob.getUTCDate() !== dd) return { valid: false, reason: 'date of birth portion is not a real date' };

  let ageYears = now.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday = now.getUTCMonth() < dob.getUTCMonth() || (now.getUTCMonth() === dob.getUTCMonth() && now.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) ageYears -= 1;

  const seq = Number(digits.slice(6, 10));
  const citizenshipDigit = digits[10];
  if (citizenshipDigit !== '0' && citizenshipDigit !== '1') return { valid: false, reason: 'citizenship digit must be 0 or 1' };

  return {
    valid: true,
    facts: {
      number: digits,
      dateOfBirth: dob.toISOString().slice(0, 10),
      ageYears,
      gender: seq >= 5000 ? 'male' : 'female',
      citizenship: citizenshipDigit === '0' ? 'citizen' : 'permanent_resident',
    },
  };
}

const CIPC_ENTITY_TYPES: Record<string, string> = {
  '06': 'Public company (Ltd)',
  '07': 'Private company (Pty) Ltd',
  '08': 'Non-profit company (NPC)',
  '09': 'Personal liability / unlimited company',
  '10': 'External company',
  '11': 'Co-operative',
  '21': 'Personal liability company (Inc)',
  '22': 'Foreign company',
  '23': 'Close corporation (CC)',
  '24': 'State-owned company (SOC)',
  '25': 'Primary co-operative',
  '26': 'Secondary co-operative',
  '30': 'Non-profit company (NPC)',
  '31': 'Personal liability company',
};

/** CIPC enterprise number in the form YYYY/NNNNNN/NN (also accepts K-prefixed CC numbers and unslashed input). */
export function validateCipcRegistrationNumber(input: string): { valid: boolean; reason?: string; facts?: MechanicalFacts['cipcNumber'] } {
  let s = String(input || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!s) return { valid: false, reason: 'empty' };
  s = s.replace(/^(K|CK)/, '');
  const compact = s.replace(/[\/\-]/g, '');
  if (!/^\d{12}$/.test(compact)) return { valid: false, reason: 'expected the format YYYY/NNNNNN/NN, e.g. 2020/548105/07' };
  const year = Number(compact.slice(0, 4));
  const seq = compact.slice(4, 10);
  const type = compact.slice(10, 12);
  const thisYear = new Date().getFullYear();
  if (year < 1900 || year > thisYear) return { valid: false, reason: `registration year ${year} is not plausible` };
  const entityType = CIPC_ENTITY_TYPES[type];
  if (!entityType) return { valid: false, reason: `entity type suffix /${type} is not a recognised CIPC type` };
  return { valid: true, facts: { normalized: `${year}/${seq}/${type}`, year, entityTypeCode: type, entityType } };
}

/** South African phone number: 10 digits starting with 0, or +27 followed by 9 digits. */
export function validateSaPhone(input: string): { valid: boolean; reason?: string; normalized?: string } {
  const s = String(input || '').replace(/[\s\-().]/g, '');
  let digits = s;
  if (digits.startsWith('+27')) digits = '0' + digits.slice(3);
  else if (digits.startsWith('27') && digits.length === 11) digits = '0' + digits.slice(2);
  else if (digits.startsWith('0027')) digits = '0' + digits.slice(4);
  if (!/^0\d{9}$/.test(digits)) return { valid: false, reason: 'must be 10 digits starting with 0 (or +27 and 9 digits)' };
  return { valid: true, normalized: digits };
}

export function validateEmail(input: string): { valid: boolean; reason?: string; normalized?: string } {
  const s = String(input || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(s)) return { valid: false, reason: 'is not a valid email address' };
  return { valid: true, normalized: s };
}

// ---------------------------------------------------------------------------------------------
// File inspection
// ---------------------------------------------------------------------------------------------

function detectType(buf: Uint8Array): MechanicalFacts['detectedType'] {
  if (buf.length >= 5 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return 'pdf'; // %PDF
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  if (buf.length >= 12 && buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45) return 'webp';
  if (buf.length >= 12 && buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) return 'heic'; // ftyp box
  if (buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04) {
    // zip container: xlsx / docx / plain zip — sniff for the content-type marker in the first 4KB
    const head = Buffer.from(buf.slice(0, 4096)).toString('latin1');
    if (head.includes('xl/')) return 'xlsx';
    if (head.includes('word/')) return 'docx';
    return 'zip';
  }
  // CSV heuristic: printable text with commas/semicolons and newlines in the first 2KB
  const sample = Buffer.from(buf.slice(0, 2048)).toString('utf8');
  // eslint-disable-next-line no-control-regex
  if (sample.length > 0 && !/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(sample) && /[,;]/.test(sample) && /\n/.test(sample)) return 'csv';
  return 'unknown';
}

/** Lightweight PDF inspection without pdf-lib: page count and encryption flag from the raw bytes. */
function inspectPdf(buf: Uint8Array): { pageCount?: number; encrypted: boolean; parseable: boolean } {
  const text = Buffer.from(buf).toString('latin1');
  const encrypted = /\/Encrypt\b/.test(text);
  const parseable = /%%EOF/.test(text.slice(-2048)) || /startxref/.test(text);
  // Count page objects. Works for most producers; object streams may hide /Type /Page, in which case we leave it undefined.
  const matches = text.match(/\/Type\s*\/Page(?![s\w])/g);
  const pageCount = matches && matches.length > 0 ? matches.length : undefined;
  return { pageCount, encrypted, parseable };
}

const TYPE_EXPECTATIONS: Record<NonNullable<ServiceRequirement['type']>, MechanicalFacts['detectedType'][]> = {
  pdf: ['pdf'],
  image: ['jpeg', 'png', 'webp', 'heic'],
  excel: ['xlsx', 'csv'],
  any: ['pdf', 'jpeg', 'png', 'webp', 'heic', 'xlsx', 'csv', 'docx', 'zip'],
  text: [],
};

export function inspectFile(buf: Uint8Array | Buffer, fileName: string, expectedType: ServiceRequirement['type'] = 'any'): { issues: MechanicalIssue[]; facts: MechanicalFacts } {
  const issues: MechanicalIssue[] = [];
  const facts: MechanicalFacts = { byteLength: buf.length };
  const nice = fileName || 'the file';

  if (buf.length === 0) {
    issues.push({ code: 'EMPTY_FILE', severity: 'fail', message: `${nice} is empty (0 bytes). Please re-upload it.` });
    return { issues, facts };
  }
  if (buf.length > MAX_UPLOAD_BYTES) {
    issues.push({ code: 'FILE_TOO_LARGE', severity: 'fail', message: `${nice} is larger than 25 MB. Please compress it or split it into smaller files.` });
  }

  facts.sha256 = createHash('sha256').update(buf).digest('hex');
  facts.detectedType = detectType(buf);

  if (facts.detectedType === 'pdf') {
    const pdf = inspectPdf(buf);
    facts.pdfEncrypted = pdf.encrypted;
    if (pdf.pageCount) facts.pdfPageCount = pdf.pageCount;
    if (pdf.encrypted) {
      // Most bank letters carry an /Encrypt dictionary for *permissions* (no copy/edit) but open
      // without a password. We cannot tell the two apart from the bytes alone, so this is only a
      // warning; the extraction step decides — if the file genuinely cannot be opened, the
      // verification cycle rejects it with the password message then.
      issues.push({ code: 'PASSWORD_PROTECTED', severity: 'warn', message: `${nice} has security settings; we will still try to read it.` });
    } else if (!pdf.parseable) {
      issues.push({ code: 'UNREADABLE_PDF', severity: 'warn', message: `${nice} looks like a damaged or incomplete PDF. If it opens on your side, ignore this; otherwise please re-download and upload again.` });
    }
  }

  const expected = TYPE_EXPECTATIONS[expectedType || 'any'] || TYPE_EXPECTATIONS.any;
  if (facts.detectedType === 'unknown') {
    issues.push({ code: 'UNSUPPORTED_TYPE', severity: 'warn', message: `We could not recognise the format of ${nice}. PDF, JPG, PNG or Excel work best.` });
  } else if (expected.length && !expected.includes(facts.detectedType)) {
    const want = expectedType === 'pdf' ? 'a PDF' : expectedType === 'image' ? 'an image (JPG or PNG)' : expectedType === 'excel' ? 'an Excel or CSV file' : 'a supported file';
    issues.push({ code: 'TYPE_MISMATCH', severity: 'warn', message: `${nice} is a ${String(facts.detectedType).toUpperCase()} but this requirement asks for ${want}. We'll still look at it, but ${want} is preferred.` });
  }

  return { issues, facts };
}

// ---------------------------------------------------------------------------------------------
// Text requirement checks
// ---------------------------------------------------------------------------------------------

function guessTextKind(req: Pick<ServiceRequirement, 'label' | 'documentKind'>): 'sa_id' | 'cipc' | 'phone' | 'email' | 'other' {
  if (req.documentKind === 'sa_id') return 'sa_id';
  const l = (req.label || '').toLowerCase();
  if (/\bid (number|no)\b|identity number/.test(l)) return 'sa_id';
  if (/registration (number|no)|enterprise (number|no)|\bck number\b|\bcipc (number|no)\b/.test(l)) return 'cipc';
  if (/\b(cell|phone|contact|mobile|telephone) (number|no)\b|\bcell\b/.test(l)) return 'phone';
  if (/\bemail\b|e-mail/.test(l)) return 'email';
  return 'other';
}

export function checkTextValue(req: Pick<ServiceRequirement, 'label' | 'documentKind' | 'isSecret'>, value: string): { issues: MechanicalIssue[]; facts: MechanicalFacts } {
  const issues: MechanicalIssue[] = [];
  const facts: MechanicalFacts = {};
  const v = String(value || '').trim();
  if (!v) {
    issues.push({ code: 'EMPTY_TEXT', severity: 'fail', message: `Please enter a value for "${req.label}".` });
    return { issues, facts };
  }
  if (req.isSecret) return { issues, facts }; // never inspect credentials

  switch (guessTextKind(req)) {
    case 'sa_id': {
      const r = validateSaIdNumber(v);
      if (!r.valid) issues.push({ code: 'INVALID_SA_ID', severity: 'fail', message: `The ID number for "${req.label}" doesn't look right (${r.reason}). Please check it against the ID document.` });
      else facts.saId = r.facts;
      break;
    }
    case 'cipc': {
      const r = validateCipcRegistrationNumber(v);
      if (!r.valid) issues.push({ code: 'INVALID_CIPC_NUMBER', severity: 'warn', message: `The registration number for "${req.label}" doesn't match the usual CIPC format (${r.reason}). Please double-check it.` });
      else facts.cipcNumber = r.facts;
      break;
    }
    case 'phone': {
      const r = validateSaPhone(v);
      if (!r.valid) issues.push({ code: 'INVALID_PHONE', severity: 'fail', message: `The number for "${req.label}" ${r.reason}.` });
      else facts.phone = { normalized: r.normalized! };
      break;
    }
    case 'email': {
      const r = validateEmail(v);
      if (!r.valid) issues.push({ code: 'INVALID_EMAIL', severity: 'fail', message: `The email address for "${req.label}" ${r.reason}.` });
      else facts.email = { normalized: r.normalized! };
      break;
    }
  }
  return { issues, facts };
}

// ---------------------------------------------------------------------------------------------
// Completeness
// ---------------------------------------------------------------------------------------------

export type CompletenessResult = {
  complete: boolean;
  missingRequired: { id?: string; label: string }[];
  missingOptional: { id?: string; label: string }[];
  rejected: { id?: string; label: string }[];
};

/** Which requirements from a service snapshot still have no upload (or a rejected one). */
export function checkCompleteness(
  requirements: Pick<ServiceRequirement, 'id' | 'label' | 'isRequired' | 'isConditional'>[],
  uploads: { requirementId?: string; requirementLabel?: string; status?: string; notAvailableReason?: string }[]
): CompletenessResult {
  const res: CompletenessResult = { complete: true, missingRequired: [], missingOptional: [], rejected: [] };
  for (const req of requirements) {
    const match = uploads.find(u => (req.id && u.requirementId === req.id) || (u.requirementLabel || '').trim().toLowerCase() === (req.label || '').trim().toLowerCase());
    const required = req.isRequired !== false && !req.isConditional;
    if (!match) {
      (required ? res.missingRequired : res.missingOptional).push({ id: req.id, label: req.label });
    } else if (match.status === 'rejected') {
      res.rejected.push({ id: req.id, label: req.label });
    }
  }
  res.complete = res.missingRequired.length === 0 && res.rejected.length === 0;
  return res;
}

// ---------------------------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------------------------

export function summarize(issues: MechanicalIssue[], facts: MechanicalFacts, checkedAt = new Date().toISOString()): MechanicalCheckResult {
  const status: MechanicalCheckResult['status'] = issues.some(i => i.severity === 'fail') ? 'fail' : issues.length ? 'warn' : 'pass';
  return { version: 1, checkedAt, status, issues, facts };
}

/** Flag an upload whose hash matches another file already on the order. */
export function duplicateIssue(sha256: string | undefined, existingHashes: Map<string, string>, fileName: string): MechanicalIssue | null {
  if (!sha256) return null;
  const other = existingHashes.get(sha256);
  if (!other) return null;
  return { code: 'DUPLICATE_FILE', severity: 'warn', message: `${fileName || 'This file'} is identical to the file you already uploaded for "${other}". If that was intended, ignore this; otherwise please upload the correct document.` };
}

/** One-line client-facing summary for a result, or null when nothing needs saying. */
export function clientMessageFor(result: MechanicalCheckResult): string | null {
  if (!result.issues.length) return null;
  const fails = result.issues.filter(i => i.severity === 'fail').map(i => i.message);
  const warns = result.issues.filter(i => i.severity === 'warn').map(i => i.message);
  return [...fails, ...warns].join(' ');
}
