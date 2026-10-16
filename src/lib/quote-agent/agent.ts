/**
 * The quote agent's brain loop: one call to runTick() handles new info@ emails end to end.
 *
 *   fetch (peek) -> loop/bounce/spam filters -> Gemini classify -> catalog resolve -> render
 *   -> code gate -> auto-send | draft + Telegram buttons | alert only | ignore -> audit
 *
 * processEmail() takes its side effects as `deps`, so the dry-run script and tests can run the real
 * decision path without touching the mailbox or writing to Firestore.
 */
import { randomUUID } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { classifyEmail } from '@/ai/flows/quote-agent-classify';
import { Catalog } from './catalog';
import { KEVIN_ADDRESS, PORTAL_URL, QUOTE_POLICY } from './config';
import { detectAutomation, findContentProblems, isObviousSpam } from './filters';
import { decideAction, isValidClientRecipient } from './gate';
import { fetchNewEmails, moveEmails, sendEmail, type OutboundEmail } from './mailer';
import * as store from './store';
import { draftButtons, sendTelegram, tgEscape } from './telegram';
import { formatZar, makeQuoteRef, renderLetterEmail, renderQuoteEmail } from './template';
import type { AgentConfig, MessageOutcome, QuoteDraft, QuoteRecord } from './store';
import type { Classification, EmailCategory, GateDecision, InboundEmail, ResolvedQuote } from './types';

const ALERT_CATEGORIES: EmailCategory[] = ['regulator', 'order_update'];

export interface ProcessDeps {
  catalog: Catalog;
  config: Pick<AgentConfig, 'mode' | 'startedAt'>;
  classify: (email: InboundEmail, catalogList: string, threadContext?: string) => Promise<Classification>;
  findQuoteForThread: (ids: string[]) => Promise<QuoteRecord | null>;
  countRecentAutoQuotes: (address: string) => Promise<number>;
  send: (msg: OutboundEmail) => Promise<{ messageId: string }>;
  saveQuote: (q: QuoteRecord) => Promise<void>;
  createDraft: (d: Omit<QuoteDraft, 'id' | 'status' | 'createdAt'>) => Promise<QuoteDraft>;
  updateDraft: (id: string, patch: Partial<QuoteDraft>) => Promise<void>;
  telegram: (html: string, buttons?: Parameters<typeof sendTelegram>[1], silent?: boolean) => Promise<number | null>;
  audit: (type: string, data: Record<string, unknown>) => Promise<void>;
}

export interface ProcessResult extends MessageOutcome {
  /** Rendered email (for dry runs and the audit trail). */
  preview?: { to: string | null; subject: string; html: string };
}

function pickRecipient(email: InboundEmail): string | null {
  if (email.originType === 'FORWARD_FROM_KEVIN') return email.parsedLead?.email?.toLowerCase() || null;
  // The website form sets Reply-To to the client, so it's the fallback when the body can't be parsed.
  if (email.originType === 'WEBSITE_CONTACT_FORM') return (email.parsedLead?.email || email.replyTo || '').toLowerCase() || null;
  return (email.replyTo || email.fromAddress || '').toLowerCase() || null;
}

function splitParagraphs(text?: string): string[] {
  return (text || '').split(/\n\s*\n/).map(p => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
}

/** Kevin-approved standard terms (SKILL.md routing row 4). Inserted by code, never written by the AI. */
const TAX_DEBT_TERMS = 'Our standard terms for a SARS debt compromise are a R20,000 upfront retainer plus a 5% success fee on the amount compromised. We lodge within 5 working days of appointment, and SARS typically takes 30 to 90 business days to review.';

export async function processEmail(email: InboundEmail, deps: ProcessDeps): Promise<ProcessResult> {
  // 1. Loop guard, bounces, baseline, cheap spam filter: no AI spend.
  const automation = detectAutomation(email);
  if (automation.kind === 'own') return { status: 'ignored', reasons: ['Sent by our own mailbox.'] };
  if (automation.kind === 'bounce') return { status: 'done', category: 'system_notice', action: 'notify_only', summary: `Bounce: ${email.subject}`.slice(0, 140), reasons: ['Delivery failure notice.'] };
  if (email.date < deps.config.startedAt) return { status: 'baseline', reasons: ['Received before the agent went live.'] };
  if (isObviousSpam(email.fromAddress, email.subject, email.text)) return { status: 'done', category: 'spam', action: 'ignore', summary: `Spam from ${email.fromAddress}`, reasons: ['Matched spam pattern.'] };

  // 2. Thread linking: is this a reply to a quote we sent?
  const threadIds = [email.inReplyTo || '', ...email.references];
  const isThreadReply = threadIds.some(Boolean);
  const linkedQuote = isThreadReply ? await deps.findQuoteForThread(threadIds) : null;
  const threadContext = linkedQuote
    ? `Reply to our quote ${linkedQuote.quoteRef} (${linkedQuote.lines.map(l => l.title).join(', ')}).`
    : isThreadReply ? 'Reply in an existing email thread.' : undefined;

  // 3. Gemini classification, then hard overrides the AI cannot argue with.
  const c = await deps.classify(email, deps.catalog.promptList(), threadContext);
  let category: EmailCategory = c.category;
  if (email.originType === 'FORWARD_FROM_KEVIN' || email.fromAddress === KEVIN_ADDRESS) category = 'kevin_forward';
  if (automation.kind === 'automated' && !['regulator', 'order_update', 'spam'].includes(category)) category = 'system_notice';
  if (linkedQuote && !['quote_acceptance', 'quote_question', 'spam', 'system_notice'].includes(category)) category = 'quote_question';
  if (isThreadReply && category === 'catalog_quote') category = 'quote_question';

  const recipient = pickRecipient(email);
  const clientName = c.clientFullName || email.parsedLead?.name || email.fromName || c.clientFirstName;

  // 4. Build the reply (if any).
  let resolved: ResolvedQuote | null = null;
  let subject = /^re:/i.test(email.subject) ? email.subject : `Re: ${email.subject}`;
  let html = '';
  let quoteRef: string | undefined;
  const aiTexts = [c.contextSentence];

  if ((category === 'catalog_quote' || category === 'custom_scope') && c.services.length) {
    resolved = deps.catalog.resolve(c.services.map(s => s.slug));
    if (resolved.lines.length) {
      quoteRef = makeQuoteRef(clientName, email.messageId);
      const primary = resolved.requested[0]?.title || 'Services';
      if (email.originType === 'WEBSITE_CONTACT_FORM' || email.originType === 'FORWARD_FROM_KEVIN') {
        subject = `Quotation ${quoteRef} – ${primary} for ${c.companyName || clientName}`;
      }
      html = renderQuoteEmail({
        quoteRef, subject, clientFirstName: c.clientFirstName, contextSentence: c.contextSentence,
        quote: resolved, paymentRef: `${c.companyName || clientName} / ${quoteRef}`, automated: category === 'catalog_quote',
      });
    }
  }
  if (!html && !ALERT_CATEGORIES.includes(category) && !['spam', 'system_notice'].includes(category)) {
    const paras = splitParagraphs(c.draftReplyText);
    aiTexts.push(c.draftReplyText || '');
    if (category === 'tax_debt') paras.push(TAX_DEBT_TERMS);
    if (paras.length) {
      html = renderLetterEmail({ subject, clientFirstName: c.clientFirstName, paragraphs: [c.contextSentence, ...paras], withCta: false, quoteRef: linkedQuote?.quoteRef });
    }
  }

  // 5. The gate decides.
  const contentProblems = html ? findContentProblems(html, aiTexts) : [];
  const recent = recipient && isValidClientRecipient(recipient) ? await deps.countRecentAutoQuotes(recipient) : 0;
  const decision: GateDecision = decideAction({
    mode: deps.config.mode, category, confidence: c.confidence, originType: email.originType, isThreadReply,
    recipient, requestedServiceCount: resolved?.requested.length ?? c.services.length, unmatchedRequests: c.unmatchedRequests.length,
    unknownSlugs: resolved?.unknownSlugs.length ?? 0, warnings: resolved?.warnings.length ?? 0, total: resolved?.total ?? 0,
    recentAutoQuotesToRecipient: recent, contentProblems,
  });
  if (category === 'catalog_quote' && !html) decision.reasons.push('Could not build a fee schedule from the catalog.');
  if (decision.action === 'auto_send' && !html) decision.action = 'draft_for_review';

  const base: ProcessResult = {
    status: 'done', category, action: decision.action, summary: c.summary, reasons: decision.reasons, quoteRef,
    urgent: c.urgent || decision.action === 'draft_for_review' || ALERT_CATEGORIES.includes(category),
    preview: html ? { to: recipient, subject, html } : undefined,
  };
  const inReplyTo = email.originType === 'DIRECT_INQUIRY' ? email.messageId : undefined;
  const references = inReplyTo ? [...email.references, email.messageId].filter(Boolean) : undefined;

  // 6. Act.
  if (decision.action === 'auto_send' && recipient && resolved && quoteRef) {
    const sent = await deps.send({ to: recipient, subject, html, inReplyTo, references });
    await deps.saveQuote({
      quoteRef, to: recipient, clientName, lines: resolved.lines, total: resolved.total, validUntil: resolved.validUntil,
      auto: true, sentAt: new Date().toISOString(), sentMessageId: sent.messageId, sourceMessageKey: email.messageId,
    });
    await deps.audit('auto_quote_sent', { quoteRef, to: recipient, total: resolved.total, lines: resolved.lines.map(l => l.slug), source: email.messageId });
    await deps.telegram(
      `📤 <b>Auto-quote sent</b> ${tgEscape(quoteRef)}\n${tgEscape(clientName)} &lt;${tgEscape(recipient)}&gt;\n${resolved.lines.map(l => `• ${tgEscape(l.title)}: R ${formatZar(l.price)}`).join('\n')}\n<b>Total R ${formatZar(resolved.total)}</b>`,
      undefined, true,
    );
    return { ...base, urgent: false };
  }

  if (decision.action === 'draft_for_review') {
    const to = recipient && isValidClientRecipient(recipient) ? recipient : '';
    const draft = await deps.createDraft({
      category, kind: resolved?.lines.length ? 'quote' : 'letter', to, subject, html, inReplyTo, references,
      sourceMessageKey: email.messageId, sourceFrom: `${email.fromName} <${email.fromAddress}>`, sourceSubject: email.subject,
      sourceExcerpt: (email.parsedLead?.message || email.text).slice(0, 1500), summary: c.summary, reasons: decision.reasons,
      quoteRef, lines: resolved?.lines, total: resolved?.total, validUntil: resolved?.validUntil, clientName,
    });
    const canSend = Boolean(to && html);
    const msgId = await deps.telegram(
      `📝 <b>Review needed</b> · ${tgEscape(category)}\n<b>From:</b> ${tgEscape(email.fromName)} &lt;${tgEscape(email.fromAddress)}&gt;\n<b>Subject:</b> ${tgEscape(email.subject)}\n<b>Summary:</b> ${tgEscape(c.summary)}` +
      (resolved?.lines.length ? `\n<b>Quote:</b> ${resolved.lines.map(l => `${tgEscape(l.title)} R ${formatZar(l.price)}`).join('; ')} = <b>R ${formatZar(resolved.total)}</b>` : '') +
      `\n<b>Why not automatic:</b>\n${decision.reasons.slice(0, 6).map(r => `• ${tgEscape(r)}`).join('\n')}` +
      (canSend ? '' : `\n⚠️ No sendable draft (missing ${to ? 'reply text' : 'client address'}). Edit it in the portal.`),
      canSend ? draftButtons(draft.id) : [[{ text: '✏️ Open in portal', url: `${PORTAL_URL}/admin/quote-drafts?id=${draft.id}` }]],
    );
    if (msgId) await deps.updateDraft(draft.id, { telegramMessageId: msgId });
    return { ...base, draftId: draft.id };
  }

  if (decision.action === 'notify_only' && base.urgent) {
    if (category === 'order_update' || category === 'regulator') {
      const orderMatch = `${email.subject}\n${email.text}`.match(/(?:order\s*#?|#|id:\s*)([0-9]{4,6})/i);
      let matchedOrder: { id: string; orderNumber: any } | null = null;
      if (orderMatch) {
        try {
          const db = getAdminDb();
          const orderNum = Number(orderMatch[1]);
          const snap = await db.collection('orders').where('orderNumber', '==', orderNum).limit(1).get();
          if (!snap.empty) {
            matchedOrder = { id: snap.docs[0].id, orderNumber: snap.docs[0].data()?.orderNumber || orderNum };
          } else {
            const snap2 = await db.collection('orders').doc(String(orderNum)).get();
            if (snap2.exists) matchedOrder = { id: snap2.id, orderNumber: snap2.data()?.orderNumber || orderNum };
          }
        } catch (e: any) {
          console.warn('[quote-agent] Order lookup failed:', e.message);
        }
      }

      if (matchedOrder) {
        try {
          const db = getAdminDb();
          const note = {
            id: randomUUID(),
            content: `Inbound ${(category as string) === 'regulator' ? 'Regulator Notice' : 'Email'} from ${email.fromName} (${email.fromAddress}):\n\nSubject: ${email.subject}\n\n${email.text.slice(0, 1500)}`,
            author: 'quote-agent',
            authorName: 'Cloud Email Agent',
            createdAt: new Date().toISOString(),
            type: 'internal'
          };
          await db.collection('orders').doc(matchedOrder.id).update({
            notes: FieldValue.arrayUnion(note),
            updatedAt: new Date().toISOString()
          });
        } catch (e: any) {
          console.warn('[quote-agent] Note append failed:', e.message);
        }

        await deps.telegram(
          `📦 <b>Order #${matchedOrder.orderNumber} Updated</b>\n` +
          `<b>From:</b> ${tgEscape(email.fromName)} &lt;${tgEscape(email.fromAddress)}&gt;\n` +
          `<b>Subject:</b> ${tgEscape(email.subject)}\n` +
          `<i>${tgEscape(c.summary)}</i>\n\n` +
          `Auto-attached to order in admin portal.`,
          [[{ text: `Open Order #${matchedOrder.orderNumber}`, url: `${PORTAL_URL}/admin/orders/${matchedOrder.id}` }]]
        );
        return base;
      }

      if ((category as string) === 'regulator') {
        await deps.telegram(
          `🏛️ <b>Regulator notice</b>\n` +
          `<b>From:</b> ${tgEscape(email.fromName)} &lt;${tgEscape(email.fromAddress)}&gt;\n` +
          `<b>Subject:</b> ${tgEscape(email.subject)}\n` +
          `<i>${tgEscape(c.summary)}</i>`,
          [[{ text: '📊 View Active Orders', url: `${PORTAL_URL}/admin/orders` }]]
        );
        return base;
      }
    }

    await deps.telegram(
      `${(category as string) === 'regulator' ? '🏛️' : '📦'} <b>${tgEscape((category as string) === 'regulator' ? 'Regulator notice' : 'Order update')}</b>\n<b>From:</b> ${tgEscape(email.fromName)} &lt;${tgEscape(email.fromAddress)}&gt;\n<b>Subject:</b> ${tgEscape(email.subject)}\n${tgEscape(c.summary)}`,
    );
  }
  return base;
}

export interface TickResult {
  skipped?: string;
  processed: number;
  outcomes: Array<{ from: string; subject: string; category?: string; action?: string; status: string; error?: string }>;
  durationMs: number;
}

/** One scheduled run. Safe to call concurrently (lease lock) and repeatedly (atomic per-email claim). */
export async function runTick(): Promise<TickResult> {
  const started = Date.now();
  const config = await store.getConfig();
  if (config.mode === 'paused') return { skipped: `paused: ${config.pausedReason || ''}`.trim(), processed: 0, outcomes: [], durationMs: 0 };

  const owner = randomUUID();
  if (!(await store.acquireLock(owner))) return { skipped: 'another run holds the lock', processed: 0, outcomes: [], durationMs: 0 };

  const outcomes: TickResult['outcomes'] = [];
  let failures = 0;
  let lastError = '';
  try {
    const catalog = await Catalog.load();
    const emails = await fetchNewEmails({ sinceDays: 3, isKnown: store.isKnownMessage, limit: QUOTE_POLICY.maxEmailsPerTick });
    const deps: ProcessDeps = {
      catalog, config, classify: classifyEmail,
      findQuoteForThread: store.findQuoteForThread, countRecentAutoQuotes: store.countRecentAutoQuotes,
      send: sendEmail, saveQuote: store.saveQuote, createDraft: store.createDraft, updateDraft: store.updateDraft,
      telegram: (h, b, silent) => sendTelegram(h, b, silent), audit: store.audit,
    };

    const toArchiveUids: number[] = [];
    const toSpamUids: number[] = [];

    for (const email of emails.sort((a, b) => a.date.localeCompare(b.date))) {
      if (Date.now() - started > 240_000) break;
      const key = email.messageId;
      if (!(await store.claimMessage(key, { uid: email.uid, from: email.fromAddress, subject: email.subject, date: email.date }))) continue;
      try {
        const { preview, ...outcome } = await processEmail(email, deps);
        await store.finishMessage(key, outcome);
        outcomes.push({ from: email.fromAddress, subject: email.subject, category: outcome.category, action: outcome.action, status: outcome.status });

        if (outcome.status === 'baseline' || outcome.status === 'ignored') {
          toArchiveUids.push(email.uid);
        } else if (outcome.category === 'spam') {
          toSpamUids.push(email.uid);
        } else if (outcome.category === 'system_notice') {
          toArchiveUids.push(email.uid);
        } else if (outcome.action === 'auto_send') {
          toArchiveUids.push(email.uid);
        } else if (outcome.category === 'order_update' || outcome.category === 'regulator') {
          toArchiveUids.push(email.uid);
        }
      } catch (err: any) {
        failures++;
        lastError = err?.message || String(err);
        console.error(`[quote-agent] Failed on "${email.subject}" from ${email.fromAddress}:`, lastError);
        await store.releaseForRetry(key, lastError);
        outcomes.push({ from: email.fromAddress, subject: email.subject, status: 'error', error: lastError });
      }
    }

    // Physically move emails in IMAP for true Inbox Zero
    if (toSpamUids.length) {
      await moveEmails(toSpamUids, 'INBOX.spam').catch(e => console.warn('[quote-agent] Move to spam failed:', e.message));
    }
    if (toArchiveUids.length) {
      await moveEmails(toArchiveUids, 'INBOX.Archive').catch(e => console.warn('[quote-agent] Move to archive failed:', e.message));
    }

    if (failures) {
      const tripped = await store.recordFailure(`${failures} email(s) failed. Last: ${lastError}`);
      if (tripped) await sendTelegram(`🛑 <b>Quote agent paused</b> (circuit breaker)\n${tgEscape(lastError)}\nSend /resume once fixed.`);
    } else {
      await store.recordSuccess();
    }
  } catch (err: any) {
    lastError = err?.message || String(err);
    console.error('[quote-agent] Tick failed:', lastError);
    const tripped = await store.recordFailure(`Tick failed: ${lastError}`);
    if (tripped) await sendTelegram(`🛑 <b>Quote agent paused</b> (circuit breaker)\n${tgEscape(lastError)}\nSend /resume once fixed.`);
    throw err;
  } finally {
    await store.releaseLock(owner, lastError ? { lastError: lastError.slice(0, 500) } : {});
  }
  return { processed: outcomes.length, outcomes, durationMs: Date.now() - started };
}
