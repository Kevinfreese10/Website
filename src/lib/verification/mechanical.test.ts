import { describe, it, expect } from 'vitest';
import {
  validateSaIdNumber,
  validateCipcRegistrationNumber,
  validateSaPhone,
  validateEmail,
  inspectFile,
  checkTextValue,
  checkCompleteness,
  summarize,
  duplicateIssue,
  clientMessageFor,
} from './mechanical';

/** Build a valid SA ID by computing the Luhn check digit for a 12-digit prefix. */
function withLuhn(prefix12: string): string {
  for (let c = 0; c <= 9; c++) {
    const candidate = prefix12 + c;
    let sum = 0;
    for (let i = 0; i < 13; i++) {
      let d = Number(candidate[i]);
      if ((13 - i) % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
      sum += d;
    }
    if (sum % 10 === 0) return candidate;
  }
  throw new Error('no check digit');
}

describe('validateSaIdNumber', () => {
  it('accepts a well-formed ID and extracts DOB, gender and citizenship', () => {
    const id = withLuhn('860620504608'); // Kevin's published ID prefix pattern: 1986-06-20, male, citizen
    const r = validateSaIdNumber(id);
    expect(r.valid).toBe(true);
    expect(r.facts?.dateOfBirth).toBe('1986-06-20');
    expect(r.facts?.gender).toBe('male');
    expect(r.facts?.citizenship).toBe('citizen');
    expect(r.facts?.ageYears).toBeGreaterThanOrEqual(40);
  });

  it('rejects a bad checksum', () => {
    const id = withLuhn('900101500008');
    const tampered = id.slice(0, 5) + (id[5] === '9' ? '0' : String(Number(id[5]) + 1)) + id.slice(6);
    expect(validateSaIdNumber(tampered).valid).toBe(false);
  });

  it('rejects wrong length, impossible dates and bad citizenship digit', () => {
    expect(validateSaIdNumber('12345').valid).toBe(false);
    expect(validateSaIdNumber(withLuhn('901301500008')).valid).toBe(false); // month 13
    expect(validateSaIdNumber(withLuhn('900230500008')).valid).toBe(false); // 30 Feb
    expect(validateSaIdNumber(withLuhn('900101500028')).valid).toBe(false); // citizenship 2
  });

  it('tolerates spaces', () => {
    const id = withLuhn('750315012308');
    expect(validateSaIdNumber(id.slice(0, 6) + ' ' + id.slice(6)).valid).toBe(true);
  });
});

describe('validateCipcRegistrationNumber', () => {
  it('normalises common inputs', () => {
    expect(validateCipcRegistrationNumber('2020/548105/07').facts?.normalized).toBe('2020/548105/07');
    expect(validateCipcRegistrationNumber('2020548105 07').facts?.normalized).toBe('2020/548105/07');
    expect(validateCipcRegistrationNumber('K2015/123456/23').facts?.entityType).toContain('Close corporation');
  });
  it('rejects unknown suffixes and implausible years', () => {
    expect(validateCipcRegistrationNumber('2020/548105/99').valid).toBe(false);
    expect(validateCipcRegistrationNumber('2099/548105/07').valid).toBe(false);
    expect(validateCipcRegistrationNumber('abc').valid).toBe(false);
  });
});

describe('phone and email', () => {
  it('normalises SA phone formats', () => {
    expect(validateSaPhone('082 123 4567').normalized).toBe('0821234567');
    expect(validateSaPhone('+27 82 123 4567').normalized).toBe('0821234567');
    expect(validateSaPhone('27821234567').normalized).toBe('0821234567');
    expect(validateSaPhone('821234567').valid).toBe(false);
  });
  it('validates email loosely', () => {
    expect(validateEmail(' Kev@Thinkestry.co.za ').normalized).toBe('kev@thinkestry.co.za');
    expect(validateEmail('nope').valid).toBe(false);
  });
});

describe('inspectFile', () => {
  const pdf = (body: string) => Buffer.from(`%PDF-1.4\n${body}\nstartxref\n0\n%%EOF`, 'latin1');

  it('fails an empty file', () => {
    const r = inspectFile(Buffer.alloc(0), 'id.pdf', 'pdf');
    expect(r.issues.map(i => i.code)).toEqual(['EMPTY_FILE']);
  });

  it('passes a plain PDF and counts pages', () => {
    const r = inspectFile(pdf('1 0 obj << /Type /Page >> endobj 2 0 obj << /Type /Page >> endobj 3 0 obj << /Type /Pages >>'), 'id.pdf', 'pdf');
    expect(r.issues).toEqual([]);
    expect(r.facts.detectedType).toBe('pdf');
    expect(r.facts.pdfPageCount).toBe(2);
    expect(r.facts.sha256).toHaveLength(64);
  });

  it('only warns on an encrypted PDF (bank letters are permissions-restricted but open fine)', () => {
    const r = inspectFile(pdf('<< /Encrypt 5 0 R >>'), 'bank.pdf', 'pdf');
    const issue = r.issues.find(i => i.code === 'PASSWORD_PROTECTED');
    expect(issue?.severity).toBe('warn');
    expect(r.facts.pdfEncrypted).toBe(true);
    expect(summarize(r.issues, r.facts).status).toBe('warn');
  });

  it('warns on type mismatch but does not fail', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
    const r = inspectFile(jpeg, 'photo.jpg', 'pdf');
    expect(r.issues.map(i => i.code)).toEqual(['TYPE_MISMATCH']);
    expect(r.issues[0].severity).toBe('warn');
    expect(inspectFile(jpeg, 'photo.jpg', 'image').issues).toEqual([]);
  });

  it('recognises CSV text', () => {
    const r = inspectFile(Buffer.from('Date,Description,Amount\n2026-01-01,Salary,1000\n'), 'tx.csv', 'excel');
    expect(r.facts.detectedType).toBe('csv');
    expect(r.issues).toEqual([]);
  });
});

describe('checkTextValue', () => {
  it('routes by label and never inspects secrets', () => {
    expect(checkTextValue({ label: 'Director ID number' }, '123').issues[0].code).toBe('INVALID_SA_ID');
    expect(checkTextValue({ label: 'Company registration number' }, '2020/548105/07').facts.cipcNumber?.entityTypeCode).toBe('07');
    expect(checkTextValue({ label: 'Contact number for Director' }, '0821234567').facts.phone?.normalized).toBe('0821234567');
    expect(checkTextValue({ label: 'Email address for Director' }, 'x').issues[0].code).toBe('INVALID_EMAIL');
    expect(checkTextValue({ label: 'SARS eFiling Password', isSecret: true }, 'hunter2').issues).toEqual([]);
    expect(checkTextValue({ label: 'Anything' }, '   ').issues[0].code).toBe('EMPTY_TEXT');
  });
});

describe('checkCompleteness', () => {
  const reqs = [
    { id: 'r1', label: 'Certified ID', isRequired: true },
    { id: 'r2', label: 'Share register', isRequired: false },
    { id: 'r3', label: 'Bank letter', isRequired: true },
    { id: 'r4', label: 'VAT number', isRequired: true, isConditional: true },
  ];
  it('lists missing required, optional, and rejected separately', () => {
    const r = checkCompleteness(reqs, [
      { requirementId: 'r1', status: 'approved' },
      { requirementLabel: 'bank letter', status: 'rejected' },
    ]);
    expect(r.complete).toBe(false);
    expect(r.missingRequired).toEqual([]);
    expect(r.missingOptional.map(m => m.id)).toEqual(['r2', 'r4']);
    expect(r.rejected.map(m => m.id)).toEqual(['r3']);
  });
  it('is complete when every required item is present and not rejected', () => {
    const r = checkCompleteness(reqs, [{ requirementId: 'r1', status: 'pending' }, { requirementId: 'r3', status: 'pending' }]);
    expect(r.complete).toBe(true);
  });
});

describe('summarize / duplicates / messages', () => {
  it('derives status from the worst severity', () => {
    expect(summarize([], {}).status).toBe('pass');
    expect(summarize([{ code: 'TYPE_MISMATCH', severity: 'warn', message: 'w' }], {}).status).toBe('warn');
    expect(summarize([{ code: 'EMPTY_FILE', severity: 'fail', message: 'f' }, { code: 'TYPE_MISMATCH', severity: 'warn', message: 'w' }], {}).status).toBe('fail');
  });
  it('flags a duplicate hash against another requirement', () => {
    const m = new Map([['abc', 'Proof of address']]);
    expect(duplicateIssue('abc', m, 'id.pdf')?.code).toBe('DUPLICATE_FILE');
    expect(duplicateIssue('zzz', m, 'id.pdf')).toBeNull();
    expect(duplicateIssue(undefined, m, 'id.pdf')).toBeNull();
  });
  it('joins fails before warns for the client', () => {
    const r = summarize([{ code: 'TYPE_MISMATCH', severity: 'warn', message: 'W.' }, { code: 'EMPTY_FILE', severity: 'fail', message: 'F.' }], {});
    expect(clientMessageFor(r)).toBe('F. W.');
    expect(clientMessageFor(summarize([], {}))).toBeNull();
  });
});
