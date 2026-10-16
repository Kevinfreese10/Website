/**
 * Pure parsing and filtering helpers for the quote agent (no I/O, unit-tested in filters.test.ts).
 * Ported from .agents/skills/quote-generator/scripts/check_inbox.ts and extended with loop guards.
 */
import { PRACTICE_ADDRESSES } from './config';
import type { InboundEmail } from './types';

// ---------------------------------------------------------------------------------------------
// Loop, bounce and automated-mail detection (decision 10d)
// ---------------------------------------------------------------------------------------------

/** Addresses the agent itself sends from. Mail from these is our own and is never processed. */
const OWN_SENDING_ADDRESSES = PRACTICE_ADDRESSES.filter(a => a !== 'no_reply@myacc.co.za');
const BOUNCE_SENDER_RE = /^(mailer-daemon|postmaster|mail-daemon|bounces?)([+@.-]|$)/i;

export type AutomationVerdict =
  | { kind: 'own' }        // we sent it: drop silently
  | { kind: 'bounce' }     // delivery failure: record, no AI, no reply
  | { kind: 'automated' }  // auto-reply/newsletter/notification: classify for alerts, never reply
  | { kind: 'human' };

export function detectAutomation(email: Pick<InboundEmail, 'fromAddress' | 'headers' | 'subject'>): AutomationVerdict {
  const from = email.fromAddress.toLowerCase();
  if (OWN_SENDING_ADDRESSES.includes(from)) return { kind: 'own' };
  const h = email.headers;
  if (BOUNCE_SENDER_RE.test(from.split('@')[0] + '@') || (h.returnPath || '').trim() === '<>') return { kind: 'bounce' };
  if (/^(undeliverable|delivery status notification|mail delivery failed|returned mail)/i.test(email.subject)) return { kind: 'bounce' };

  const autoSubmitted = (h.autoSubmitted || '').trim().toLowerCase();
  if (autoSubmitted && autoSubmitted !== 'no') return { kind: 'automated' };
  if (/^(bulk|list|junk|auto_reply)$/i.test((h.precedence || '').trim())) return { kind: 'automated' };
  if (h.listId || h.listUnsubscribe) return { kind: 'automated' };
  if (/^(auto(matic)? ?reply|out of (the )?office|autoreply)/i.test(email.subject)) return { kind: 'automated' };
  return { kind: 'human' };
}

// ---------------------------------------------------------------------------------------------
// Spam (cheap pre-filter before spending a Gemini call; Gemini also classifies spam)
// ---------------------------------------------------------------------------------------------

const SPAM_PATTERNS = [
  /seo (agency|services|expert)/i, /guest post/i, /backlinks?/i, /web development services/i,
  /app development company/i, /offshore developers/i, /digital marketing agency/i, /crypto(currency)? investment/i,
  /improve your (website )?ranking/i, /domain renewal notice/i, /first page of google/i,
  /lead generation (services|agency)/i, /marina\.adams68@webmail\.co\.za/i,
];

export function isObviousSpam(fromAddress: string, subject: string, body: string): boolean {
  const combined = `${fromAddress} ${subject} ${body.slice(0, 4000)}`;
  return SPAM_PATTERNS.some(p => p.test(combined));
}

// ---------------------------------------------------------------------------------------------
// Sender authentication for Kevin forwards
// ---------------------------------------------------------------------------------------------

/** True only when the receiving server recorded a passing SPF, DKIM or DMARC result aligned to the domain. */
export function isSenderAuthenticated(authResults: string, domain: string): boolean {
  const ar = authResults.toLowerCase();
  const d = domain.toLowerCase().replace(/\./g, '\\.');
  return (
    new RegExp(`dmarc=pass[^;]*header\\.from=${d}`).test(ar) ||
    new RegExp(`dkim=pass[^;]*header\\.d=${d}`).test(ar) ||
    new RegExp(`spf=pass[^;]*smtp\\.mailfrom=[^;\\s]*@${d}`).test(ar)
  );
}

// ---------------------------------------------------------------------------------------------
// Website contact-form lead parsing and Kevin forward splitting
// ---------------------------------------------------------------------------------------------

export function parseLead(text: string): InboundEmail['parsedLead'] | undefined {
  const nameMatch = text.match(/(?:Full Name|Name):\s*([^\r\n]+?)(?=\s+Email:|\r|\n|$)/i);
  const emailMatch = text.match(/Email:\s*([^\s\r\n<>]+@[^\s\r\n<>]+)/i);
  const phoneMatch = text.match(/(?:Cell Number|Phone|Contact Number):\s*([^\r\n]+)/i);
  const msgMatch = text.match(/Message:\s*([\s\S]+)/i);
  if (!emailMatch && !nameMatch) return undefined;
  return {
    name: nameMatch ? nameMatch[1].trim() : undefined,
    email: emailMatch ? emailMatch[1].trim().replace(/[.,;]+$/, '') : undefined,
    phone: phoneMatch ? phoneMatch[1].trim() : undefined,
    message: msgMatch ? msgMatch[1].trim() : undefined,
  };
}

export function extractForwardedInfo(text: string): { kevinInstructions: string; remainingText: string } {
  const markers = [/-----Original Message-----/i, /-{5,} ?Forwarded message ?-{5,}/i, /From:\s*[^<\r\n]+<[^>\r\n]+>/i];
  let split = -1;
  for (const m of markers) {
    const hit = text.match(m);
    if (hit?.index !== undefined && (split === -1 || hit.index < split)) split = hit.index;
  }
  if (split > 0) return { kevinInstructions: text.slice(0, split).trim(), remainingText: text.slice(split).trim() };
  return { kevinInstructions: '', remainingText: text };
}

// ---------------------------------------------------------------------------------------------
// Content checks applied to everything before it can go to a client
// ---------------------------------------------------------------------------------------------

const PRICE_RE = /\bR\s?\d[\d\s,]*(\.\d{2})?\b|\bZAR\b|\b\d{1,3}(,\d{3})+(\.\d{2})?\b/i;
const LINK_RE = /https?:\/\/|www\.|[^\s@]+@[^\s@]+\.[a-z]{2,}/i;

/**
 * @param html     the final rendered email
 * @param aiTexts  the parts Gemini wrote (greeting/context). These must never carry prices or links:
 *                 prices only come from Firestore, and links in AI text could come from a prompt injection.
 */
export function findContentProblems(html: string, aiTexts: string[]): string[] {
  const problems: string[] = [];
  if (/whatsapp/i.test(html)) problems.push('mentions WhatsApp (the practice has no WhatsApp channel).');
  if (/\{\{[^}]*\}\}/.test(html)) problems.push('contains unfilled {{placeholders}}.');
  if (/\[(client name|entity name|amount|service)\]/i.test(html)) problems.push('contains unfilled [placeholder] text.');
  for (const t of aiTexts) {
    if (!t) continue;
    if (PRICE_RE.test(t)) problems.push('AI-written text contains a price or amount.');
    if (LINK_RE.test(t)) problems.push('AI-written text contains a link or email address.');
    if (/password|otp|one[- ]time pin|efiling (login|credentials)/i.test(t)) problems.push('AI-written text asks for credentials.');
  }
  return [...new Set(problems)];
}

// ---------------------------------------------------------------------------------------------
// Small text utilities
// ---------------------------------------------------------------------------------------------

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function htmlToText(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(style|script|title)[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|tr|h\d|li)>/gi, '\n')
    .replace(/<\/td>/gi, '\t')
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&bull;/g, '•').replace(/&mdash;/g, '—').replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function bareAddress(addr: string): string {
  const m = addr.match(/<([^>]+)>/);
  return (m ? m[1] : addr).trim().toLowerCase();
}
