/**
 * Outlook-safe email rendering for the cloud quote agent.
 * A TypeScript port of .agents/skills/quote-generator/templates/quote_template.html (tables, inline
 * styles, VML button). Every dynamic value is HTML-escaped. Prices come only from ResolvedQuote.
 *
 * Change from the file template: the PROCEED button replies to info@ (not kev@) so the agent can
 * detect acceptances and alert Kevin (decision 9).
 */
import { AGENT_MAILBOX } from './config';
import { escapeHtml as e } from './filters';
import type { ResolvedQuote } from './types';

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/** "1,500.00": the format the practice has always quoted in (Node's en-ZA locale would give "1 500,00"). */
export function formatZar(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Johannesburg' });
}

/** MA-Q-<YYYYMMDD>-<initials>-<3 chars>. The suffix stops two same-day quotes to the same initials colliding. */
export function makeQuoteRef(clientName: string, seed: string, now = new Date()): string {
  const ymd = now.toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' }).replace(/-/g, '');
  const initials = (clientName.match(/\b[A-Za-z]/g) || ['X']).slice(0, 3).join('').toUpperCase();
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `MA-Q-${ymd}-${initials}-${h.toString(36).toUpperCase().slice(-3).padStart(3, '0')}`;
}

/** Statutory notes from SKILL.md §Statutory Invariants, chosen by the services quoted. */
export function statutoryNotes(slugs: string[]): string[] {
  const has = (re: RegExp) => slugs.some(s => re.test(s));
  const notes: string[] = [];
  if (has(/vat-registration/)) {
    notes.push('SARS VAT registration: SARS requires proof of more than R120,000 turnover in the past 12 months, or at least one month\u2019s bank statement showing trading receipts of R10,000 or more. Applications without this proof are rejected.');
  }
  if (has(/vat-registration|ncca|ncr-registration|import-licence|export-licence|cidb/)) {
    notes.push('This registration requires an active business bank account in the company\u2019s registered name, with a bank confirmation letter dated within the last 3 months.');
  }
  if (has(/tax-representative/)) {
    notes.push('The SARS tax representative appointment gives us administrative access to the company\u2019s eFiling profile only. It does not transfer any tax debt liability to the representative.');
  }
  notes.push('Turnaround times are per authority and run independently; they are estimates from the date we receive all documents.');
  return notes;
}

const wrapOpen = (title: string) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${e(title)}</title>
<!--[if mso]><style>table,td,p,a,span{font-family:Arial,Helvetica,sans-serif !important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;"><tr><td align="center" style="padding:24px 12px;">
<!--[if mso]><table role="presentation" width="660" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:660px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:10px;">`;

const wrapClose = `</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`;

function header(meta?: string): string {
  return `<tr><td style="padding:28px 36px 20px 36px;border-bottom:1px solid #e2e8f0;font-family:${FONT};">
<p style="margin:0;font-size:18px;font-weight:700;letter-spacing:1px;color:#0f172a;">MY ACCOUNTANT</p>
<p style="margin:4px 0 0 0;font-size:12px;color:#64748b;">Corporate Formation &bull; Accounting &bull; Regulatory Compliance</p>
${meta ? `<p style="margin:12px 0 0 0;font-size:12px;color:#64748b;">${meta}</p>` : ''}
</td></tr>`;
}

function paragraphs(firstName: string, body: string[]): string {
  return `<tr><td style="padding:28px 36px 0 36px;font-family:${FONT};font-size:15px;line-height:1.6;color:#334155;">
<p style="margin:0 0 12px 0;">Hi ${e(firstName || 'there')},</p>
${body.filter(Boolean).map(p => `<p style="margin:0 0 12px 0;">${e(p)}</p>`).join('\n')}
</td></tr>`;
}

function cta(quoteRef?: string): string {
  const subject = encodeURIComponent(`PROCEED - ${quoteRef || 'My Accountant'}`);
  const href = `mailto:${AGENT_MAILBOX}?subject=${subject}`;
  return `<tr><td style="padding:24px 36px 0 36px;font-family:${FONT};font-size:15px;line-height:1.6;color:#334155;">
<p style="margin:0 0 14px 0;">Simply reply <strong>&ldquo;PROCEED&rdquo;</strong> to this email, or call our office at <strong>010 109 1625</strong>, and we will send through your digital engagement letter and begin immediately.</p>
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:44px;v-text-anchor:middle;width:220px;" arcsize="14%" stroke="f" fillcolor="#1D70E8">
<w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">REPLY TO PROCEED</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!--><a href="${href}" style="display:inline-block;background-color:#1D70E8;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:6px;">REPLY TO PROCEED</a><!--<![endif]-->
</td></tr>`;
}

function signature(automated: boolean): string {
  return `<tr><td style="padding:28px 36px 32px 36px;font-family:${FONT};font-size:13px;line-height:1.6;color:#334155;">
<p style="margin:0;font-weight:700;color:#0f172a;">Kevin Freese</p>
<p style="margin:0;">Director | CBAP (SA) #3561</p>
<p style="margin:0;">My Accountant (Pty) Ltd &bull; Practice No: PR-0098553</p>
<p style="margin:0;">Landline: +27 10 109 1625 | Web: <a href="https://www.myacc.co.za" style="color:#1D70E8;text-decoration:none;">www.myacc.co.za</a></p>
${automated ? `<p style="margin:14px 0 0 0;font-size:11px;color:#94a3b8;">This quotation was prepared automatically from our published fee schedule; reply to speak to a consultant.</p>` : ''}
</td></tr>`;
}

export interface QuoteEmailInput {
  quoteRef: string;
  subject: string;
  clientFirstName: string;
  contextSentence: string;
  quote: ResolvedQuote;
  paymentRef: string;
  automated: boolean;
  now?: Date;
}

export function renderQuoteEmail(i: QuoteEmailInput): string {
  const now = i.now || new Date();
  const q = i.quote;
  const meta = `Quote Ref: <strong style="color:#0f172a;">${e(i.quoteRef)}</strong> &nbsp;|&nbsp; Date: ${e(formatDate(now))} &nbsp;|&nbsp; Valid until: ${e(formatDate(q.validUntil))}`;

  const recs = q.requested
    .map(s => `<p style="margin:0 0 8px 0;">&bull; <strong>${e(s.title)}</strong>${s.shortDescription ? `: ${e(s.shortDescription)}` : ''}</p>`)
    .join('\n');

  const steps = [
    ['Onboarding', 'We send your digital engagement letter and a secure portal link for your documents.'],
    ['Preparation', 'We prepare and check every application and supporting document.'],
    ['Submission & follow-up', 'We lodge with each authority and keep you updated until completion.'],
  ].map(([name, sum], idx) => `<tr>
<td width="36" valign="top" style="width:36px;padding:0 0 10px 0;font-size:14px;font-weight:700;color:#1D70E8;font-family:${FONT};">${String(idx + 1).padStart(2, '0')}</td>
<td valign="top" style="padding:0 0 10px 0;font-size:15px;line-height:1.6;color:#334155;font-family:${FONT};"><strong>${e(name)}</strong> &mdash; ${e(sum)}</td>
</tr>`).join('\n');

  const cell = `padding:10px 12px;font-size:14px;border-bottom:1px solid #e2e8f0;font-family:${FONT};`;
  const feeRows = q.lines.map(l => `<tr>
<td style="${cell}color:#1e293b;"><a href="${e(l.url)}" style="color:#1D70E8;text-decoration:none;">${e(l.title)}</a>${l.requiredBy ? `<br><span style="font-size:12px;color:#64748b;">Required for ${e(l.requiredBy)}</span>` : ''}</td>
<td style="${cell}color:#334155;">${e(l.turnaround)}</td>
<td align="right" style="${cell}color:#1e293b;">R ${formatZar(l.price)}</td>
</tr>`).join('\n');

  const included = [...new Set(q.requested.flatMap(s => s.whatsIncluded).map(x => x.replace(/[.;,\s]+$/, '')))].filter(Boolean).slice(0, 4);
  const feeNotes = included.length ? `Included: ${included.join('; ')}.` : 'Fees as per our published fee schedule at www.myacc.co.za.';
  const reqs = (q.clientRequirements.length ? q.clientRequirements : ['Certified copies of the director(s)\u2019 ID documents', 'Company registration documents (CIPC)'])
    .map(r => `<p style="margin:0 0 6px 0;">&bull; ${e(r)}</p>`).join('\n');
  const notes = statutoryNotes(q.lines.map(l => l.slug)).map(n => `<p style="margin:0 0 6px 0;">${e(n)}</p>`).join('\n');

  return `${wrapOpen(i.subject)}
${header(meta)}
${paragraphs(i.clientFirstName, [i.contextSentence])}
<tr><td style="padding:12px 36px 0 36px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="4" style="width:4px;background-color:#16a34a;font-size:0;line-height:0;">&nbsp;</td>
<td style="background-color:#f0fdf4;padding:16px 20px;font-family:${FONT};font-size:15px;line-height:1.6;color:#1e293b;">
<p style="margin:0 0 8px 0;font-size:16px;font-weight:700;color:#0f172a;">Our Recommendation</p>
${recs}
</td></tr></table>
</td></tr>
<tr><td style="padding:24px 36px 0 36px;font-family:${FONT};font-size:15px;line-height:1.6;color:#334155;">
<p style="margin:0 0 10px 0;font-size:16px;font-weight:700;color:#0f172a;">What We Will Do</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${steps}</table>
</td></tr>
<tr><td style="padding:24px 36px 0 36px;font-family:${FONT};">
<p style="margin:0 0 10px 0;font-size:16px;font-weight:700;color:#0f172a;">Fee Schedule</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-collapse:collapse;">
<tr style="background-color:#f8fafc;">
<td style="padding:10px 12px;font-size:12px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;font-family:${FONT};">SERVICE</td>
<td style="padding:10px 12px;font-size:12px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;font-family:${FONT};">TURNAROUND</td>
<td align="right" style="padding:10px 12px;font-size:12px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;font-family:${FONT};">FEE (ZAR)</td>
</tr>
${feeRows}
<tr style="background-color:#f8fafc;">
<td colspan="2" style="padding:12px;font-size:15px;font-weight:700;color:#0f172a;font-family:${FONT};">Total Once-Off Investment</td>
<td align="right" style="padding:12px;font-size:16px;font-weight:700;color:#0f172a;font-family:${FONT};">R ${formatZar(q.total)}</td>
</tr>
</table>
<p style="margin:8px 0 0 0;font-size:12px;line-height:1.5;color:#64748b;">${e(feeNotes)}</p>
</td></tr>
<tr><td style="padding:24px 36px 0 36px;font-family:${FONT};font-size:15px;line-height:1.6;color:#334155;">
<p style="margin:0 0 8px 0;font-size:16px;font-weight:700;color:#0f172a;">What We Need From You</p>
${reqs}
</td></tr>
${cta(i.quoteRef)}
<tr><td style="padding:28px 36px 0 36px;font-family:${FONT};font-size:12px;line-height:1.5;color:#64748b;">
<p style="margin:0 0 6px 0;font-weight:700;">Important Notes</p>
${notes}
<p style="margin:0 0 6px 0;">Payment: My Accountant (Pty) Ltd &bull; FNB &bull; Acc 63084378223 &bull; Branch 250655 &bull; Ref: ${e(i.paymentRef)}</p>
<p style="margin:0;">My Accountant will never notify you of changes to banking details via standalone email or telephone. Always verify payment instructions against our official domain www.myacc.co.za before transferring funds.</p>
</td></tr>
${signature(i.automated)}
${wrapClose}`;
}

/** Plain letter (declines, acknowledgements, answers, next steps) using the same branding. */
export function renderLetterEmail(i: { subject: string; clientFirstName: string; paragraphs: string[]; withCta?: boolean; quoteRef?: string }): string {
  return `${wrapOpen(i.subject)}
${header()}
${paragraphs(i.clientFirstName, i.paragraphs)}
${i.withCta ? cta(i.quoteRef) : ''}
${signature(false)}
${wrapClose}`;
}
