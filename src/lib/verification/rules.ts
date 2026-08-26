/**
 * Layer 3 — the rules engine. Plain code, no AI, deterministic, unit-tested.
 *
 * Takes the facts Layer 2 extracted from a document plus what the playbook requires plus the
 * order's resolved entity, and answers: pass / fail / needs_human — always with a reason a
 * human can read in one sentence. See AI-ORDER-AGENT-PLAN.md §4.1, §6.2.
 *
 * Design rule: when in doubt, needs_human. A wrong "pass" costs a bounced statutory filing;
 * a wrong "needs_human" costs Kevin thirty seconds.
 */

import type { DocumentKind, ServiceRequirement } from '@/lib/types';
import type { ExtractedDocumentFacts } from './facts';

export type RuleVerdict = 'pass' | 'fail' | 'needs_human';

export type RuleCheck = {
  code: 'KIND' | 'LEGIBLE' | 'NAME' | 'REG_NUMBER' | 'AGE' | 'CERTIFIED' | 'CONFIDENCE';
  result: RuleVerdict | 'skipped';
  detail: string;
};

export type RuleOutcome = {
  verdict: RuleVerdict;
  /** One plain-English sentence per finding. The first is the headline. */
  reasons: string[];
  checks: RuleCheck[];
  /** Client-safe message for a `fail` (what to fix), or null. */
  clientMessage: string | null;
};

export type EntityContext = {
  /** The company / entity the service is for (may be undefined for individual services). */
  entityName?: string;
  registrationNumber?: string;
  /** Directors / individuals associated with the order. */
  personNames?: string[];
  idNumbers?: string[];
  /** Who placed the order. Never used for matching a company document — that was bug #10135. */
  orderingContactName?: string;
};

export type RuleInput = {
  requirement: Pick<ServiceRequirement, 'label' | 'documentKind' | 'inNameOf' | 'maxAgeDays' | 'mustBeCertified' | 'alternatives'>;
  facts: ExtractedDocumentFacts;
  entity: EntityContext;
  today: Date;
  /** Below this kindConfidence the engine refuses to decide. Default 60. */
  minKindConfidence?: number;
};

// ---------------------------------------------------------------------------------------------
// Name normalisation and matching
// ---------------------------------------------------------------------------------------------

const ENTITY_NOISE = /\b(PTY|LTD|LIMITED|PROPRIETARY|INC|INCORPORATED|NPC|CC|CLOSE CORPORATION|SOC|TRADING AS|T\/A|THE|AND|&)\b/g;

export function normalizeName(s: string): string {
  return String(s || '')
    .toUpperCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^A-Z0-9 ]+/g, ' ')
    .replace(ENTITY_NOISE, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Token-overlap similarity in [0,1]; robust to reordering, initials and suffixes. */
export function nameSimilarity(a: string, b: string): number {
  const ta = new Set(normalizeName(a).split(' ').filter(Boolean));
  const tb = new Set(normalizeName(b).split(' ').filter(Boolean));
  if (!ta.size || !tb.size) return 0;
  let hits = 0;
  for (const t of ta) {
    if (tb.has(t)) { hits++; continue; }
    // initials: "K FREESE" vs "KEVIN FREESE"
    if (t.length === 1 && [...tb].some(x => x.startsWith(t))) hits += 0.5;
  }
  return hits / Math.max(ta.size, tb.size);
}

export const NAME_MATCH_THRESHOLD = 0.6;

// ---------------------------------------------------------------------------------------------
// Kind equivalences: what counts as the same thing for a requirement
// ---------------------------------------------------------------------------------------------

const KIND_EQUIVALENTS: Partial<Record<string, DocumentKind[]>> = {
  sa_id: ['passport'],
  passport: ['sa_id'],
  director_id: ['sa_id', 'passport'],
  id_document: ['sa_id', 'passport'],
  identity_document: ['sa_id', 'passport'],
  proof_of_address: ['bank_statement', 'invoice'], // a recent statement/utility invoice is commonly accepted
  cor14_3: ['cor39', 'moi'],
  afs: ['management_accounts'],
  tcs_pin: ['sars_notice_of_registration'],
};

function kindAcceptable(expected: string | undefined, actual: DocumentKind): 'exact' | 'equivalent' | 'no' {
  if (!expected) return 'exact';
  if (expected === actual) return 'exact';
  if (expected === 'director_id' || expected === 'id_document' || expected === 'identity_document') {
    if (actual === 'sa_id' || actual === 'passport') return 'exact';
  }
  if ((KIND_EQUIVALENTS[expected] || []).includes(actual)) return 'equivalent';
  return 'no';
}

// ---------------------------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------------------------

function parseIso(d?: string): Date | null {
  if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  const dt = new Date(d + 'T00:00:00Z');
  return isNaN(dt.getTime()) ? null : dt;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / 86_400_000);
}

function findDate(facts: ExtractedDocumentFacts, purpose: string): Date | null {
  const hit = facts.dates.find(d => d.purpose === purpose);
  return hit ? parseIso(hit.date) : null;
}

/** The date that matters for "not older than N days": certification date if certified, else issue date, else latest date on the doc. */
export function effectiveDocumentDate(facts: ExtractedDocumentFacts, mustBeCertified?: boolean): { date: Date | null; source: string } {
  if (mustBeCertified) {
    const c = findDate(facts, 'certified');
    if (c) return { date: c, source: 'certification stamp date' };
  }
  const issued = findDate(facts, 'issued');
  if (issued) return { date: issued, source: 'issue date' };
  const end = findDate(facts, 'statement_period_end');
  if (end) return { date: end, source: 'statement period end' };
  const signed = findDate(facts, 'signed');
  if (signed) return { date: signed, source: 'signature date' };
  const all = facts.dates.map(d => parseIso(d.date)).filter((d): d is Date => !!d).sort((a, b) => b.getTime() - a.getTime());
  return all.length ? { date: all[0], source: 'latest date on the document' } : { date: null, source: 'no date found' };
}

// ---------------------------------------------------------------------------------------------
// The engine
// ---------------------------------------------------------------------------------------------

export function evaluateDocument(input: RuleInput): RuleOutcome {
  const { requirement, facts, entity, today } = input;
  const minConf = input.minKindConfidence ?? 60;
  const checks: RuleCheck[] = [];
  const reasons: string[] = [];
  const clientFixes: string[] = [];
  const label = requirement.label;

  // The overall verdict is derived from checks[] at the end (worst wins).

  // 1. Legibility — an unreadable document fails outright; the client can fix it.
  if (!facts.legible) {
    checks.push({ code: 'LEGIBLE', result: 'fail', detail: 'Document is not legible.' });
    reasons.push(`The upload for "${label}" is not legible.`);
    clientFixes.push(`The file you uploaded for "${label}" is too blurry or dark to read. Please upload a clear scan or photo.`);
  } else {
    checks.push({ code: 'LEGIBLE', result: 'pass', detail: 'Legible.' });
  }

  // 2. Confidence gate — we don't act on a guess.
  if (facts.kindConfidence < minConf) {
    checks.push({ code: 'CONFIDENCE', result: 'needs_human', detail: `Kind confidence ${facts.kindConfidence} < ${minConf}.` });
    reasons.push(`Not sure what kind of document this is (${facts.documentKind}, ${facts.kindConfidence}% confidence).`);
  } else {
    checks.push({ code: 'CONFIDENCE', result: 'pass', detail: `Kind confidence ${facts.kindConfidence}.` });
  }

  // 3. Kind
  const kindResult = kindAcceptable(requirement.documentKind, facts.documentKind);
  if (kindResult === 'no') {
    checks.push({ code: 'KIND', result: 'fail', detail: `Expected ${requirement.documentKind}, got ${facts.documentKind}.` });
    reasons.push(`Expected a ${humanKind(requirement.documentKind!)} for "${label}" but this looks like a ${humanKind(facts.documentKind)}.`);
    clientFixes.push(`For "${label}" we need a ${humanKind(requirement.documentKind!)}; the file you sent looks like a ${humanKind(facts.documentKind)}.`);
  } else if (kindResult === 'equivalent') {
    checks.push({ code: 'KIND', result: 'needs_human', detail: `Got ${facts.documentKind}, an accepted alternative to ${requirement.documentKind}.` });
    reasons.push(`This is a ${humanKind(facts.documentKind)} rather than a ${humanKind(requirement.documentKind!)} — usually acceptable, please confirm.`);
  } else {
    checks.push({ code: 'KIND', result: 'pass', detail: `Kind ${facts.documentKind}.` });
  }

  // 4. Name — compared against the ENTITY or DIRECTOR per the requirement, never the ordering contact.
  const nameOutcome = checkName(requirement, facts, entity);
  checks.push(nameOutcome.check);
  if (nameOutcome.check.result !== 'pass' && nameOutcome.check.result !== 'skipped') {
    reasons.push(nameOutcome.reason!);
    if (nameOutcome.check.result === 'fail' && nameOutcome.clientFix) clientFixes.push(nameOutcome.clientFix);
  }

  // 5. Registration number, when both sides have one.
  const regOnDoc = facts.identifiers.find(i => i.type === 'cipc_reg')?.value;
  if (regOnDoc && entity.registrationNumber) {
    const same = digitsOnly(regOnDoc) === digitsOnly(entity.registrationNumber);
    checks.push({ code: 'REG_NUMBER', result: same ? 'pass' : 'fail', detail: `${regOnDoc} vs ${entity.registrationNumber}` });
    if (!same) {
      reasons.push(`Registration number on the document (${regOnDoc}) does not match the order (${entity.registrationNumber}).`);
      clientFixes.push(`The registration number on "${label}" (${regOnDoc}) doesn't match the company on this order. Please check you've uploaded the right company's document.`);
    }
  } else {
    checks.push({ code: 'REG_NUMBER', result: 'skipped', detail: 'No registration number to compare.' });
  }

  // 6. Age
  if (requirement.maxAgeDays && requirement.maxAgeDays > 0) {
    const { date, source } = effectiveDocumentDate(facts, requirement.mustBeCertified);
    if (!date) {
      checks.push({ code: 'AGE', result: 'needs_human', detail: 'No usable date found.' });
      reasons.push(`Could not find a date on "${label}" to check it is within ${requirement.maxAgeDays} days.`);
    } else {
      const age = daysBetween(today, date);
      if (age < 0) {
        checks.push({ code: 'AGE', result: 'needs_human', detail: `${source} ${iso(date)} is after today ${iso(today)}.` });
        reasons.push(`The ${source} (${iso(date)}) is after today — probably a mis-read date.`);
      } else if (age > requirement.maxAgeDays) {
        checks.push({ code: 'AGE', result: 'fail', detail: `${age} days old (${source} ${iso(date)}), limit ${requirement.maxAgeDays}.` });
        reasons.push(`"${label}" is ${age} days old (${source} ${iso(date)}); the limit is ${requirement.maxAgeDays} days.`);
        clientFixes.push(`"${label}" is dated ${iso(date)}, which is older than ${requirement.maxAgeDays} days. Please upload a more recent one.`);
      } else {
        checks.push({ code: 'AGE', result: 'pass', detail: `${age} days old (${source} ${iso(date)}).` });
      }
    }
  } else {
    checks.push({ code: 'AGE', result: 'skipped', detail: 'No age limit.' });
  }

  // 7. Certification
  if (requirement.mustBeCertified) {
    if (facts.hasCertificationStamp) {
      checks.push({ code: 'CERTIFIED', result: 'pass', detail: 'Certification stamp visible.' });
    } else if (facts.hasDigitalVerificationReference) {
      checks.push({ code: 'CERTIFIED', result: 'needs_human', detail: 'No stamp, but a digital verification reference is present.' });
      reasons.push(`No certification stamp on "${label}", but it carries a digital verification reference — decide whether that is acceptable here.`);
    } else {
      checks.push({ code: 'CERTIFIED', result: 'fail', detail: 'No certification stamp.' });
      reasons.push(`"${label}" must be a certified copy and no certification stamp is visible.`);
      clientFixes.push(`"${label}" needs to be certified by a Commissioner of Oaths or at a police station (the stamp must be visible and dated within the last 3 months).`);
    }
  } else {
    checks.push({ code: 'CERTIFIED', result: 'skipped', detail: 'Certification not required.' });
  }

  const verdict: RuleVerdict = checks.some(c => c.result === 'fail') ? 'fail' : checks.some(c => c.result === 'needs_human') ? 'needs_human' : 'pass';
  if (verdict === 'pass') reasons.unshift(`"${label}" matches what the playbook requires.`);

  return {
    verdict,
    reasons,
    checks,
    clientMessage: verdict === 'fail' && clientFixes.length ? clientFixes.join(' ') : null,
  };
}

// ---------------------------------------------------------------------------------------------

function checkName(
  requirement: RuleInput['requirement'],
  facts: ExtractedDocumentFacts,
  entity: EntityContext
): { check: RuleCheck; reason?: string; clientFix?: string } {
  const inNameOf = requirement.inNameOf;
  const kind = facts.documentKind;
  const docNames = facts.names.map(n => n.name).filter(Boolean);

  if (!inNameOf || inNameOf === 'either' && !entity.entityName && !(entity.personNames || []).length) {
    return { check: { code: 'NAME', result: 'skipped', detail: 'No name expectation.' } };
  }
  if (!docNames.length) {
    // Photos, receipts etc. legitimately have no names; identity/bank docs always do.
    const namey: DocumentKind[] = ['sa_id', 'passport', 'bank_confirmation', 'cor14_3', 'tcs_pin', 'criminal_clearance', 'letter_of_good_standing'];
    if (namey.includes(kind)) {
      return { check: { code: 'NAME', result: 'needs_human', detail: 'No names extracted from a document that should carry one.' }, reason: `No name could be read from "${requirement.label}".` };
    }
    return { check: { code: 'NAME', result: 'skipped', detail: 'Document carries no names.' } };
  }

  const candidates: { label: string; name: string }[] = [];
  if (inNameOf === 'entity' || inNameOf === 'either') {
    if (entity.entityName) candidates.push({ label: 'the company', name: entity.entityName });
  }
  if (inNameOf === 'director' || inNameOf === 'either') {
    for (const p of entity.personNames || []) candidates.push({ label: 'a director', name: p });
  }
  if (!candidates.length) {
    return { check: { code: 'NAME', result: 'needs_human', detail: `Requirement wants ${inNameOf} name but the order has none resolved.` }, reason: `"${requirement.label}" should be in the name of ${inNameOf === 'entity' ? 'the company' : 'a director'}, but the order has no ${inNameOf === 'entity' ? 'company' : 'director'} name recorded yet.` };
  }

  let best = { score: 0, doc: '', cand: candidates[0] };
  for (const d of docNames) for (const c of candidates) {
    const s = nameSimilarity(d, c.name);
    if (s > best.score) best = { score: s, doc: d, cand: c };
  }

  if (best.score >= NAME_MATCH_THRESHOLD) {
    return { check: { code: 'NAME', result: 'pass', detail: `"${best.doc}" matches ${best.cand.label} "${best.cand.name}" (${Math.round(best.score * 100)}%).` } };
  }

  // Specific, common mistake: document in the ordering contact's name when the company's was needed.
  const contact = entity.orderingContactName;
  if (inNameOf === 'entity' && contact && docNames.some(d => nameSimilarity(d, contact) >= NAME_MATCH_THRESHOLD)) {
    return {
      check: { code: 'NAME', result: 'fail', detail: `Document is in the ordering contact's name (${contact}); company name required.` },
      reason: `"${requirement.label}" is in ${contact}'s personal name; it must be in the company's name (${entity.entityName}).`,
      clientFix: `"${requirement.label}" must be in the company's name (${entity.entityName}), not a personal name.`,
    };
  }

  return {
    check: { code: 'NAME', result: 'needs_human', detail: `Best match ${Math.round(best.score * 100)}%: "${best.doc}" vs ${best.cand.label} "${best.cand.name}".` },
    reason: `Name on "${requirement.label}" ("${best.doc}") does not clearly match ${best.cand.label} "${best.cand.name}".`,
  };
}

function digitsOnly(s: string) { return String(s || '').replace(/\D/g, ''); }
function iso(d: Date) { return d.toISOString().slice(0, 10); }

export function humanKind(k: DocumentKind): string {
  const map: Partial<Record<DocumentKind, string>> = {
    sa_id: 'South African ID', passport: 'passport', proof_of_address: 'proof of address', cor14_3: 'CIPC registration certificate (CoR14.3)',
    cor39: 'CIPC CoR39 director notice', moi: 'MOI', bank_confirmation: 'bank confirmation letter', bank_statement: 'bank transaction statement',
    tcs_pin: 'tax compliance status / PIN', sars_notice_of_registration: 'SARS notice of registration', afs: 'set of annual financial statements',
    management_accounts: 'set of management accounts', trial_balance: 'trial balance', payslip: 'payslip', irp5: 'IRP5', it3: 'IT3 certificate',
    criminal_clearance: 'police clearance certificate', letter_of_good_standing: 'letter of good standing', power_of_attorney: 'power of attorney',
    resolution: 'resolution', share_certificate: 'share certificate', letterhead: 'letter on letterhead', photo: 'photo', other: 'document',
  };
  return map[k] || k.replace(/_/g, ' ');
}
