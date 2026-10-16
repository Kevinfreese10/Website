'use server';

/**
 * Server actions for /admin/quote-drafts: Kevin's review queue for the info@ cloud agent.
 * Same staff check as agent-actions.ts. Sending goes through the shared sendApprovedDraft(), the
 * same path as the Telegram [Send] button.
 */
import { serializeDbData } from '@/lib/firebase-admin';
import { getVerifiedAuthContext } from '@/lib/server-auth';
import { discardDraft, sendApprovedDraft } from '@/lib/quote-agent/drafts';
import { isValidClientRecipient } from '@/lib/quote-agent/gate';
import * as store from '@/lib/quote-agent/store';
import type { AgentMode } from '@/lib/quote-agent/types';

async function requireStaff(idToken: string) {
  const ctx = await getVerifiedAuthContext(idToken);
  if (!ctx) throw new Error('Unauthorized');
  const role = ctx.user.role;
  const ok = ctx.isAdmin || role === 'admin' || role === 'staff';
  if (!ok) throw new Error('Forbidden: admin or staff only');
  return ctx;
}

const who = (ctx: Awaited<ReturnType<typeof requireStaff>>) => `portal:${(ctx.user as any).email || (ctx.user as any).uid || 'staff'}`;

export async function listQuoteDraftsAction(idToken: string, status: store.DraftStatus = 'pending') {
  try {
    await requireStaff(idToken);
    const drafts = await store.listDrafts(status, 100);
    return { success: true, drafts: serializeDbData(drafts) as store.QuoteDraft[] };
  } catch (e: any) {
    return { success: false, error: e.message, drafts: [] as store.QuoteDraft[] };
  }
}

export async function getQuoteAgentStatusAction(idToken: string) {
  try {
    await requireStaff(idToken);
    const cfg = await store.getConfig();
    const { lockOwner, ...safe } = cfg;
    return { success: true, config: serializeDbData(safe) as Omit<store.AgentConfig, 'lockOwner'> };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function setQuoteAgentModeAction(idToken: string, mode: AgentMode) {
  try {
    const ctx = await requireStaff(idToken);
    if (!['live', 'draft-only', 'paused'].includes(mode)) throw new Error('Invalid mode');
    await store.setMode(mode, who(ctx));
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateQuoteDraftAction(idToken: string, draftId: string, patch: { to?: string; subject?: string; html?: string }) {
  try {
    const ctx = await requireStaff(idToken);
    const draft = await store.getDraft(draftId);
    if (!draft || draft.status !== 'pending') throw new Error('Draft not found or already handled.');
    const clean: Partial<store.QuoteDraft> = {};
    if (patch.to !== undefined) {
      const to = patch.to.trim().toLowerCase();
      if (!isValidClientRecipient(to)) throw new Error('Recipient must be a valid external email address (not a practice inbox).');
      clean.to = to;
    }
    if (patch.subject !== undefined) clean.subject = patch.subject.trim().slice(0, 250);
    if (patch.html !== undefined) clean.html = patch.html;
    await store.updateDraft(draftId, { ...clean, error: '' });
    await store.audit('draft_edited', { draftId, by: who(ctx), fields: Object.keys(clean) });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function sendQuoteDraftAction(idToken: string, draftId: string) {
  try {
    const ctx = await requireStaff(idToken);
    const r = await sendApprovedDraft(draftId, who(ctx));
    return { success: r.ok, message: r.message, error: r.ok ? undefined : r.message };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function discardQuoteDraftAction(idToken: string, draftId: string) {
  try {
    const ctx = await requireStaff(idToken);
    const r = await discardDraft(draftId, who(ctx));
    return { success: r.ok, message: r.message, error: r.ok ? undefined : r.message };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
