'use server';

/**
 * Server actions for the AI order agent approval inbox (AI-ORDER-AGENT-PLAN.md §6.7, §8).
 *
 * Every proposal decision is recorded (accepted / edited / rejected) per service per action type
 * so autonomy can be earned. Execution of an approved proposal goes through the same audited
 * server actions a human would use.
 */

import { getAdminDb, cleanFirestoreData, serializeDbData } from '@/lib/firebase-admin';
import { getVerifiedAuthContext } from '@/lib/server-auth';
import { runOrderAgent } from '@/lib/agent/orchestrator';
import { AGENT_ALLOWED_STATUSES, PROMOTION_THRESHOLD, type AgentProposal, type AutonomyPolicy, type ClientMessagePayload, type DocumentDraftPayload, type DocumentReviewPayload, type EmailSubmissionPayload, type HandoffPayload, type OtpPayload, type PortalStagePayload, type PortalSubmitPayload, type StatusChangePayload } from '@/lib/agent/types';
import { postOrderNoteAtomic, reviewOrderDocumentAtomic, transitionOrderStatusAtomic, updateOrderChecklistItemAtomic } from './order-admin-actions';
import { sendDocumentRequestEmailAction } from './order-actions';

async function requireStaff(idToken: string) {
  const ctx = await getVerifiedAuthContext(idToken);
  if (!ctx) throw new Error('Unauthorized');
  const role = ctx.user.role;
  const ok = ctx.isAdmin || role === 'admin' || role === 'staff' || role === 'cap_staff' || role === 'cap_supervisor';
  if (!ok) throw new Error('Forbidden: staff only');
  return ctx;
}

export async function runOrderAgentAction(idToken: string, orderId: string) {
  try {
    await requireStaff(idToken);
    const run = await runOrderAgent(orderId, 'manual', { maxModelCalls: 6 });
    return { success: run.ok, run: serializeDbData(run) };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export type ProposalListFilter = { status?: AgentProposal['status']; orderId?: string; limit?: number };

export async function listAgentProposalsAction(idToken: string, filter: ProposalListFilter = {}) {
  try {
    await requireStaff(idToken);
    const db = getAdminDb();
    let q: FirebaseFirestore.Query = db.collection('agentProposals');
    q = q.where('status', '==', filter.status || 'pending');
    if (filter.orderId) q = q.where('orderId', '==', filter.orderId);
    const snap = await q.limit(filter.limit || 200).get();
    const items = snap.docs.map(d => d.data() as AgentProposal);
    // Rank: priority desc, then oldest first (plan §6.7).
    items.sort((a, b) => (b.priority - a.priority) || a.createdAt.localeCompare(b.createdAt));
    return { success: true, proposals: serializeDbData(items) as AgentProposal[] };
  } catch (e: any) {
    return { success: false, error: e.message, proposals: [] as AgentProposal[] };
  }
}

export async function getAgentQueueSummaryAction(idToken: string) {
  try {
    await requireStaff(idToken);
    const db = getAdminDb();
    const snap = await db.collection('agentProposals').where('status', '==', 'pending').get();
    const byKind: Record<string, number> = {};
    snap.docs.forEach(d => { const k = (d.data() as AgentProposal).kind; byKind[k] = (byKind[k] || 0) + 1; });
    const runs = await db.collection('agentRuns').orderBy('startedAt', 'desc').limit(20).get();
    return { success: true, pending: snap.size, byKind, recentRuns: serializeDbData(runs.docs.map(d => d.data())) };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export type ProposalDecision = 'approve' | 'edit' | 'reject';

export async function decideAgentProposalAction(
  idToken: string,
  proposalId: string,
  decision: ProposalDecision,
  editedPayload?: AgentProposal['payload'],
  note?: string
) {
  try {
    const ctx = await requireStaff(idToken);
    const db = getAdminDb();
    const ref = db.collection('agentProposals').doc(proposalId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error('Proposal not found');
    const proposal = snap.data() as AgentProposal;
    if (proposal.status !== 'pending') throw new Error(`Proposal already ${proposal.status}`);

    const actor = { idToken };
    const actorName = ctx.user.name || ctx.user.email || ctx.userId;
    const nowIso = new Date().toISOString();
    let executionResult: AgentProposal['executionResult'] = { ok: true, message: 'Rejected — nothing executed.' };

    if (decision !== 'reject') {
      const payload = (decision === 'edit' && editedPayload) ? editedPayload : proposal.payload;
      executionResult = await execute(proposal, payload, actor, ctx.userId);
      if (!executionResult.ok) throw new Error(executionResult.message);
    } else if (proposal.kind === 'portal_submit') {
      const { decideStagedJob } = await import('@/lib/agent/portal-channel');
      try { await decideStagedJob((proposal.payload as PortalSubmitPayload).jobId, 'abandon', ctx.userId); executionResult = { ok: true, message: 'Rejected — browser job abandoned.' }; } catch (e: any) { executionResult = { ok: true, message: `Rejected (job: ${e.message})` }; }
    }

    await ref.update(cleanFirestoreData({
      status: decision === 'approve' ? 'approved' : decision === 'edit' ? 'edited' : 'rejected',
      decidedAt: nowIso,
      decidedBy: ctx.userId,
      decidedByName: actorName,
      decisionNote: note || null,
      editedPayload: decision === 'edit' ? editedPayload || null : null,
      executionResult,
    }));

    await recordAutonomyStat(db, proposal, decision, ctx.userId, nowIso);

    return { success: true, executionResult };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

async function execute(proposal: AgentProposal, payload: AgentProposal['payload'], actor: { idToken: string }, ctxUserId?: string): Promise<NonNullable<AgentProposal['executionResult']>> {
  const orderId = proposal.orderId;
  switch (proposal.kind) {
    case 'client_message': {
      const p = payload as ClientMessagePayload;
      if (!p.text?.trim()) return { ok: false, message: 'Empty message' };
      const r = await postOrderNoteAtomic(orderId, { text: p.text, isInternal: false }, actor);
      if (!r.success) return { ok: false, message: r.error || 'Could not post note' };
      const parts = ['Note posted to Communication History'];
      if (p.sendEmail) {
        const e = await sendDocumentRequestEmailAction(orderId, 'info@myacc.co.za', p.setStatus || 'Waiting on Customer');
        parts.push(e.success ? `email sent to ${(e as any).emailTo}` : `email failed: ${(e as any).error}`);
      }
      if (p.setStatus && (AGENT_ALLOWED_STATUSES as readonly string[]).includes(p.setStatus)) {
        const t = await transitionOrderStatusAtomic(orderId, p.setStatus, actor, { details: 'Set by approved agent proposal' });
        parts.push((t as any).success ? `status → ${p.setStatus}` : `status change failed: ${(t as any).error}`);
      }
      if (proposal.stepId && p.purpose !== 'chase') {
        await updateOrderChecklistItemAtomic(orderId, proposal.stepId, { status: 'completed', notes: 'Message approved and posted.' }, actor);
        parts.push('step completed');
      }
      return { ok: true, message: parts.join('; ') };
    }
    case 'document_review': {
      const p = payload as DocumentReviewPayload;
      const r = await reviewOrderDocumentAtomic(orderId, p.uploadId, p.decision, actor, p.reason);
      if (!(r as any).success) return { ok: false, message: (r as any).error || 'Review failed' };
      const parts = [`Document "${p.requirementLabel}" ${p.decision}`];
      if (p.decision === 'rejected' && p.clientMessage?.trim()) {
        const n = await postOrderNoteAtomic(orderId, { text: p.clientMessage, isInternal: false }, actor);
        parts.push(n.success ? 'client told what to fix' : `note failed: ${n.error}`);
      }
      return { ok: true, message: parts.join('; ') };
    }
    case 'handoff': {
      const p = payload as HandoffPayload;
      const r = await updateOrderChecklistItemAtomic(orderId, p.stepId, { status: 'completed', notes: `Done by hand: ${p.stepTitle}` }, actor);
      if (!(r as any).success) return { ok: false, message: (r as any).error || 'Could not complete step' };
      return { ok: true, message: `Step "${p.stepTitle}" marked completed` };
    }
    case 'document_draft': {
      const p = payload as DocumentDraftPayload;
      if (!p.drafts.length) return { ok: false, message: 'No drafts to approve' };
      const { approveDraft } = await import('@/lib/documents/service');
      const attachments: { name: string; url: string }[] = [];
      for (const d of p.drafts) {
        const r = await approveDraft(orderId, d.draftId, ctxUserId || 'staff');
        attachments.push({ name: r.fileName, url: r.signedFileUrl });
      }
      const parts = [`${attachments.length} draft(s) approved${p.drafts.some(d => d.signature === 'kevin') ? ' and signed' : ''}`];
      if (p.postToClient) {
        const text = p.clientMessage?.trim() || `Please find the attached document(s) for your records.`;
        const n = await postOrderNoteAtomic(orderId, { text, isInternal: false, attachments }, actor);
        parts.push(n.success ? 'posted to Communication History' : `note failed: ${n.error}`);
      } else {
        await postOrderNoteAtomic(orderId, { text: `Approved drafts: ${attachments.map(a => a.name).join(', ')}`, isInternal: true, attachments }, actor);
        parts.push('kept internal');
      }
      if (p.failed.length === 0) {
        await updateOrderChecklistItemAtomic(orderId, p.stepId, { status: 'completed', notes: `Drafts approved: ${attachments.map(a => a.name).join(', ')}` }, actor);
        parts.push('step completed');
      } else {
        parts.push(`${p.failed.length} template(s) still outstanding — step left open`);
      }
      return { ok: true, message: parts.join('; ') };
    }
    case 'email_submission': {
      const p = payload as EmailSubmissionPayload;
      const { sendSubmission } = await import('@/lib/agent/email-channel');
      const r = await sendSubmission(orderId, proposal.serviceId, p, ctxUserId || 'staff');
      const parts = [r.message];
      await postOrderNoteAtomic(orderId, { text: `${p.purpose === 'follow_up' ? 'Follow-up' : 'Submission'} emailed to ${p.to}\nSubject: ${p.subject}\n\n${p.body}`, isInternal: true, attachments: p.attachments.map(a => ({ name: a.name, url: a.url })) }, actor);
      if (p.purpose === 'submission') {
        await updateOrderChecklistItemAtomic(orderId, p.stepId, { status: 'completed', notes: `Emailed to ${p.to} (${r.submissionId})` }, actor);
        parts.push('step completed');
      }
      return { ok: true, message: parts.join('; ') };
    }
    case 'portal_stage': {
      const p = payload as PortalStagePayload;
      const { enqueuePortalJob } = await import('@/lib/agent/portal-channel');
      const db = getAdminDb();
      const snap = await db.collection('orders').doc(orderId).get();
      const job = await enqueuePortalJob({ ...(snap.data() as any), id: orderId }, proposal.serviceId, p, ctxUserId || 'staff');
      await postOrderNoteAtomic(orderId, { text: `Browser job ${job.id} queued: ${p.procedure} on ${p.portalId} (${p.submitMode}).`, isInternal: true }, actor);
      return { ok: true, message: `Job ${job.id} queued on ${p.portalId}; the worker will pick it up` };
    }
    case 'portal_submit': {
      const p = payload as PortalSubmitPayload;
      const { decideStagedJob } = await import('@/lib/agent/portal-channel');
      await decideStagedJob(p.jobId, 'submit', ctxUserId || 'staff');
      return { ok: true, message: `Submit signalled for job ${p.jobId}; the step completes when the worker confirms` };
    }
    case 'otp': {
      const p = payload as OtpPayload;
      if (!p.code?.trim()) return { ok: false, message: 'Enter the PIN (use Edit & approve)' };
      const { provideOtp } = await import('@/lib/agent/portal-channel');
      await provideOtp(p.jobId, p.code, ctxUserId || 'staff');
      return { ok: true, message: 'PIN relayed to the worker' };
    }
    case 'status_change': {
      const p = payload as StatusChangePayload;
      if (!(AGENT_ALLOWED_STATUSES as readonly string[]).includes(p.to)) return { ok: false, message: `Agent may not set status ${p.to}` };
      const t = await transitionOrderStatusAtomic(orderId, p.to, actor, { details: p.reason });
      return (t as any).success ? { ok: true, message: `Status → ${p.to}` } : { ok: false, message: (t as any).error };
    }
    default:
      return { ok: false, message: `Unknown proposal kind ${(proposal as any).kind}` };
  }
}

function actionKey(p: AgentProposal): string {
  if (p.kind === 'client_message') return `client_message:${(p.payload as ClientMessagePayload).purpose || 'other'}`;
  if (p.kind === 'email_submission') return `email_submission:${(p.payload as EmailSubmissionPayload).purpose}`;
  if (p.kind === 'portal_submit') return `portal_submit:${(p.payload as PortalSubmitPayload).procedure}`;
  if (p.kind === 'document_review') return `document_review:${(p.payload as DocumentReviewPayload).decision}`;
  return p.kind;
}

async function recordAutonomyStat(db: FirebaseFirestore.Firestore, p: AgentProposal, decision: ProposalDecision, userId: string, nowIso: string) {
  const ref = db.collection('autonomyPolicy').doc(p.serviceId);
  await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const policy: AutonomyPolicy = snap.exists ? (snap.data() as AutonomyPolicy) : { serviceId: p.serviceId, actions: {}, updatedAt: nowIso };
    const key = actionKey(p);
    const a = policy.actions[key] || { level: 'propose', consecutiveAccepts: 0, totalAccepts: 0, totalEdits: 0, totalRejects: 0 };
    if (decision === 'approve') { a.consecutiveAccepts += 1; a.totalAccepts += 1; }
    else if (decision === 'edit') { a.consecutiveAccepts = 0; a.totalEdits += 1; }
    else { a.consecutiveAccepts = 0; a.totalRejects += 1; }
    // Any rejection/edit after promotion demotes straight back (plan §8).
    if (decision !== 'approve' && a.level === 'auto') {
      a.level = 'propose'; a.demotedAt = nowIso; a.demotedReason = `${decision} by ${userId}`;
    }
    policy.actions[key] = a;
    policy.updatedAt = nowIso;
    tx.set(ref, cleanFirestoreData(policy));
  });
}

/** Admin-only manual promotion switch. Only reachable once the threshold is met. */
export async function setAutonomyLevelAction(idToken: string, serviceId: string, actionKeyStr: string, level: 'propose' | 'auto') {
  try {
    const ctx = await requireStaff(idToken);
    if (!(ctx.isAdmin || ctx.user.role === 'admin')) throw new Error('Forbidden: admin only');
    const db = getAdminDb();
    const ref = db.collection('autonomyPolicy').doc(serviceId);
    const snap = await ref.get();
    const policy: AutonomyPolicy = snap.exists ? (snap.data() as AutonomyPolicy) : { serviceId, actions: {}, updatedAt: new Date().toISOString() };
    const a = policy.actions[actionKeyStr];
    if (!a) throw new Error('No history for this action yet');
    if (level === 'auto' && a.consecutiveAccepts < PROMOTION_THRESHOLD) throw new Error(`Needs ${PROMOTION_THRESHOLD} consecutive unedited approvals (currently ${a.consecutiveAccepts})`);
    if (level === 'auto' && (actionKeyStr.startsWith('document_review') || actionKeyStr === 'status_change' || actionKeyStr === 'otp' || actionKeyStr === 'portal_stage')) throw new Error('Document approvals, status changes, OTPs and portal staging are never automated');
    if (level === 'auto' && actionKeyStr.startsWith('portal_submit:')) {
      const { isPromotable } = await import('@/lib/agent/portal-registry');
      if (!isPromotable(actionKeyStr.slice('portal_submit:'.length))) throw new Error('This portal procedure is never auto-submitted (registrations, director changes, deregistrations)');
    }
    a.level = level;
    if (level === 'auto') { a.promotedAt = new Date().toISOString(); a.promotedBy = ctx.userId; }
    policy.actions[actionKeyStr] = a;
    policy.updatedAt = new Date().toISOString();
    await ref.set(cleanFirestoreData(policy));
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function listAutonomyPoliciesAction(idToken: string) {
  try {
    await requireStaff(idToken);
    const db = getAdminDb();
    const snap = await db.collection('autonomyPolicy').get();
    return { success: true, policies: serializeDbData(snap.docs.map(d => d.data())) as AutonomyPolicy[] };
  } catch (e: any) {
    return { success: false, error: e.message, policies: [] as AutonomyPolicy[] };
  }
}

/** Draft (or re-draft with field overrides) documents for an order step. Staff only. */
export async function draftOrderDocumentsAction(idToken: string, orderId: string, templateIds: string[], overrides: Record<string, Record<string, any>> = {}, serviceId?: string) {
  try {
    await requireStaff(idToken);
    const { draftDocumentsForOrder } = await import('@/lib/documents/service');
    const { attempts } = await draftDocumentsForOrder(orderId, templateIds, overrides, serviceId);
    return { success: true, attempts: serializeDbData(attempts) };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function listDocumentTemplatesAction(idToken: string) {
  try {
    await requireStaff(idToken);
    const { listTemplates } = await import('@/lib/documents/registry');
    return { success: true, templates: listTemplates() };
  } catch (e: any) {
    return { success: false, error: e.message, templates: [] };
  }
}

export async function listRegulatorMailAction(idToken: string, opts: { unmatchedOnly?: boolean; limit?: number } = {}) {
  try {
    await requireStaff(idToken);
    const db = getAdminDb();
    let q: FirebaseFirestore.Query = db.collection('regulatorMail').orderBy('receivedAt', 'desc');
    if (opts.unmatchedOnly) q = q.where('orderId', '==', null);
    const snap = await q.limit(opts.limit || 100).get();
    return { success: true, mail: serializeDbData(snap.docs.map(d => d.data())) };
  } catch (e: any) {
    return { success: false, error: e.message, mail: [] };
  }
}

/** Link an unmatched regulator email to an order by hand. */
export async function linkRegulatorMailAction(idToken: string, mailId: string, orderId: string) {
  try {
    const ctx = await requireStaff(idToken);
    const db = getAdminDb();
    const mailRef = db.collection('regulatorMail').doc(mailId);
    const mailSnap = await mailRef.get();
    if (!mailSnap.exists) throw new Error('Mail not found');
    const mail = mailSnap.data() as any;
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) throw new Error('Order not found');
    const order = orderSnap.data() as any;
    const subs = (order.regulatorSubmissions || []) as any[];
    const latest = subs[subs.length - 1];
    const updatedSubs = latest ? subs.map(s => s.id === latest.id ? { ...s, status: s.status === 'sent' ? 'acknowledged' : s.status, replies: [...(s.replies || []), { mailId, from: mail.from, subject: mail.subject, receivedAt: mail.receivedAt, snippet: String(mail.text || '').slice(0, 300) }] } : s) : subs;
    await postOrderNoteAtomic(orderId, { text: `Regulator email linked by ${ctx.user.name || ctx.userId}: "${mail.subject}" from ${mail.from}\n\n${String(mail.text || '').slice(0, 1500)}`, isInternal: true, attachments: mail.attachments || null }, { idToken });
    await orderRef.update(cleanFirestoreData({ regulatorSubmissions: updatedSubs, updatedAt: new Date().toISOString() }));
    await mailRef.update({ orderId, orderNumber: String(order.originalOrderId || orderId), submissionId: latest?.id || null, matchedBy: 'reference' });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function pollSubmissionsInboxAction(idToken: string) {
  try {
    await requireStaff(idToken);
    const { pollSubmissionsInbox } = await import('@/lib/agent/email-channel');
    return { success: true, summary: await pollSubmissionsInbox() };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function listPortalJobsAction(idToken: string, opts: { orderId?: string; limit?: number } = {}) {
  try {
    await requireStaff(idToken);
    const db = getAdminDb();
    let q: FirebaseFirestore.Query = db.collection('portalJobs');
    if (opts.orderId) q = q.where('orderId', '==', opts.orderId);
    const snap = await q.orderBy('createdAt', 'desc').limit(opts.limit || 50).get();
    const health = await db.collection('portalHealth').get();
    return { success: true, jobs: serializeDbData(snap.docs.map(d => { const j = d.data(); delete (j as any).credentials; return j; })), health: serializeDbData(health.docs.map(d => d.data())) };
  } catch (e: any) {
    return { success: false, error: e.message, jobs: [], health: [] };
  }
}

export async function requeuePortalJobAction(idToken: string, jobId: string) {
  try {
    const ctx = await requireStaff(idToken);
    const { requeueJob } = await import('@/lib/agent/portal-channel');
    await requeueJob(jobId, ctx.userId);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
