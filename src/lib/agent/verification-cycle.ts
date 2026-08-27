/**
 * The document collection & verification cycle.
 *
 *   client presses "Notify Consultant" (or uploads a file, or the hourly tick runs)
 *     → every item in Documents & Data Required is checked
 *     → clear pass = approved, clear fail = rejected with a reason, unsure = left for Kevin
 *     → ONE client update is DRAFTED on the order (verification.draftClientNote); a staff member
 *       reviews it on the admin order page and posts it (that also emails the client and sets the
 *       status: Waiting on Customer while anything is outstanding, Under Review when complete)
 *     → when everything is approved: email to Kevin with the summary
 *     → if items are stuck "unsure": email to Kevin listing them (once per state)
 *   A staff-triggered run ('manual') also re-checks items the system rejected earlier.
 *
 * Runs on every order for every service — no playbook or approval needed. Rules come from the
 * requirement rows on the product (documentKind / inNameOf / maxAgeDays / mustBeCertified / aiHint).
 *
 * Hard limits: never approves on model confidence (only the rules engine), never touches money
 * or completion, never deletes, and every decision is audit-logged on the order.
 */

import { getAdminDb, cleanFirestoreData } from '@/lib/firebase-admin';
import { INTERNAL_SYSTEM_ACTOR } from '@/lib/internal-actor';
import type { DocumentUpload, Order, OrderServiceSnapshot, ServiceRequirement } from '@/lib/types';
import { resolveOrderEntityContext, isLikelyPersonName } from '@/lib/service-utils';
import { postOrderNoteAtomic, reviewOrderDocumentAtomic, transitionOrderStatusAtomic } from '@/app/actions/order-admin-actions';
import { checkTextValue } from '@/lib/verification/mechanical';
import { evaluateDocument, type EntityContext, type RuleOutcome } from '@/lib/verification/rules';
import type { ExtractedDocumentFacts } from '@/lib/verification/facts';
import { sendCompleteEmail, sendUndecidedEmail } from './verification-emails';

export type CycleTrigger = 'notify' | 'upload' | 'cron' | 'manual';

export type ItemVerdict = {
  requirementId?: string;
  label: string;
  serviceTitle: string;
  uploadId?: string;
  outcome: 'approved' | 'rejected' | 'pending' | 'missing' | 'not_applicable';
  /** Why (internal wording). */
  reason?: string;
  /** What the client must do (client wording), for rejected/missing. */
  clientFix?: string;
  /** Facts read from the document, for Kevin's summary. */
  facts?: { kind?: string; names?: string[]; identifiers?: string[]; dates?: string[]; certified?: boolean };
  changedThisRun: boolean;
};

export type CycleResult = {
  orderId: string;
  trigger: CycleTrigger;
  state: 'awaiting_client' | 'awaiting_consultant' | 'complete' | 'skipped';
  items: ItemVerdict[];
  /** True when a client update was drafted (or refreshed) for staff to review. */
  notePosted: boolean;
  draftClientNote?: string;
  emailedKevin: 'complete' | 'undecided' | null;
  statusSet?: string;
  modelCalls: number;
  notes: string[];
};

const ACTIVE = new Set(['Processing', 'Waiting on Customer', 'Waiting for Information', 'Under Review']);
const MAX_EXTRACTIONS_PER_RUN = 8;
const MAX_BYTES = 15 * 1024 * 1024;

export async function runVerificationCycle(orderId: string, trigger: CycleTrigger): Promise<CycleResult> {
  const db = getAdminDb();
  const ref = db.collection('orders').doc(orderId);
  const result: CycleResult = { orderId, trigger, state: 'skipped', items: [], notePosted: false, emailedKevin: null, modelCalls: 0, notes: [] };

  const snap = await ref.get();
  if (!snap.exists) { result.notes.push('order not found'); return result; }
  let order = { ...(snap.data() as Order), id: orderId };
  if (!ACTIVE.has(order.status)) { result.notes.push(`status ${order.status} not active`); return result; }

  const entity = buildEntity(order);
  const today = new Date();
  let uploads: DocumentUpload[] = order.documentUploads || [];
  let extractions = 0;
  const uploadsToWrite: DocumentUpload[] = [];

  // ---- 1. Decide every requirement -----------------------------------------------------------
  for (const svc of order.serviceSnapshots || []) {
    for (const req of svc.requirements || []) {
      const up = findUpload(uploads, svc, req);
      const item: ItemVerdict = { requirementId: req.id, label: req.label, serviceTitle: svc.title, uploadId: up?.id, outcome: 'missing', changedThisRun: false };

      // Conditional answered "No" → not applicable.
      if (req.isConditional && up?.textValue === 'N/A (No)') { item.outcome = 'not_applicable'; result.items.push(item); continue; }
      // Optional and nothing supplied → not applicable (does not block completion).
      if (!up && req.isRequired === false) { item.outcome = 'not_applicable'; result.items.push(item); continue; }
      if (!up) { item.outcome = 'missing'; item.clientFix = `Please upload "${req.label}"${req.helpText ? ` — ${req.helpText}` : ''}.`; result.items.push(item); continue; }

      // Already decided (by Kevin or a previous run) → carry forward.
      if (up.status === 'approved') { item.outcome = 'approved'; item.facts = factsSummary((up.aiVerification?.extractedData as any)?.facts); result.items.push(item); continue; }
      // System-rejected = flagged by us (marker), or the rejection reason is verbatim one of our own mechanical messages.
      const systemRejected = up.status === 'rejected' && ((up as any).aiVerification?.decidedBy === 'system' || (up.mechanicalCheck?.issues || []).some(i => i.message === up.rejectionReason));
      if (up.status === 'rejected' && !(trigger === 'manual' && systemRejected)) { item.outcome = 'rejected'; item.reason = up.rejectionReason; item.clientFix = up.rejectionReason || `Please re-upload "${req.label}".`; result.items.push(item); continue; }

      // "I can't provide this" → consultant decides.
      if (up.notAvailableReason && !up.fileUrl && !up.files?.length && !up.textValue) {
        item.outcome = 'pending'; item.reason = `Client says they cannot provide it: "${up.notAvailableReason}"`; result.items.push(item); continue;
      }

      // Conditional answered "Yes" but no file yet.
      if (req.isConditional && up.textValue === 'Applicable (Yes)' && !up.fileUrl && !up.files?.length) {
        item.outcome = 'missing'; item.clientFix = `Please upload "${req.label}".`; result.items.push(item); continue;
      }

      // Text answer → format check only.
      if (up.type === 'text' || (!up.fileUrl && !up.files?.length && up.textValue)) {
        const mech = up.mechanicalCheck || summarizeText(req, up);
        if (mech.status === 'fail') {
          const msg = mech.issues.filter(i => i.severity === 'fail').map(i => i.message).join(' ');
          await decide(orderId, up, 'rejected', msg, result); item.outcome = 'rejected'; item.reason = msg; item.clientFix = msg; item.changedThisRun = true;
        } else {
          await decide(orderId, up, 'approved', 'Format check passed.', result); item.outcome = 'approved'; item.changedThisRun = true;
        }
        result.items.push(item); continue;
      }

      // File → hard mechanical failures short-circuit. (PASSWORD_PROTECTED is never hard: bank
      // letters are permissions-restricted but readable; extraction decides — see below.)
      const hardFails = (up.mechanicalCheck?.issues || []).filter(i => i.severity === 'fail' && i.code !== 'PASSWORD_PROTECTED');
      if (hardFails.length) {
        const msg = hardFails.map(i => i.message).join(' ');
        await decide(orderId, up, 'rejected', msg, result); item.outcome = 'rejected'; item.reason = msg; item.clientFix = msg; item.changedThisRun = true;
        result.items.push(item); continue;
      }

      // File → extraction (bounded) → rules.
      let facts: ExtractedDocumentFacts | undefined = (up.aiVerification?.extractedData as any)?.facts;
      if (!facts) {
        if (extractions >= MAX_EXTRACTIONS_PER_RUN) { item.outcome = 'pending'; item.reason = 'Queued for reading (limit reached this run).'; result.items.push(item); continue; }
        try { facts = await extract(up, req, today); extractions++; result.modelCalls++; }
        catch (e: any) {
          result.notes.push(`extraction failed for "${req.label}": ${e.message}`);
          if (up.mechanicalCheck?.facts?.pdfEncrypted && /encrypt|password|decrypt|could not (load|parse)/i.test(String(e.message))) {
            const msg = `${up.fileName || 'The file'} for "${req.label}" is password-protected and cannot be opened. Please remove the password (or print it to a new PDF) and upload again.`;
            await decide(orderId, up, 'rejected', msg, result); item.outcome = 'rejected'; item.reason = msg; item.clientFix = msg; item.changedThisRun = true;
          } else { item.outcome = 'pending'; item.reason = `Could not read the file automatically (${e.message}).`; }
          result.items.push(item); continue;
        }
      }
      const outcome = evaluateDocument({ requirement: req, facts, entity, today });
      const verified: DocumentUpload = { ...up, aiVerification: {
        status: outcome.verdict === 'pass' ? 'verified' : outcome.verdict === 'fail' ? 'flagged' : 'inconclusive',
        confidence: facts.kindConfidence, detectedType: facts.documentKind, extractedData: { facts, entity }, issues: outcome.reasons,
        summary: outcome.reasons[0], reviewedAt: new Date().toISOString(),
        recommendation: outcome.verdict === 'pass' ? 'approve' : outcome.verdict === 'fail' ? 'reject' : 'manual_review', reason: outcome.reasons.join(' '), modelName: (facts as any).modelName,
        decidedBy: outcome.verdict === 'needs_human' ? undefined : 'system',
      } as any };
      uploadsToWrite.push(verified);
      item.facts = factsSummary(facts);
      if (outcome.verdict === 'pass') {
        await decide(orderId, up, 'approved', outcome.reasons[0], result); item.outcome = 'approved'; item.changedThisRun = true;
      } else if (outcome.verdict === 'fail') {
        const msg = outcome.clientMessage || outcome.reasons.join(' ');
        await decide(orderId, up, 'rejected', msg, result); item.outcome = 'rejected'; item.reason = outcome.reasons.join(' '); item.clientFix = msg; item.changedThisRun = true;
      } else {
        item.outcome = 'pending'; item.reason = outcome.reasons.join(' '); item.changedThisRun = true;
      }
      result.items.push(item);
    }
  }

  // Persist aiVerification facts (approvals/rejections were written by reviewOrderDocumentAtomic).
  if (uploadsToWrite.length) {
    const fresh = (await ref.get()).data() as Order;
    const merged = (fresh.documentUploads || []).map(u => { const v = uploadsToWrite.find(w => w.id === u.id); return v ? { ...u, aiVerification: v.aiVerification } : u; });
    await ref.update(cleanFirestoreData({ documentUploads: merged }));
  }

  // ---- 2. Overall state ----------------------------------------------------------------------
  const blocking = result.items.filter(i => i.outcome === 'rejected' || i.outcome === 'missing');
  const undecided = result.items.filter(i => i.outcome === 'pending');
  result.state = blocking.length ? 'awaiting_client' : undecided.length ? 'awaiting_consultant' : 'complete';

  // ---- 3. Draft the client update (never posted automatically — staff confirm on the order page)
  const stateKey = keyOf(result.items);
  const prev = (order as any).verification || {};
  const alreadyTold = prev.lastClientNoteKey === stateKey;
  if (!alreadyTold && result.items.length) {
    const text = composeClientNote(order, result.items, result.state);
    result.draftClientNote = text;
    result.notePosted = true; // a draft was (re)generated
  }

  // ---- 4. Emails to Kevin (Consolidated & Atomic Deduplication) --------------------
  // Use a Firestore transaction to claim the email dispatch atomically so concurrent
  // background runs or sequential upload events cannot send duplicate emails.
  if (result.state === 'complete' || result.state === 'awaiting_consultant') {
    let shouldSendComplete = false;
    let shouldSendUndecided = false;

    try {
      await db.runTransaction(async (t) => {
        const freshSnap = await t.get(ref);
        if (!freshSnap.exists) return;
        const freshOrder = freshSnap.data() as Order;
        const currentV = (freshOrder as any).verification || {};

        if (result.state === 'complete') {
          if (!currentV.completeEmailSent && currentV.completeEmailKey !== stateKey) {
            shouldSendComplete = true;
            t.update(ref, {
              'verification.completeEmailKey': stateKey,
              'verification.completeEmailSent': true,
              'verification.completeEmailSentAt': new Date().toISOString(),
            });
          }
        } else if (result.state === 'awaiting_consultant') {
          const undecidedKey = keyOf(undecided);
          if (!currentV.undecidedEmailSent && currentV.undecidedEmailKey !== undecidedKey) {
            shouldSendUndecided = true;
            t.update(ref, {
              'verification.undecidedEmailKey': undecidedKey,
              'verification.undecidedEmailSent': true,
              'verification.undecidedEmailSentAt': new Date().toISOString(),
            });
          }
        }
      });
    } catch (txErr) {
      console.error('[runVerificationCycle] Email dispatch transaction error:', txErr);
    }

    if (shouldSendComplete) {
      try {
        await sendCompleteEmail(order, result.items);
        result.emailedKevin = 'complete';
      } catch (err) {
        console.error('[runVerificationCycle] Failed to send complete email:', err);
      }
    } else if (shouldSendUndecided) {
      try {
        await sendUndecidedEmail(order, result.items);
        result.emailedKevin = 'undecided';
      } catch (err) {
        console.error('[runVerificationCycle] Failed to send undecided email:', err);
      }
    }
  }

  await ref.update(cleanFirestoreData({
    verification: {
      lastRunAt: new Date().toISOString(),
      lastTrigger: trigger,
      state: result.state,
      lastClientNoteKey: prev.lastClientNoteKey || null,
      lastClientNoteAt: prev.lastClientNoteAt || null,
      draftClientNote: result.draftClientNote
        ? { text: result.draftClientNote, key: stateKey, state: result.state, createdAt: new Date().toISOString(), trigger }
        : (alreadyTold ? null : prev.draftClientNote || null),
      completeEmailKey: result.state === 'complete' ? stateKey : null,
      completeEmailSent: result.state === 'complete' ? (prev.completeEmailSent || result.emailedKevin === 'complete') : false,
      completeEmailSentAt: result.emailedKevin === 'complete' ? new Date().toISOString() : prev.completeEmailSentAt || null,
      undecidedEmailKey: result.state === 'awaiting_consultant' ? keyOf(undecided) : null,
      undecidedEmailSent: result.state === 'awaiting_consultant' ? (prev.undecidedEmailSent || result.emailedKevin === 'undecided') : false,
      undecidedEmailSentAt: result.emailedKevin === 'undecided' ? new Date().toISOString() : prev.undecidedEmailSentAt || null,
      counts: { approved: result.items.filter(i => i.outcome === 'approved').length, rejected: result.items.filter(i => i.outcome === 'rejected').length, missing: result.items.filter(i => i.outcome === 'missing').length, pending: undecided.length },
    },
    lastAgentRunAt: new Date().toISOString(),
  }));
  return result;
}

// ---------------------------------------------------------------------------------------------

function findUpload(uploads: DocumentUpload[], svc: OrderServiceSnapshot, req: ServiceRequirement & { id?: string }): DocumentUpload | undefined {
  const label = (req.label || '').trim().toLowerCase();
  return uploads.find(u => u.serviceId === svc.serviceId && req.id && u.requirementId === req.id)
    || uploads.find(u => u.serviceId === svc.serviceId && (u.requirementLabel || '').trim().toLowerCase() === label)
    || uploads.find(u => (u.requirementLabel || '').trim().toLowerCase() === label);
}

async function decide(orderId: string, up: DocumentUpload, status: 'approved' | 'rejected', reason: string, result: CycleResult) {
  const r = await reviewOrderDocumentAtomic(orderId, up.id || up.requirementId || up.requirementLabel, status, INTERNAL_SYSTEM_ACTOR, reason, { suppressClientEmail: true, decidedBy: 'system' });
  if (!(r as any).success) result.notes.push(`could not mark "${up.requirementLabel}" ${status}: ${(r as any).error}`);
}

function summarizeText(req: ServiceRequirement, up: DocumentUpload) {
  const r = checkTextValue({ label: req.label, documentKind: req.documentKind, isSecret: req.isSecret }, up.isEncrypted ? 'x' : (up.textValue || ''));
  return { status: r.issues.some(i => i.severity === 'fail') ? 'fail' as const : 'pass' as const, issues: r.issues };
}

async function extract(up: DocumentUpload, req: ServiceRequirement, today: Date): Promise<ExtractedDocumentFacts> {
  const url = up.fileUrl || up.files?.[0]?.fileUrl;
  if (!url) throw new Error('no file');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  if (Number(res.headers.get('content-length') || 0) > MAX_BYTES) throw new Error('file too large');
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get('content-type') || (up.mechanicalCheck?.facts?.detectedType === 'pdf' ? 'application/pdf' : 'image/jpeg');
  const { extractOrderDocument } = await import('@/ai/flows/extract-order-document');
  return extractOrderDocument({ fileDataUri: `data:${ct};base64,${buf.toString('base64')}`, requirementLabel: req.label, aiHint: req.aiHint, expectedKind: req.documentKind, today: today.toISOString().slice(0, 10) });
}

function buildEntity(order: Order): EntityContext {
  const ctx = resolveOrderEntityContext(order);
  const persons = new Set<string>();
  if (ctx.directorName && isLikelyPersonName(ctx.directorName)) persons.add(ctx.directorName);
  
  for (const u of order.documentUploads || []) {
    const l = (u.requirementLabel || '').toLowerCase();
    const isExcluded = /phone|cell|tel|number|email|address|province|premises|language|share|percent|fee|amount|date|reason/.test(l);
    if (u.type === 'text' && u.textValue && !u.isEncrypted && !isExcluded && /director|applicant|member|individual|name of/.test(l) && !/company|entity|business/.test(l)) {
      if (isLikelyPersonName(u.textValue)) persons.add(u.textValue.trim());
    }

    // Collect director / individual names from AI extracted facts of any upload
    const facts = ((u as any).aiVerification?.extractedData?.facts || (u as any).aiVerification?.extractedData) as ExtractedDocumentFacts | undefined;
    if (facts && Array.isArray(facts.names)) {
      for (const n of facts.names) {
        if (n.role === 'director' || n.role === 'individual' || n.role === 'shareholder') {
          if (isLikelyPersonName(n.name)) persons.add(n.name.trim());
        }
      }
    }
  }

  if (ctx.orderingContactName && isLikelyPersonName(ctx.orderingContactName)) {
    persons.add(ctx.orderingContactName);
  }

  return {
    entityName: ctx.entityName,
    registrationNumber: ctx.registrationNumber,
    personNames: [...persons],
    idNumbers: ctx.idNumber ? [ctx.idNumber] : [],
    orderingContactName: ctx.orderingContactName,
  };
}

function factsSummary(f?: ExtractedDocumentFacts): ItemVerdict['facts'] | undefined {
  if (!f) return undefined;
  return { kind: f.documentKind, names: f.names.map(n => n.name), identifiers: f.identifiers.map(i => `${i.type}: ${i.value}`), dates: f.dates.map(d => `${d.purpose}: ${d.date}`), certified: f.hasCertificationStamp };
}

function keyOf(items: ItemVerdict[]): string {
  return items.map(i => `${i.requirementId || i.label}=${i.outcome}:${(i.reason || '').slice(0, 40)}`).sort().join('|');
}

function firstName(order: Order) { return ((order.endCustomerName || order.customerName || '').trim().split(/\s+/)[0]) || 'there'; }

export function composeClientNote(order: Order, items: ItemVerdict[], state: CycleResult['state']): string {
  const approved = items.filter(i => i.outcome === 'approved');
  const rejected = items.filter(i => i.outcome === 'rejected');
  const missing = items.filter(i => i.outcome === 'missing');
  const pending = items.filter(i => i.outcome === 'pending');
  const lines: string[] = [`Hi ${firstName(order)},`, ''];
  if (state === 'complete') {
    lines.push('Thank you — everything we asked for has been received and checked. Your consultant now has the full set and will take it from here.', '');
    lines.push(...approved.map(i => `✓ ${i.label}`));
  } else {
    lines.push("Thanks for your submissions. We've checked them and here's where things stand:", '');
    if (rejected.length) { lines.push('Needs attention:'); for (const i of rejected) lines.push(`✗ ${i.label} — ${i.clientFix || i.reason}`); lines.push(''); }
    if (missing.length) { lines.push('Still outstanding:'); for (const i of missing) lines.push(`• ${i.label}${i.clientFix && !i.clientFix.startsWith('Please upload "' + i.label + '".') ? ` — ${i.clientFix.replace(/^Please upload "[^"]+" — /, '')}` : ''}`); lines.push(''); }
    if (pending.length) { lines.push('With your consultant:'); for (const i of pending) lines.push(`… ${i.label} — being reviewed`); lines.push(''); }
    if (approved.length) { lines.push('Received and approved:'); for (const i of approved) lines.push(`✓ ${i.label}`); lines.push(''); }
    if (rejected.length || missing.length) lines.push('You can upload the outstanding items on your order page, then press "Notify Consultant of All Submissions" and we will check again.');
    else if (pending.length) lines.push('Nothing further is needed from you right now.');
  }
  lines.push('', 'Kind regards', 'My Accountant');
  return lines.join('\n');
}

async function emailClientAboutNote(order: Order & { id: string }, text: string) {
  const email = order.documentContact === 'partner' ? order.customerEmail : (order.endCustomerEmail || order.customerEmail);
  if (!email) return;
  const { notifyOfNewNote } = await import('@/app/actions/notifications');
  await notifyOfNewNote({
    recipientEmail: email,
    recipientName: order.endCustomerName || order.customerName || 'Client',
    senderName: 'My Accountant',
    orderId: String(order.originalOrderId || order.id),
    notePreview: text.length > 600 ? text.slice(0, 600) + '…' : text,
    actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.myacc.co.za'}/dashboard/orders/${order.id}`,
    isToClient: true,
    resellerId: order.resellerId,
  });
}

/**
 * Staff confirmed the drafted client update: post it to Communication History, email the client,
 * set the order status for the state, and clear the draft.
 */
export async function postVerificationDraft(orderId: string, text: string, performer: any): Promise<{ success: boolean; error?: string; statusSet?: string }> {
  const db = getAdminDb();
  const ref = db.collection('orders').doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) return { success: false, error: 'Order not found' };
  const order = { ...(snap.data() as Order), id: orderId };
  const v = (order as any).verification || {};
  const draft = v.draftClientNote;
  const posted = await postOrderNoteAtomic(orderId, { text, isInternal: false }, performer);
  if (!posted.success) return { success: false, error: posted.error };
  try { await emailClientAboutNote(order, text); } catch (e) { console.error('[postVerificationDraft] client email failed', e); }
  let statusSet: string | undefined;
  const state = draft?.state || v.state;
  if (state === 'awaiting_client' && order.status !== 'Waiting on Customer') {
    const t = await transitionOrderStatusAtomic(orderId, 'Waiting on Customer', performer, { details: 'Verification: documents outstanding', fulfillmentStatus: 'Awaiting Documents' });
    if ((t as any).success) statusSet = 'Waiting on Customer';
  } else if (state === 'complete' && order.status !== 'Under Review') {
    const t = await transitionOrderStatusAtomic(orderId, 'Under Review', performer, { details: 'Verification: all documents approved', fulfillmentStatus: 'Under Review' });
    if ((t as any).success) statusSet = 'Under Review';
  }
  await ref.update(cleanFirestoreData({ verification: { ...v, draftClientNote: null, lastClientNoteKey: draft?.key || v.lastClientNoteKey || null, lastClientNoteAt: new Date().toISOString() } }));
  return { success: true, statusSet };
}

export async function discardVerificationDraft(orderId: string) {
  const db = getAdminDb();
  const ref = db.collection('orders').doc(orderId);
  const snap = await ref.get();
  const v = ((snap.data() as any)?.verification) || {};
  await ref.update(cleanFirestoreData({ verification: { ...v, draftClientNote: null } }));
}
