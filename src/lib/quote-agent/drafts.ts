/**
 * Kevin's decisions on review drafts. Shared by the Telegram [Send]/[Discard] buttons and the
 * /admin/quote-drafts page, so both paths have identical guards and audit records.
 */
import { findContentProblems } from './filters';
import { isValidClientRecipient } from './gate';
import { sendEmail, moveEmailByMessageId } from './mailer';
import * as store from './store';
import { editTelegram, tgEscape } from './telegram';

export interface DraftDecisionResult {
  ok: boolean;
  message: string;
}

/** Sends exactly the stored draft (what Kevin saw). Atomic pending -> sending, so a double tap can't send twice. */
export async function sendApprovedDraft(draftId: string, by: string): Promise<DraftDecisionResult> {
  const draft = await store.lockDraftForSending(draftId, by);
  if (!draft) return { ok: false, message: 'Draft not found or already handled.' };

  const problems = [
    ...(!isValidClientRecipient(draft.to) ? ['no valid client recipient'] : []),
    ...(!draft.html ? ['no email body'] : []),
    // Placeholders/WhatsApp are blocked even for approved drafts; AI-text checks don't apply (Kevin approved the wording).
    ...findContentProblems(draft.html || '', []),
  ];
  if (problems.length) {
    await store.updateDraft(draftId, { status: 'pending', error: `Blocked: ${problems.join('; ')}` });
    return { ok: false, message: `Blocked: ${problems.join('; ')}. Fix it in the portal.` };
  }

  try {
    const sent = await sendEmail({ to: draft.to, subject: draft.subject, html: draft.html, inReplyTo: draft.inReplyTo, references: draft.references });
    if (draft.quoteRef && draft.lines?.length) {
      await store.saveQuote({
        quoteRef: draft.quoteRef, to: draft.to.toLowerCase(), clientName: draft.clientName || '', lines: draft.lines, total: draft.total || 0,
        validUntil: draft.validUntil || '', auto: false, sentAt: new Date().toISOString(), sentMessageId: sent.messageId, sourceMessageKey: draft.sourceMessageKey,
      });
    }
    await store.updateDraft(draftId, { status: 'sent', sentMessageId: sent.messageId, error: undefined });
    await store.audit('draft_sent', { draftId, to: draft.to, by, quoteRef: draft.quoteRef, category: draft.category });
    
    // Automatically archive the source inquiry email from INBOX to INBOX.Archive
    if (draft.sourceMessageKey) {
      await moveEmailByMessageId(draft.sourceMessageKey, 'INBOX.Archive').catch(() => {});
    }

    if (draft.telegramMessageId) {
      await editTelegram(draft.telegramMessageId, `✅ <b>Sent</b> to ${tgEscape(draft.to)} by ${tgEscape(by)}\n${tgEscape(draft.subject)}`);
    }
    return { ok: true, message: `Sent to ${draft.to}.` };
  } catch (err: any) {
    // Back to pending so Kevin can retry; the error is shown in the portal.
    await store.updateDraft(draftId, { status: 'pending', error: err?.message || String(err) });
    await store.audit('draft_send_failed', { draftId, by, error: err?.message });
    return { ok: false, message: `Send failed: ${err?.message || err}` };
  }
}

export async function discardDraft(draftId: string, by: string): Promise<DraftDecisionResult> {
  const draft = await store.getDraft(draftId);
  if (!draft || draft.status !== 'pending') return { ok: false, message: 'Draft not found or already handled.' };
  await store.updateDraft(draftId, { status: 'discarded', decidedBy: by, decidedAt: new Date().toISOString() });
  await store.audit('draft_discarded', { draftId, by, category: draft.category });
  
  // Automatically archive the source inquiry email from INBOX to INBOX.Archive
  if (draft.sourceMessageKey) {
    await moveEmailByMessageId(draft.sourceMessageKey, 'INBOX.Archive').catch(() => {});
  }

  if (draft.telegramMessageId) await editTelegram(draft.telegramMessageId, `🗑 <b>Discarded</b> by ${tgEscape(by)}\n${tgEscape(draft.subject)}`);
  return { ok: true, message: 'Discarded.' };
}

