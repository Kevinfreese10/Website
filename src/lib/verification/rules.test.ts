import { describe, it, expect } from 'vitest';
import { evaluateDocument, nameSimilarity, normalizeName, effectiveDocumentDate, type EntityContext } from './rules';
import type { ExtractedDocumentFacts } from './facts';

const TODAY = new Date('2026-08-20T00:00:00Z');

function facts(partial: Partial<ExtractedDocumentFacts>): ExtractedDocumentFacts {
  return {
    documentKind: 'other', kindConfidence: 95, legible: true, names: [], identifiers: [], dates: [],
    hasStamp: false, hasSignature: false, hasCertificationStamp: false, hasDigitalVerificationReference: false, observations: [],
    ...partial,
  };
}

const bankLetterReq = { label: 'Valid bank confirmation letter (in the business name, not older than 3 months)', documentKind: 'bank_confirmation' as const, inNameOf: 'entity' as const, maxAgeDays: 90 };
const certifiedIdReq = { label: 'Certified ID copy', documentKind: 'sa_id' as const, inNameOf: 'director' as const, maxAgeDays: 90, mustBeCertified: true };

describe('order #10135 regression — bank letter in the company name, not the ordering contact', () => {
  const entity: EntityContext = {
    entityName: 'FIRST BLOOM FINANCE (PTY) LTD',
    registrationNumber: '2023/123456/07',
    personNames: ['Peturnia Mavundlha'],
    orderingContactName: 'Peturnia Mavundlha',
  };
  const doc = facts({
    documentKind: 'bank_confirmation', kindConfidence: 92, issuer: 'FNB',
    names: [{ name: 'FIRST BLOOM FINANCE', role: 'account_holder' }],
    identifiers: [{ type: 'account_number', value: '62012345678' }],
    dates: [{ purpose: 'issued', date: '2026-08-11' }],
    hasStamp: true, hasDigitalVerificationReference: true,
  });

  it('passes: the account holder matches the ENTITY and 11 Aug 2026 is 9 days old, not a future date', () => {
    const r = evaluateDocument({ requirement: bankLetterReq, facts: doc, entity, today: TODAY });
    expect(r.verdict).toBe('pass');
    expect(r.checks.find(c => c.code === 'NAME')?.result).toBe('pass');
    expect(r.checks.find(c => c.code === 'AGE')?.detail).toContain('9 days old');
    expect(r.clientMessage).toBeNull();
  });

  it('fails with a precise client message when the letter is in the ordering contact\'s personal name', () => {
    const personal = facts({ ...doc, names: [{ name: 'P MAVUNDLHA', role: 'account_holder' }] });
    const r = evaluateDocument({ requirement: bankLetterReq, facts: personal, entity, today: TODAY });
    expect(r.verdict).toBe('fail');
    expect(r.reasons.join(' ')).toContain("personal name");
    expect(r.clientMessage).toContain('must be in the company\'s name (FIRST BLOOM FINANCE (PTY) LTD)');
  });

  it('routes an unrelated name to a human rather than failing it', () => {
    const other = facts({ ...doc, names: [{ name: 'SUNRISE TRADING', role: 'account_holder' }] });
    const r = evaluateDocument({ requirement: bankLetterReq, facts: other, entity, today: TODAY });
    expect(r.verdict).toBe('needs_human');
  });
});

describe('kind checks', () => {
  const entity: EntityContext = { entityName: 'ACME (PTY) LTD' };
  it('fails a transaction statement uploaded as a bank confirmation letter', () => {
    const r = evaluateDocument({ requirement: bankLetterReq, facts: facts({ documentKind: 'bank_statement', names: [{ name: 'ACME', role: 'account_holder' }], dates: [{ purpose: 'statement_period_end', date: '2026-08-01' }] }), entity, today: TODAY });
    expect(r.verdict).toBe('fail');
    expect(r.clientMessage).toContain('bank confirmation letter');
    expect(r.clientMessage).toContain('bank transaction statement');
  });
  it('sends an accepted alternative (passport for ID) to a human', () => {
    const r = evaluateDocument({ requirement: { ...certifiedIdReq, mustBeCertified: false, maxAgeDays: undefined }, facts: facts({ documentKind: 'passport', names: [{ name: 'Kevin Freese', role: 'individual' }] }), entity: { personNames: ['Kevin Freese'] }, today: TODAY });
    expect(r.verdict).toBe('needs_human');
    expect(r.reasons[0]).toContain('usually acceptable');
  });
  it('refuses to decide below the confidence gate', () => {
    const r = evaluateDocument({ requirement: bankLetterReq, facts: facts({ documentKind: 'bank_confirmation', kindConfidence: 40, names: [{ name: 'ACME', role: 'account_holder' }], dates: [{ purpose: 'issued', date: '2026-08-01' }] }), entity, today: TODAY });
    expect(r.verdict).toBe('needs_human');
  });
});

describe('age and certification', () => {
  const entity: EntityContext = { personNames: ['Thabo Nkosi'] };
  const idDoc = (certDate?: string, stamp = true) => facts({
    documentKind: 'sa_id', names: [{ name: 'THABO NKOSI', role: 'individual' }],
    identifiers: [{ type: 'sa_id', value: '9001015000087' }],
    dates: certDate ? [{ purpose: 'certified', date: certDate }] : [],
    hasCertificationStamp: stamp,
  });

  it('passes a certified ID within 90 days', () => {
    expect(evaluateDocument({ requirement: certifiedIdReq, facts: idDoc('2026-07-01'), entity, today: TODAY }).verdict).toBe('pass');
  });
  it('fails a certification older than 90 days and tells the client', () => {
    const r = evaluateDocument({ requirement: certifiedIdReq, facts: idDoc('2026-03-01'), entity, today: TODAY });
    expect(r.verdict).toBe('fail');
    expect(r.clientMessage).toContain('older than 90 days');
  });
  it('fails when no certification stamp is visible', () => {
    const r = evaluateDocument({ requirement: certifiedIdReq, facts: idDoc('2026-07-01', false), entity, today: TODAY });
    expect(r.verdict).toBe('fail');
    expect(r.clientMessage).toContain('Commissioner of Oaths');
  });
  it('asks a human when there is no date to check', () => {
    expect(evaluateDocument({ requirement: certifiedIdReq, facts: idDoc(undefined), entity, today: TODAY }).verdict).toBe('needs_human');
  });
  it('treats a future date as a mis-read, not a failure', () => {
    const r = evaluateDocument({ requirement: certifiedIdReq, facts: idDoc('2026-09-15'), entity, today: TODAY });
    expect(r.verdict).toBe('needs_human');
    expect(r.reasons.join(' ')).toContain('after today');
  });
  it('fails an illegible document', () => {
    expect(evaluateDocument({ requirement: certifiedIdReq, facts: { ...idDoc('2026-07-01'), legible: false }, entity, today: TODAY }).verdict).toBe('fail');
  });
});

describe('registration number', () => {
  it('fails a CoR14.3 for a different company', () => {
    const r = evaluateDocument({
      requirement: { label: 'CoR14.3', documentKind: 'cor14_3', inNameOf: 'entity' },
      facts: facts({ documentKind: 'cor14_3', names: [{ name: 'ACME (PTY) LTD', role: 'company' }], identifiers: [{ type: 'cipc_reg', value: '2019/000001/07' }] }),
      entity: { entityName: 'ACME (PTY) LTD', registrationNumber: '2020/548105/07' }, today: TODAY,
    });
    expect(r.verdict).toBe('fail');
    expect(r.reasons.join(' ')).toContain('does not match');
  });
});

describe('name helpers', () => {
  it('normalises entity suffixes and punctuation', () => {
    expect(normalizeName('First Bloom Finance (Pty) Ltd.')).toBe('FIRST BLOOM FINANCE');
    expect(normalizeName('THE ACME TRADING CC')).toBe('ACME TRADING');
  });
  it('scores reordering and initials sensibly', () => {
    expect(nameSimilarity('Freese Kevin', 'Kevin Freese')).toBe(1);
    expect(nameSimilarity('K Freese', 'Kevin Freese')).toBeGreaterThanOrEqual(0.6);
    expect(nameSimilarity('Sunrise Trading', 'First Bloom Finance')).toBe(0);
  });
  it('picks the certification date when certification matters, else the issue date', () => {
    const f = facts({ dates: [{ purpose: 'issued', date: '2026-01-01' }, { purpose: 'certified', date: '2026-08-01' }] });
    expect(effectiveDocumentDate(f, true).source).toBe('certification stamp date');
    expect(effectiveDocumentDate(f, false).source).toBe('issue date');
    expect(effectiveDocumentDate(facts({}), false).date).toBeNull();
  });
});
