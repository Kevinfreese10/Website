/**
 * PORTAL adapter — app side (AI-ORDER-AGENT-PLAN.md §6.4).
 *
 * The app never touches a browser. It builds the input sheet for a procedure, queues a job in
 * `portalJobs` when Kevin approves, relays OTPs and the final submit decision, and turns the
 * worker's outcome (staged / submitted / handoff) back into proposals or step completion.
 */

import { getAdminDb, cleanFirestoreData } from '@/lib/firebase-admin';
import type { DocumentUpload, Order, OrderChecklistItem, OrderServiceSnapshot } from '@/lib/types';
import type { EntityContext } from '@/lib/verification/rules';
import { findProcedure, type PortalProcedureSpec } from './portal-registry';
import type { PortalJob, PortalStagePayload } from './types';

export type PortalInputResult = {
  spec: PortalProcedureSpec;
  input: Record<string, any>;
  missing: string[];
  credentials: { label: string; encryptedValue: string }[];
  missingCredentials: string[];
};

/** Resolve a procedure's inputs from the order without inventing anything. */
export function buildPortalInput(args: { step: OrderChecklistItem; entity: EntityContext & { taxNumber?: string }; uploads: DocumentUpload[]; order: Order }): PortalInputResult | null {
  const spec = findProcedure(args.step.stepConfig?.portalProcedure);
  if (!spec) return null;
  const answers: Record<string, string> = {};
  const secrets: { label: string; encryptedValue: string }[] = [];
  for (const u of args.uploads) {
    if (u.type !== 'text' || !u.textValue) continue;
    if (u.isEncrypted) secrets.push({ label: u.requirementLabel, encryptedValue: u.textValue });
    else answers[u.requirementLabel.toLowerCase()] = u.textValue.trim();
  }
  const answer = (hint?: string) => { if (!hint) return undefined; for (const [k, v] of Object.entries(answers)) if (k.includes(hint.toLowerCase())) return v; return undefined; };

  const input: Record<string, any> = {};
  const missing: string[] = [];
  for (const f of spec.inputs) {
    let v: any;
    if (f.from === 'entity') v = (args.entity as any)[f.key] ?? (f.key === 'entityName' ? args.entity.entityName : f.key === 'registrationNumber' ? args.entity.registrationNumber : f.key === 'taxNumber' ? args.entity.taxNumber : undefined);
    else if (f.from === 'answer') v = answer(f.hint);
    if (v === undefined || v === '') { if (f.required) missing.push(f.label); }
    else input[f.key] = v;
  }
  const credentials = secrets.filter(s => spec.credentials.some(c => s.label.toLowerCase().includes(c)));
  const missingCredentials = spec.credentials.length && !credentials.length ? ['eFiling username and password'] : [];
  return { spec, input, missing, credentials, missingCredentials };
}

export function stagePayload(step: OrderChecklistItem, r: PortalInputResult): PortalStagePayload {
  return { stepId: step.id, stepTitle: step.title, portalId: r.spec.portalId, procedure: r.spec.id, input: r.input, credentials: r.credentials, submitMode: step.stepConfig?.submitMode === 'auto' ? 'auto' : 'stage' };
}

/** Called when a portal_stage proposal is approved. */
export async function enqueuePortalJob(order: Order & { id: string }, serviceId: string, payload: PortalStagePayload, createdBy: string): Promise<PortalJob> {
  const db = getAdminDb();
  const id = `pj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const job: PortalJob = {
    id, orderId: order.id, orderNumber: String(order.originalOrderId || order.id), serviceId, stepId: payload.stepId,
    portalId: payload.portalId, procedure: payload.procedure, mode: payload.submitMode, input: payload.input, credentials: payload.credentials,
    status: 'queued', createdAt: new Date().toISOString(), createdBy, log: [{ at: new Date().toISOString(), message: `Queued by ${createdBy}` }],
  };
  await db.collection('portalJobs').doc(id).set(cleanFirestoreData(job));
  return job;
}

export async function getActiveJobForStep(orderId: string, stepId: string): Promise<PortalJob | null> {
  const db = getAdminDb();
  const snap = await db.collection('portalJobs').where('orderId', '==', orderId).where('stepId', '==', stepId).get();
  const jobs = snap.docs.map(d => d.data() as PortalJob).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return jobs[0] || null;
}

export async function provideOtp(jobId: string, code: string, by: string) {
  const db = getAdminDb();
  const ref = db.collection('portalJobs').doc(jobId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Job not found');
  const job = snap.data() as PortalJob;
  if (job.status !== 'otp_required') throw new Error(`Job is ${job.status}, not waiting for a PIN`);
  if (job.otpRequest && new Date(job.otpRequest.expiresAt).getTime() < Date.now()) throw new Error('The PIN request has expired; the job will be re-queued');
  await ref.update({ otpResponse: { code: code.trim(), providedAt: new Date().toISOString(), providedBy: by }, log: [...job.log, { at: new Date().toISOString(), message: `OTP provided by ${by}` }] });
}

export async function decideStagedJob(jobId: string, action: 'submit' | 'abandon', by: string) {
  const db = getAdminDb();
  const ref = db.collection('portalJobs').doc(jobId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Job not found');
  const job = snap.data() as PortalJob;
  if (job.status !== 'staged') throw new Error(`Job is ${job.status}, not staged`);
  await ref.update({ decision: { action, at: new Date().toISOString(), by }, status: action === 'submit' ? 'submitting' : 'abandoned', log: [...job.log, { at: new Date().toISOString(), message: `${action} by ${by}` }] });
}

/** Re-queue a job that expired or failed transiently (same input). */
export async function requeueJob(jobId: string, by: string) {
  const db = getAdminDb();
  const ref = db.collection('portalJobs').doc(jobId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Job not found');
  const job = snap.data() as PortalJob;
  await ref.update(cleanFirestoreData({ status: 'queued', otpRequest: null, otpResponse: null, staged: null, decision: null, error: null, claimedAt: null, claimedBy: null, log: [...job.log, { at: new Date().toISOString(), message: `Re-queued by ${by}` }] }));
}

export function buildHandoffSheetFromJob(job: PortalJob, spec?: PortalProcedureSpec): { label: string; value: string }[] {
  const rows = [{ label: 'Portal', value: job.portalId }, { label: 'Procedure', value: spec?.title || job.procedure }];
  for (const [k, v] of Object.entries(job.input || {})) rows.push({ label: spec?.inputs.find(i => i.key === k)?.label || k, value: typeof v === 'string' ? v : JSON.stringify(v) });
  if (job.credentials?.length) rows.push({ label: 'Credentials', value: `${job.credentials.length} stored (reveal on order page)` });
  if (job.handoff?.reason) rows.push({ label: 'Why the worker stopped', value: job.handoff.reason });
  return rows;
}
