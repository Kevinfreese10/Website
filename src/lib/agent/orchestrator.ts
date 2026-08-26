/**
 * The AI order agent orchestrator (AI-ORDER-AGENT-PLAN.md §6.1).
 *
 * Deliberately boring: it walks the order's approved playbook, runs the automatic layers,
 * and writes PROPOSALS for anything a human must approve. Gemini is called only inside steps
 * (document extraction, message drafting) — never to choose the next step.
 *
 * Hard boundaries enforced here and in the actions that execute proposals:
 * - Never acts on a service whose playbook snapshot is not approved.
 * - Never changes status to Completed / Cancelled / Pending Payment.
 * - Never touches money. Never deletes. Never approves a document on its own.
 * - Every write goes through the audited server actions or is an internal-only field.
 */

import { getAdminDb, cleanFirestoreData } from '@/lib/firebase-admin';
import { INTERNAL_SYSTEM_ACTOR } from '@/lib/internal-actor';
import type { Order, OrderChecklistItem, OrderServiceSnapshot, DocumentUpload, ServiceRequirement } from '@/lib/types';
import { resolveOrderEntityContext, isLikelyPersonName } from '@/lib/service-utils';
import { updateOrderChecklistItemAtomic } from '@/app/actions/order-admin-actions';
import { checkCompleteness } from '@/lib/verification/mechanical';
import { evaluateDocument, type EntityContext } from '@/lib/verification/rules';
import type { ExtractedDocumentFacts } from '@/lib/verification/facts';
import { findRequirement } from '@/lib/verification/run-upload-checks';
import { isPlaybookApproved, getServiceChecklist, normalizeRequirementsWithIds } from '@/lib/services';
import type { AgentProposal, AgentRun, AgentTrigger, ClientMessagePayload, DocumentDraftPayload, DocumentReviewPayload, HandoffPayload, ProposalKind, RegulatorSubmission } from './types';
import { buildSubmissionPayload, buildFollowUpPayload } from './email-channel';
import { buildPortalInput, stagePayload, getActiveJobForStep, buildHandoffSheetFromJob } from './portal-channel';
import { findProcedure } from './portal-registry';
import type { OtpPayload, PortalSubmitPayload } from './types';
import { draftChaseMessage } from './drafting';

const ACTIVE_STATUSES = new Set(['Processing', 'Waiting on Customer', 'Waiting for Information', 'Waiting on External', 'Under Review']);
const MAX_UPLOAD_BYTES_FOR_EXTRACTION = 15 * 1024 * 1024;

export type RunOptions = {
  /** Cap on Gemini calls in this run (extraction + drafting). Default 4. */
  maxModelCalls?: number;
  /** Skip AI extraction entirely (rules run only on already-extracted facts). */
  skipExtraction?: boolean;
};

export async function runOrderAgent(orderId: string, trigger: AgentTrigger, opts: RunOptions = {}): Promise<AgentRun> {
  const db = getAdminDb();
  const runId = `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const run: AgentRun = { id: runId, orderId, trigger, startedAt: new Date().toISOString(), ok: false, reads: [], writes: [], proposalsCreated: [], modelCalls: 0, notes: [] };
  const budget = { remaining: opts.maxModelCalls ?? 4 };

  try {
    const orderRef = db.collection('orders').doc(orderId);
    const snap = await orderRef.get();
    run.reads.push(`orders/${orderId}`);
    if (!snap.exists) throw new Error(`Order ${orderId} not found`);
    const order = { ...(snap.data() as Order), id: orderId };

    if (!ACTIVE_STATUSES.has(order.status)) {
      run.notes.push(`Order status "${order.status}" is not active; nothing to do.`);
      return finish(db, run, true);
    }

    const pendingSnap = await db.collection('agentProposals').where('orderId', '==', orderId).where('status', '==', 'pending').get();
    run.reads.push(`agentProposals(orderId=${orderId}, pending) -> ${pendingSnap.size}`);
    const pendingKeys = new Set(pendingSnap.docs.map(d => (d.data() as AgentProposal).dedupeKey));

    const entity = buildEntityContext(order);
    const today = new Date();
    const proposals: AgentProposal[] = [];
    const orderNumber = String(order.originalOrderId || orderId);

    const propose = (p: Omit<AgentProposal, 'id' | 'orderId' | 'orderNumber' | 'status' | 'createdAt' | 'runId'>) => {
      if (pendingKeys.has(p.dedupeKey)) { run.notes.push(`Skipped duplicate proposal ${p.dedupeKey}`); return; }
      pendingKeys.add(p.dedupeKey);
      proposals.push({ ...p, id: `prop_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`, orderId, orderNumber, status: 'pending', createdAt: new Date().toISOString(), runId });
    };

    let uploads: DocumentUpload[] = order.documentUploads || [];
    let checklist: OrderChecklistItem[] = order.checklist || [];

    // Resolve / sync service snapshots if missing or if playbook was approved in catalog
    let snapshots: OrderServiceSnapshot[] = [...(order.serviceSnapshots || [])];
    let updatedSnapshots = false;

    if (snapshots.length === 0 && order.items && order.items.length > 0) {
      for (const item of order.items) {
        if (!item.id && !item.title && !(item as any).name) continue;
        let sDoc = item.id ? await db.collection('services').doc(item.id).get() : null;
        if (!sDoc || !sDoc.exists) {
          const match = await db.collection('services').where('title', '==', item.title || (item as any).name).limit(1).get();
          if (!match.empty) sDoc = match.docs[0];
        }
        if (sDoc && sDoc.exists) {
          const sData = sDoc.data() as any;
          const playbookApproved = isPlaybookApproved(sData);
          snapshots.push({
            serviceId: sDoc.id,
            title: sData.title || item.title || (item as any).name,
            department: sData.department || 'Administration',
            requirements: normalizeRequirementsWithIds(sData.informationToProvide || []),
            checklist: getServiceChecklist(sData),
            playbookApproved,
            ...(sData.playbookVersion ? { playbookVersion: sData.playbookVersion } : {}),
            ...(sData.playbookEntity ? { playbookEntity: sData.playbookEntity } : {}),
          });
          updatedSnapshots = true;
        }
      }
    }

    for (let i = 0; i < snapshots.length; i++) {
      const snapSvc = snapshots[i];
      if (!snapSvc.playbookApproved) {
        let sDoc = await db.collection('services').doc(snapSvc.serviceId).get();
        if (!sDoc.exists) {
          const match = await db.collection('services').where('title', '==', snapSvc.title).limit(1).get();
          if (!match.empty) sDoc = match.docs[0];
        }
        if (sDoc.exists) {
          const sData = sDoc.data() as any;
          if (isPlaybookApproved(sData)) {
            snapshots[i] = {
              ...snapSvc,
              requirements: normalizeRequirementsWithIds(sData.informationToProvide || snapSvc.requirements || []),
              checklist: getServiceChecklist(sData),
              playbookApproved: true,
              playbookVersion: sData.playbookVersion || sData.playbookApproval?.version,
              playbookEntity: sData.playbookEntity || snapSvc.playbookEntity,
            };
            updatedSnapshots = true;
          }
        }
      }
    }

    if (updatedSnapshots) {
      await db.collection('orders').doc(orderId).update({
        serviceSnapshots: snapshots,
      });
      run.writes.push(`orders/${orderId}.serviceSnapshots (synced approved playbook from catalog)`);
    }

    for (const svc of snapshots) {
      if (!svc.playbookApproved) {
        run.notes.push(`Service "${svc.title}": playbook not approved — left manual.`);
        continue;
      }
      const reqs = svc.requirements || [];
      const svcUploads = uploads.filter(u => u.serviceId === svc.serviceId);

      // ---- Layer 2 + 3 on every pending upload that hasn't been examined ------------------
      for (const up of svcUploads) {
        if (up.status !== 'pending' || up.type !== 'file') continue;
        const req = findRequirement({ serviceSnapshots: snapshots }, svc.serviceId, up.requirementId, up.requirementLabel);
        if (!req) { run.notes.push(`Upload "${up.requirementLabel}" has no matching requirement; skipped.`); continue; }

        // Mechanical failure → propose a rejection straight away, no AI needed.
        if (up.mechanicalCheck?.status === 'fail') {
          const msg = up.mechanicalCheck.issues.filter(i => i.severity === 'fail').map(i => i.message).join(' ');
          propose(reviewProposal(svc, up, 'rejected', `Mechanical check failed: ${msg}`, msg, { mechanical: up.mechanicalCheck }, 70));
          continue;
        }

        let facts: ExtractedDocumentFacts | undefined = (up.aiVerification?.extractedData as any)?.facts;
        if (!facts && !opts.skipExtraction && budget.remaining > 0) {
          try {
            facts = await extractUpload(up, req, today);
            budget.remaining--; run.modelCalls++;
          } catch (e: any) {
            run.notes.push(`Extraction failed for "${up.requirementLabel}": ${e.message}`);
          }
        }
        if (!facts) continue; // will be picked up on a later tick

        const outcome = evaluateDocument({ requirement: req, facts, entity, today });
        const aiVerification = {
          status: outcome.verdict === 'pass' ? 'verified' : outcome.verdict === 'fail' ? 'flagged' : 'inconclusive',
          confidence: facts.kindConfidence,
          detectedType: facts.documentKind,
          extractedData: { facts, entity },
          issues: outcome.reasons,
          summary: outcome.reasons[0],
          reviewedAt: new Date().toISOString(),
          recommendation: outcome.verdict === 'pass' ? 'approve' : outcome.verdict === 'fail' ? 'reject' : 'manual_review',
          reason: outcome.reasons.join(' '),
          modelName: (facts as any).modelName,
        } as DocumentUpload['aiVerification'];
        uploads = uploads.map(u => (u.id === up.id ? { ...u, aiVerification } : u));
        run.writes.push(`orders/${orderId}.documentUploads[${up.id}].aiVerification`);

        if (outcome.verdict === 'pass') {
          propose(reviewProposal(svc, up, 'approved', outcome.reasons[0], undefined, { ruleOutcome: outcome, facts, entity }, 40));
        } else if (outcome.verdict === 'fail') {
          propose(reviewProposal(svc, up, 'rejected', outcome.reasons.join(' '), outcome.clientMessage || undefined, { ruleOutcome: outcome, facts, entity }, 65));
        } else {
          propose({ ...reviewProposal(svc, up, 'approved', outcome.reasons.join(' '), undefined, { ruleOutcome: outcome, facts, entity }, 55), title: `Decide: ${up.requirementLabel}`, summary: `Needs a human: ${outcome.reasons.join(' ')}` });
        }
      }

      // ---- Walk the playbook ---------------------------------------------------------------
      const steps = checklist.filter(c => c.serviceId === svc.serviceId);
      const current = steps.find(s => s.status !== 'completed' && s.status !== 'skipped');
      if (!current) { run.notes.push(`Service "${svc.title}": all steps complete.`); continue; }

      const completeness = checkCompleteness(reqs, svcUploads);

      switch (current.type) {
        case 'collect': {
          if (completeness.complete) {
            await completeStep(orderId, current, 'All required items supplied.', run);
          } else {
            const missing = [...completeness.missingRequired.map(m => m.label), ...completeness.rejected.map(m => `${m.label} (re-upload needed)`)];
            const lastChase = lastClientNoteDaysAgo(order, 'chase');
            if (lastChase !== null && lastChase < 3) { run.notes.push(`Chased ${lastChase} day(s) ago; not chasing again yet.`); break; }
            let text: string;
            if (budget.remaining > 0) {
              try { text = await draftChaseMessage({ order, service: svc, missing, instructions: current.aiInstructions }); budget.remaining--; run.modelCalls++; }
              catch { text = fallbackChase(order, missing); }
            } else text = fallbackChase(order, missing);
            const payload: ClientMessagePayload = { text, sendEmail: true, setStatus: 'Waiting on Customer', purpose: 'chase' };
            propose({ serviceId: svc.serviceId, serviceTitle: svc.title, stepId: current.id, kind: 'client_message', title: `Chase ${missing.length} missing item${missing.length > 1 ? 's' : ''} — ${svc.title}`, summary: `Missing: ${missing.join('; ')}.`, payload, evidence: { missing, entity }, priority: 50 + Math.min(missing.length * 3, 15), dedupeKey: `chase:${orderId}:${svc.serviceId}:${missing.slice().sort().join('|')}` });
          }
          break;
        }
        case 'verify':
        case 'doc_verification': {
          const relevant = svcUploads.filter(u => !current.stepConfig?.requirementIds?.length || current.stepConfig.requirementIds.includes(u.requirementId || ''));
          const allApproved = relevant.length > 0 && relevant.every(u => u.status === 'approved') && completeness.complete;
          if (allApproved) await completeStep(orderId, current, 'All documents approved.', run);
          else run.notes.push(`Service "${svc.title}": verify step waiting on ${relevant.filter(u => u.status !== 'approved').length} upload(s).`);
          break;
        }
        case 'draft_client_message': {
          const payload: ClientMessagePayload = { text: fallbackGeneric(order, current), sendEmail: false, purpose: 'other' };
          propose({ serviceId: svc.serviceId, serviceTitle: svc.title, stepId: current.id, kind: 'client_message', title: `${current.title} — ${svc.title}`, summary: current.description || 'Client message per playbook.', payload, evidence: { entity, notes: current.aiInstructions ? [current.aiInstructions] : [] }, priority: 45, dedupeKey: `msg:${orderId}:${current.id}` });
          break;
        }
        case 'draft_document':
        case 'document_drafting': {
          const templateIds = (current.templateIds || []).filter(Boolean);
          if (!templateIds.length) {
            run.notes.push(`Step "${current.title}" has no templateIds; handing off.`);
            propose(handoffProposal(order, svc, entity, svcUploads, current, 'No templates configured on this step — do by hand or add templateIds to the playbook.'));
            break;
          }
          if (pendingKeys.has(`drafts:${orderId}:${current.id}`)) { run.notes.push(`Drafts for "${current.title}" already awaiting approval.`); break; }
          const existing = ((order.generatedDrafts as any[]) || []) as { templateId: string; status: string }[];
          const approvedAll = templateIds.every(t => existing.some(d => d.templateId === t && d.status === 'approved'));
          if (approvedAll) { await completeStep(orderId, current, 'All drafts approved.', run); break; }
          const toDraft = templateIds.filter(t => !existing.some(d => d.templateId === t && d.status === 'approved'));
          try {
            const { draftDocumentsForOrder } = await import('@/lib/documents/service');
            const { getTemplate } = await import('@/lib/documents/registry');
            const { attempts } = await draftDocumentsForOrder(orderId, toDraft, {}, svc.serviceId);
            run.writes.push(`orders/${orderId}.generatedDrafts (+${attempts.filter(a => a.ok).length})`);
            const drafts = attempts.filter((a): a is Extract<typeof a, { ok: true }> => a.ok).map(a => ({ draftId: a.draft.id, templateId: a.draft.templateId, title: a.draft.title, fileName: a.draft.fileName, fileUrl: a.draft.fileUrl, warnings: a.draft.warnings, signature: getTemplate(a.draft.templateId)?.signature || 'none' }));
            const failed = attempts.filter((a): a is Extract<typeof a, { ok: false }> => !a.ok).map(a => ({ templateId: a.templateId, missing: a.labels.length ? a.labels : a.missing, error: a.error }));
            const clientSigned = drafts.some(d => d.signature === 'client' || d.signature === 'client_commissioner');
            const payload: DocumentDraftPayload = { stepId: current.id, stepTitle: current.title, drafts, failed, postToClient: drafts.length > 0, clientMessage: clientSigned ? `Hi ${firstName(order)},\n\nPlease find the attached document(s) for signature. Sign where indicated${drafts.some(d => d.signature === 'client_commissioner') ? ', have the affidavit commissioned by a Commissioner of Oaths,' : ''} and upload the signed copies on your order page.\n\nKind regards\nMy Accountant` : undefined };
            const title = drafts.length ? `Review ${drafts.length} draft${drafts.length > 1 ? 's' : ''} — ${svc.title}` : `Cannot draft ${failed.length} document${failed.length > 1 ? 's' : ''} — ${svc.title}`;
            const summary = [drafts.length ? `Drafted: ${drafts.map(d => d.title).join(', ')}.` : '', failed.length ? `Could not draft: ${failed.map(f => `${f.templateId} (${f.error || 'missing ' + f.missing.join(', ')})`).join('; ')}.` : ''].filter(Boolean).join(' ');
            propose({ serviceId: svc.serviceId, serviceTitle: svc.title, stepId: current.id, kind: 'document_draft', title, summary, payload, evidence: { entity, notes: current.aiInstructions ? [current.aiInstructions] : [] }, priority: drafts.length ? 52 : 48, dedupeKey: `drafts:${orderId}:${current.id}` });
          } catch (e: any) {
            run.notes.push(`Drafting failed for "${current.title}": ${e.message}`);
            propose(handoffProposal(order, svc, entity, svcUploads, current, `Automatic drafting failed: ${e.message}`));
          }
          break;
        }
        case 'email_submission': {
          const subs: RegulatorSubmission[] = order.regulatorSubmissions || [];
          if (subs.some(sub => sub.stepId === current.id)) { await completeStep(orderId, current, 'Submission sent.', run); break; }
          // Drafts named on the step must be approved before the pack goes out (plan §6.5 / skill rule 1).
          const wanted = (current.templateIds || []).filter(Boolean);
          const drafts = ((order.generatedDrafts as any[]) || []) as { templateId: string; status: string }[];
          const unapproved = wanted.filter(t => !drafts.some(d => d.templateId === t && d.status === 'approved'));
          if (unapproved.length) { run.notes.push(`Service "${svc.title}": submission waits for approved drafts: ${unapproved.join(', ')}.`); break; }
          if (!completeness.complete) { run.notes.push(`Service "${svc.title}": submission waits for required uploads.`); break; }
          const payload = buildSubmissionPayload({ order: order as any, service: svc, step: current, entity, uploads: svcUploads });
          propose({ serviceId: svc.serviceId, serviceTitle: svc.title, stepId: current.id, kind: 'email_submission', title: `Send to ${payload.to || 'regulator (address missing)'} — ${svc.title}`, summary: `${payload.attachments.length} attachment(s). ${payload.addressUnverified ? '⚠ Regulator address is unverified in the playbook — check before sending.' : ''}`, payload, evidence: { entity, notes: current.aiInstructions ? [current.aiInstructions] : [] }, priority: 58, dedupeKey: `email:${orderId}:${current.id}` });
          break;
        }
        case 'wait_external': {
          const subs: RegulatorSubmission[] = order.regulatorSubmissions || [];
          const sub = subs.filter(x => x.serviceId === svc.serviceId).sort((a, b) => b.sentAt.localeCompare(a.sentAt))[0];
          if (!sub) { run.notes.push(`Service "${svc.title}": waiting step has no submission to track; handing off.`); propose(handoffProposal(order, svc, entity, svcUploads, current, 'No emailed submission recorded for this service — if it was filed on a portal, note the reference and approve when the regulator responds.')); break; }
          if (sub.replies.length && sub.status !== 'closed') {
            propose(handoffProposal(order, svc, entity, svcUploads, current, `The regulator replied (${sub.replies.length} message(s); latest from ${sub.replies[sub.replies.length - 1].from}: "${sub.replies[sub.replies.length - 1].subject}"). Review the reply on the order's Communication History. Approve this to mark the wait complete, or reject to keep waiting.`));
            break;
          }
          const daysSince = Math.floor((Date.now() - new Date(sub.sentAt).getTime()) / 86_400_000);
          const cadence = (current.stepConfig?.followUpAfterDays || []).slice().sort((a, b) => a - b);
          const due = cadence.filter(d => daysSince >= d);
          if (due.length > (sub.followUpsSent || []).length) {
            const fp = buildFollowUpPayload({ order: order as any, service: svc, step: current, submission: sub, daysSince });
            propose({ serviceId: svc.serviceId, serviceTitle: svc.title, stepId: current.id, kind: 'email_submission', title: `Follow up with ${sub.to} (${daysSince} days) — ${svc.title}`, summary: `Submitted ${sub.sentAt.slice(0, 10)}, no reply yet. Follow-up #${(sub.followUpsSent || []).length + 1} of ${cadence.length} is due.`, payload: fp, evidence: { entity }, priority: 44 + Math.min(daysSince, 20), dedupeKey: `followup:${orderId}:${sub.id}:${(sub.followUpsSent || []).length}` });
          } else run.notes.push(`Service "${svc.title}": waiting on regulator (${daysSince} days, next follow-up at ${cadence.find(d => d > daysSince) ?? 'none'}).`);
          break;
        }
        case 'portal_filing':
        case 'external_filing': {
          const mode = current.stepConfig?.submitMode || 'stage';
          const spec = findProcedure(current.stepConfig?.portalProcedure);
          if (mode === 'manual' || !spec) {
            propose(handoffProposal(order, svc, entity, svcUploads, current, !spec && current.stepConfig?.portalProcedure ? `No browser driver for "${current.stepConfig.portalProcedure}" yet — do this one by hand.` : undefined));
            break;
          }
          const job = await getActiveJobForStep(orderId, current.id);
          run.reads.push(`portalJobs(step=${current.id}) -> ${job ? job.status : 'none'}`);
          if (!job || job.status === 'abandoned' || job.status === 'expired' || job.status === 'failed') {
            if (job?.status === 'failed') { propose(handoffProposal(order, svc, entity, svcUploads, current, `The browser job failed: ${job.error || 'unknown error'}. Do this one by hand, or re-queue from the order page.`)); break; }
            const built = buildPortalInput({ step: current, entity: { ...entity, taxNumber: (order as any).taxNumber }, uploads: svcUploads, order });
            if (!built) { propose(handoffProposal(order, svc, entity, svcUploads, current)); break; }
            if (built.missing.length || built.missingCredentials.length) {
              propose(handoffProposal(order, svc, entity, svcUploads, current, `Cannot queue "${built.spec.title}" on ${built.spec.portalId}: missing ${[...built.missing, ...built.missingCredentials].join(', ')}. Collect these or do the filing by hand.`));
              break;
            }
            const payload = stagePayload(current, built);
            propose({ serviceId: svc.serviceId, serviceTitle: svc.title, stepId: current.id, kind: 'portal_stage', title: `Queue on ${built.spec.portalId}: ${built.spec.title} — ${svc.title}`, summary: `The browser worker will log in, fill "${built.spec.title}" with the values below and stop before submitting${built.spec.usesOtp ? '. Expect an OTP request.' : '.'}`, payload, evidence: { entity, notes: current.aiInstructions ? [current.aiInstructions] : [] }, priority: 56, dedupeKey: `portal_stage:${orderId}:${current.id}` });
            break;
          }
          switch (job.status) {
            case 'queued': case 'running': case 'submitting':
              run.notes.push(`Service "${svc.title}": portal job ${job.id} is ${job.status}.`); break;
            case 'otp_required': {
              const p: OtpPayload = { stepId: current.id, jobId: job.id, portalId: job.portalId, sentTo: job.otpRequest?.sentTo, requestedAt: job.otpRequest?.requestedAt || new Date().toISOString(), expiresAt: job.otpRequest?.expiresAt || new Date(Date.now() + 10 * 60_000).toISOString() };
              propose({ serviceId: svc.serviceId, serviceTitle: svc.title, stepId: current.id, kind: 'otp', title: `OTP needed on ${job.portalId} — ${svc.title}`, summary: `The portal sent a one-time PIN${job.otpRequest?.sentTo ? ` to ${job.otpRequest.sentTo}` : ''}. Enter it within 10 minutes or the job will pause.`, payload: p, evidence: {}, priority: 95, dedupeKey: `otp:${job.id}:${job.otpRequest?.requestedAt || ''}` });
              break;
            }
            case 'staged': {
              const p: PortalSubmitPayload = { stepId: current.id, stepTitle: current.title, jobId: job.id, portalId: job.portalId, procedure: job.procedure, screenshots: job.staged?.screenshots || [], reviewSheet: job.staged?.reviewSheet || [] };
              propose({ serviceId: svc.serviceId, serviceTitle: svc.title, stepId: current.id, kind: 'portal_submit', title: `Press submit on ${job.portalId}: ${spec.title} — ${svc.title}`, summary: `Filled and parked at the review screen. Check the screenshots, then approve to submit or reject to abandon.`, payload: p, evidence: { entity }, priority: 80, dedupeKey: `portal_submit:${job.id}` });
              break;
            }
            case 'submitted':
              await completeStep(orderId, current, `Submitted on ${job.portalId}${job.result?.reference ? ` — reference ${job.result.reference}` : ''}.`, run);
              break;
            case 'handoff':
              propose({ ...handoffProposal(order, svc, entity, svcUploads, current, `The browser worker could not finish on ${job.portalId}: ${job.handoff?.reason || 'unknown'}. The values it prepared are below; complete it by hand.`), payload: { ...(handoffProposal(order, svc, entity, svcUploads, current).payload as HandoffPayload), sheet: buildHandoffSheetFromJob(job, spec) } });
              break;
          }
          break;
        }
        default: {
          // calculate / deliver / manual / signoff: the agent prepares a hand-off sheet.
          propose(handoffProposal(order, svc, entity, svcUploads, current));
        }
      }
    }

    // ---- Persist ---------------------------------------------------------------------------
    const batch = db.batch();
    if (run.writes.length) {
      batch.update(orderRef, cleanFirestoreData({ documentUploads: uploads, updatedAt: new Date().toISOString(), lastAgentRunAt: new Date().toISOString(), lastAgentRunId: runId }));
    } else {
      batch.update(orderRef, { lastAgentRunAt: new Date().toISOString(), lastAgentRunId: runId });
    }
    for (const p of proposals) {
      batch.set(db.collection('agentProposals').doc(p.id), cleanFirestoreData(p));
      run.proposalsCreated.push(p.id);
    }
    await batch.commit();
    return finish(db, run, true);
  } catch (e: any) {
    run.error = e?.message || String(e);
    console.error('[runOrderAgent]', orderId, run.error);
    return finish(db, run, false);
  }
}

// ---------------------------------------------------------------------------------------------

async function finish(db: FirebaseFirestore.Firestore, run: AgentRun, ok: boolean): Promise<AgentRun> {
  run.ok = ok;
  run.finishedAt = new Date().toISOString();
  try { await db.collection('agentRuns').doc(run.id).set(cleanFirestoreData(run)); } catch (e) { console.error('[runOrderAgent] could not persist run', e); }
  return run;
}

function buildEntityContext(order: Order): EntityContext {
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

  // The ordering contact is a person; include them as a possible director ONLY for matching
  // director-name requirements. For entity-name requirements the engine ignores this list.
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

async function extractUpload(up: DocumentUpload, req: ServiceRequirement, today: Date): Promise<ExtractedDocumentFacts> {
  const url = up.fileUrl || up.files?.[0]?.fileUrl;
  if (!url) throw new Error('no file url');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const len = Number(res.headers.get('content-length') || 0);
  if (len > MAX_UPLOAD_BYTES_FOR_EXTRACTION) throw new Error('file too large for extraction');
  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get('content-type') || (up.mechanicalCheck?.facts?.detectedType === 'pdf' ? 'application/pdf' : 'image/jpeg');
  const dataUri = `data:${contentType};base64,${buf.toString('base64')}`;
  const { extractOrderDocument } = await import('@/ai/flows/extract-order-document');
  return extractOrderDocument({ fileDataUri: dataUri, requirementLabel: req.label, aiHint: req.aiHint, expectedKind: req.documentKind, today: today.toISOString().slice(0, 10) });
}

function reviewProposal(svc: OrderServiceSnapshot, up: DocumentUpload, decision: 'approved' | 'rejected', reason: string, clientMessage: string | undefined, evidence: AgentProposal['evidence'], priority: number): Omit<AgentProposal, 'id' | 'orderId' | 'orderNumber' | 'status' | 'createdAt' | 'runId'> {
  const payload: DocumentReviewPayload = { uploadId: up.id!, requirementLabel: up.requirementLabel, decision, reason, clientMessage };
  return {
    serviceId: svc.serviceId, serviceTitle: svc.title, kind: 'document_review' as ProposalKind,
    title: `${decision === 'approved' ? 'Approve' : 'Reject'}: ${up.requirementLabel}`,
    summary: reason, payload, evidence, priority,
    dedupeKey: `review:${up.id}:${up.uploadedAt}`,
  };
}

async function completeStep(orderId: string, step: OrderChecklistItem, note: string, run: AgentRun) {
  const r = await updateOrderChecklistItemAtomic(orderId, step.id, { status: 'completed', notes: note, isAiRecommended: true }, INTERNAL_SYSTEM_ACTOR);
  if ((r as any).success) run.writes.push(`orders/${orderId}.checklist[${step.id}] -> completed`);
  else run.notes.push(`Could not complete step ${step.id}: ${(r as any).error}`);
}

function lastClientNoteDaysAgo(order: Order, _purpose: string): number | null {
  const notes = (order.notes || []).filter(n => !n.isInternal);
  if (!notes.length) return null;
  const latest = notes.map(n => toDate(n.date)).filter((d): d is Date => !!d).sort((a, b) => b.getTime() - a.getTime())[0];
  return latest ? Math.floor((Date.now() - latest.getTime()) / 86_400_000) : null;
}

function toDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v?.toDate === 'function') return v.toDate();
  if (typeof v?.seconds === 'number') return new Date(v.seconds * 1000);
  const d = new Date(v); return isNaN(d.getTime()) ? null : d;
}

function firstName(order: Order) { return ((order.endCustomerName || order.customerName || '').trim().split(/\s+/)[0]) || 'there'; }

function fallbackChase(order: Order, missing: string[]): string {
  return `Hi ${firstName(order)},\n\nTo move your order forward we still need the following:\n${missing.map(m => `• ${m}`).join('\n')}\n\nYou can upload these on your order page. Shout if anything is unclear.\n\nKind regards\nMy Accountant`;
}

function fallbackGeneric(order: Order, step: OrderChecklistItem): string {
  return `Hi ${firstName(order)},\n\n${step.description || step.title}\n\nKind regards\nMy Accountant`;
}

function handoffProposal(order: Order, svc: OrderServiceSnapshot, entity: EntityContext, uploads: DocumentUpload[], step: OrderChecklistItem, extraNote?: string): Omit<AgentProposal, 'id' | 'orderId' | 'orderNumber' | 'status' | 'createdAt' | 'runId'> {
  const sheet = handoffSheet(order, svc, entity, uploads);
  const payload: HandoffPayload = { stepId: step.id, stepTitle: step.title, stepType: step.type || 'manual', instructions: [extraNote, step.aiInstructions].filter(Boolean).join('\n\n') || undefined, sheet };
  return { serviceId: svc.serviceId, serviceTitle: svc.title, stepId: step.id, kind: 'handoff', title: `${step.title} — ${svc.title}`, summary: `${humanStepType(step.type)} step for ${step.stepConfig?.owner || 'Kevin'}. Approve when done to advance the playbook.`, payload, evidence: { entity }, priority: priorityForStep(step, order), dedupeKey: `handoff:${order.id}:${step.id}` };
}

function handoffSheet(order: Order, svc: OrderServiceSnapshot, entity: EntityContext, uploads: DocumentUpload[]): HandoffPayload['sheet'] {
  const rows: HandoffPayload['sheet'] = [
    { label: 'Order', value: String(order.originalOrderId || order.id) },
    { label: 'Service', value: svc.title },
    { label: 'Client', value: order.endCustomerName || order.customerName || '' },
    { label: 'Client email', value: order.endCustomerEmail || order.customerEmail || '' },
  ];
  if (entity.entityName) rows.push({ label: 'Entity', value: entity.entityName });
  if (entity.registrationNumber) rows.push({ label: 'Registration number', value: entity.registrationNumber });
  for (const u of uploads) {
    if (u.type === 'text' && u.textValue) rows.push({ label: u.requirementLabel, value: u.isEncrypted ? '•••••••• (reveal on order page)' : u.textValue });
    else if (u.type === 'file') rows.push({ label: u.requirementLabel, value: `${u.status} — ${(u.files?.length || (u.fileUrl ? 1 : 0))} file(s)` });
  }
  return rows;
}

function priorityForStep(step: OrderChecklistItem, order: Order): number {
  const base: Record<string, number> = { portal_filing: 60, external_filing: 60, email_submission: 58, calculate: 55, internal_calc: 55, draft_document: 50, document_drafting: 50, deliver: 48, signoff: 45, wait_external: 20, manual: 40 };
  let p = base[step.type || 'manual'] ?? 40;
  const ageDays = Math.floor((Date.now() - (toDate((order as any).date)?.getTime() || Date.now())) / 86_400_000);
  p += Math.min(ageDays, 20);
  return p;
}

function humanStepType(t?: string): string {
  const m: Record<string, string> = { portal_filing: 'Portal filing', external_filing: 'Portal filing', email_submission: 'Email submission', calculate: 'Calculation', internal_calc: 'Calculation', draft_document: 'Document drafting', document_drafting: 'Document drafting', deliver: 'Delivery', signoff: 'Sign-off', wait_external: 'Regulator wait', manual: 'Manual' };
  return m[t || 'manual'] || 'Manual';
}
