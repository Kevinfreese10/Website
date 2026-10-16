/**
 * The auto-send gate. This is the ONLY place that decides whether an email goes to a client with
 * no human check. It is a pure function so every rule is unit-tested (gate.test.ts).
 *
 * The AI classifies and drafts; the code decides. Gemini cannot grant itself permission to send.
 */
import { PRACTICE_ADDRESSES, KEVIN_ADDRESS, QUOTE_POLICY } from './config';
import type { EmailCategory, GateDecision, GateInput } from './types';

/** Categories that are alerted to Kevin but never get a client-facing draft. */
const NOTIFY_ONLY: EmailCategory[] = ['order_update', 'regulator', 'system_notice'];

/** Categories where a reply is drafted and waits for Kevin's [Send] button. */
const REVIEW: EmailCategory[] = [
  'retainer', 'tax_debt', 'custom_scope', 'out_of_scope', 'kevin_forward',
  'quote_acceptance', 'quote_question', 'general_enquiry',
];

const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

export function isValidClientRecipient(addr: string | null | undefined): addr is string {
  if (!addr) return false;
  const a = addr.trim().toLowerCase();
  return EMAIL_RE.test(a) && !PRACTICE_ADDRESSES.includes(a) && a !== KEVIN_ADDRESS;
}

export function decideAction(input: GateInput, policy = QUOTE_POLICY): GateDecision {
  if (input.category === 'spam') return { action: 'ignore', reasons: ['Classified as spam.'] };
  if (NOTIFY_ONLY.includes(input.category)) return { action: 'notify_only', reasons: [`Category ${input.category} is alert-only.`] };
  if (REVIEW.includes(input.category)) return { action: 'draft_for_review', reasons: [`Category ${input.category} always needs Kevin's approval.`] };

  // From here on: catalog_quote. Every failed rule is collected so the review alert says exactly why.
  const reasons: string[] = [];
  if (input.mode !== 'live') reasons.push(`Agent mode is "${input.mode}".`);
  if (input.originType === 'FORWARD_FROM_KEVIN') reasons.push('Forwarded by Kevin: never sent to the client automatically.');
  if (input.isThreadReply) reasons.push('Reply in an existing thread: never answered automatically.');
  if (!isValidClientRecipient(input.recipient)) reasons.push('No valid external recipient address.');
  if (input.confidence < policy.minConfidence) reasons.push(`AI confidence ${input.confidence.toFixed(2)} is below ${policy.minConfidence}.`);
  if (input.requestedServiceCount < 1) reasons.push('No catalog service identified.');
  if (input.requestedServiceCount > policy.maxServices) reasons.push(`${input.requestedServiceCount} services requested (auto-send limit is ${policy.maxServices}).`);
  if (input.unmatchedRequests > 0) reasons.push(`${input.unmatchedRequests} request(s) have no catalog match.`);
  if (input.unknownSlugs > 0) reasons.push(`${input.unknownSlugs} AI-selected service(s) don't exist in the catalog.`);
  if (input.warnings > 0) reasons.push(`${input.warnings} price warning(s) (TBC / R0 / expired / unavailable).`);
  if (!(input.total > 0)) reasons.push('Quote total is zero.');
  if (input.total > policy.maxTotalZar) reasons.push(`Total R${input.total.toLocaleString('en-US')} exceeds the R${policy.maxTotalZar.toLocaleString('en-US')} auto-send limit.`);
  if (input.recentAutoQuotesToRecipient >= policy.maxAutoQuotesPerSenderPer24h) {
    reasons.push(`Already sent ${input.recentAutoQuotesToRecipient} automatic quotes to this sender in 24h (limit ${policy.maxAutoQuotesPerSenderPer24h}).`);
  }
  for (const p of input.contentProblems) reasons.push(`Content check: ${p}`);

  if (reasons.length) return { action: 'draft_for_review', reasons };
  return { action: 'auto_send', reasons: ['All strict catalog rules passed.'] };
}
