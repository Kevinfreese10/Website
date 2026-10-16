/**
 * Firestore state for the quote agent. Replaces the local quote_ai_state.json, which can't work
 * on Cloud Run (ephemeral, possibly parallel containers).
 *
 *   agentConfig/quoteAgent   mode (live | draft-only | paused), lock lease, circuit-breaker counter
 *   quoteAgentMessages/{id}  one doc per inbound email; created atomically, so it's processed exactly once
 *   quoteDrafts/{id}         replies waiting for Kevin's Send/Discard
 *   quotes/{quoteRef}        every quote actually sent (used for the per-sender limit and thread linking)
 *   agentAudit/{id}          append-only log of what the agent did
 *
 * All access is server-side through the Admin SDK. firestore.rules keeps these collections closed to clients.
 */
import { createHash, randomUUID } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { QUOTE_POLICY } from './config';
import type { AgentAction, AgentMode, EmailCategory, QuoteLine } from './types';

const CONFIG_DOC = 'agentConfig/quoteAgent';
const db = () => getAdminDb();
const nowIso = () => new Date().toISOString();

export interface AgentConfig {
  mode: AgentMode;
  consecutiveFailures: number;
  /** Emails dated before this are recorded as baseline and never acted on (prevents a backlog blast on first deploy). */
  startedAt: string;
  lockUntil?: number;
  lockOwner?: string;
  lastRunAt?: string;
  lastError?: string;
  pausedReason?: string;
}

export async function getConfig(): Promise<AgentConfig> {
  const ref = db().doc(CONFIG_DOC);
  const snap = await ref.get();
  if (snap.exists) return snap.data() as AgentConfig;
  // First run: live (decision 3), baseline = now.
  const initial: AgentConfig = { mode: 'live', consecutiveFailures: 0, startedAt: nowIso() };
  await ref.set(initial, { merge: true });
  return initial;
}

export async function setMode(mode: AgentMode, by: string, reason?: string): Promise<void> {
  await db().doc(CONFIG_DOC).set(
    {
      mode,
      pausedReason: mode === 'paused' ? reason || `Paused by ${by}` : FieldValue.delete(),
      ...(mode === 'live' ? { consecutiveFailures: 0 } : {}),
      modeChangedAt: nowIso(),
      modeChangedBy: by,
    },
    { merge: true },
  );
  await audit('mode_change', { mode, by, reason });
}

/** Single-runner lease so two overlapping Cloud Scheduler calls can't process the same inbox at once. */
export async function acquireLock(owner: string): Promise<boolean> {
  const ref = db().doc(CONFIG_DOC);
  return db().runTransaction(async tx => {
    const snap = await tx.get(ref);
    const now = Date.now();
    const until = (snap.data()?.lockUntil as number) || 0;
    if (until > now) return false;
    tx.set(ref, { lockUntil: now + QUOTE_POLICY.lockLeaseMs, lockOwner: owner }, { merge: true });
    return true;
  });
}

export async function releaseLock(owner: string, patch: Partial<AgentConfig> = {}): Promise<void> {
  const ref = db().doc(CONFIG_DOC);
  await db().runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (snap.data()?.lockOwner !== owner) return;
    tx.set(ref, { ...patch, lockUntil: 0, lockOwner: FieldValue.delete(), lastRunAt: nowIso() }, { merge: true });
  });
}

/** Circuit breaker (decision 10c). Returns true if this failure tripped it and the agent is now paused. */
export async function recordFailure(error: string): Promise<boolean> {
  const ref = db().doc(CONFIG_DOC);
  const tripped = await db().runTransaction(async tx => {
    const snap = await tx.get(ref);
    const n = ((snap.data()?.consecutiveFailures as number) || 0) + 1;
    const trip = n >= QUOTE_POLICY.circuitBreakerThreshold && snap.data()?.mode !== 'paused';
    tx.set(ref, { consecutiveFailures: n, lastError: error.slice(0, 500), ...(trip ? { mode: 'paused', pausedReason: `Circuit breaker: ${n} failures in a row. Last: ${error.slice(0, 200)}` } : {}) }, { merge: true });
    return trip;
  });
  await audit(tripped ? 'circuit_breaker_tripped' : 'failure', { error: error.slice(0, 1000) });
  return tripped;
}

export async function recordSuccess(): Promise<void> {
  await db().doc(CONFIG_DOC).set({ consecutiveFailures: 0, lastError: FieldValue.delete() }, { merge: true });
}

// ---------------------------------------------------------------------------------------------
// Inbound messages
// ---------------------------------------------------------------------------------------------

export const messageDocId = (key: string) => createHash('sha1').update(key).digest('hex');

export async function isKnownMessage(key: string): Promise<boolean> {
  return (await db().collection('quoteAgentMessages').doc(messageDocId(key)).get()).exists;
}

/** Atomically claims an email. Returns false if another run already has it. */
export async function claimMessage(key: string, meta: { uid: number; from: string; subject: string; date: string }): Promise<boolean> {
  try {
    await db().collection('quoteAgentMessages').doc(messageDocId(key)).create({ key, ...meta, status: 'processing', createdAt: nowIso(), updatedAt: nowIso() });
    return true;
  } catch (err: any) {
    if (err?.code === 6 || /already exists/i.test(err?.message || '')) return false;
    throw err;
  }
}

export interface MessageOutcome {
  status: 'done' | 'error' | 'baseline' | 'ignored';
  category?: EmailCategory;
  action?: AgentAction;
  summary?: string;
  reasons?: string[];
  draftId?: string;
  quoteRef?: string;
  urgent?: boolean;
  error?: string;
}

export async function finishMessage(key: string, outcome: MessageOutcome): Promise<void> {
  await db().collection('quoteAgentMessages').doc(messageDocId(key)).set({ ...outcome, updatedAt: nowIso() }, { merge: true });
}

/** Lets an errored message be retried on the next tick. After 3 attempts it stays in error, so a poison email stops retrying. */
export async function releaseForRetry(key: string, error: string): Promise<void> {
  const id = messageDocId(key);
  const attempts = (await retryAttempts(key)) + 1;
  await db().collection('quoteAgentRetries').doc(id).set({ key, attempts, lastError: error.slice(0, 500), at: nowIso() }, { merge: true });
  const ref = db().collection('quoteAgentMessages').doc(id);
  if (attempts >= 3) {
    await ref.set({ status: 'error', error: error.slice(0, 500), attempts, updatedAt: nowIso() }, { merge: true });
  } else {
    await ref.delete();
  }
}

export async function retryAttempts(key: string): Promise<number> {
  const snap = await db().collection('quoteAgentRetries').doc(messageDocId(key)).get();
  return (snap.data()?.attempts as number) || 0;
}

export async function messagesSince(sinceIso: string): Promise<Array<Record<string, any>>> {
  const snap = await db().collection('quoteAgentMessages').where('updatedAt', '>=', sinceIso).get();
  return snap.docs.map(d => d.data());
}

// ---------------------------------------------------------------------------------------------
// Quotes and drafts
// ---------------------------------------------------------------------------------------------

export interface QuoteRecord {
  quoteRef: string;
  to: string;
  clientName: string;
  lines: QuoteLine[];
  total: number;
  validUntil: string;
  auto: boolean;
  sentAt: string;
  sentMessageId: string;
  sourceMessageKey: string;
}

export async function saveQuote(q: QuoteRecord): Promise<void> {
  await db().collection('quotes').doc(q.quoteRef).set(q);
}

/** Automatic quotes to this address in the last 24h (decision 10a). Filtered in memory to avoid a composite index. */
export async function countRecentAutoQuotes(address: string): Promise<number> {
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const snap = await db().collection('quotes').where('to', '==', address.toLowerCase()).get();
  return snap.docs.filter(d => d.data().auto === true && String(d.data().sentAt) >= since).length;
}

/** Finds the quote a reply belongs to, via In-Reply-To/References (decision 9). */
export async function findQuoteForThread(messageIds: string[]): Promise<QuoteRecord | null> {
  const ids = [...new Set(messageIds.filter(Boolean))].slice(-30);
  if (!ids.length) return null;
  const snap = await db().collection('quotes').where('sentMessageId', 'in', ids).limit(1).get();
  return snap.empty ? null : (snap.docs[0].data() as QuoteRecord);
}

export type DraftStatus = 'pending' | 'sending' | 'sent' | 'discarded' | 'failed';

export interface QuoteDraft {
  id: string;
  status: DraftStatus;
  category: EmailCategory;
  kind: 'quote' | 'letter';
  to: string;
  subject: string;
  html: string;
  inReplyTo?: string;
  references?: string[];
  sourceMessageKey: string;
  sourceFrom: string;
  sourceSubject: string;
  sourceExcerpt: string;
  summary: string;
  reasons: string[];
  quoteRef?: string;
  lines?: QuoteLine[];
  total?: number;
  validUntil?: string;
  clientName?: string;
  telegramMessageId?: number;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
  sentMessageId?: string;
  error?: string;
}

export async function createDraft(d: Omit<QuoteDraft, 'id' | 'status' | 'createdAt'>): Promise<QuoteDraft> {
  const draft: QuoteDraft = { ...d, id: randomUUID().slice(0, 12), status: 'pending', createdAt: nowIso() };
  await db().collection('quoteDrafts').doc(draft.id).set(draft);
  return draft;
}

export async function getDraft(id: string): Promise<QuoteDraft | null> {
  const snap = await db().collection('quoteDrafts').doc(id).get();
  return snap.exists ? (snap.data() as QuoteDraft) : null;
}

export async function updateDraft(id: string, patch: Partial<QuoteDraft>): Promise<void> {
  await db().collection('quoteDrafts').doc(id).set(patch, { merge: true });
}

/** pending -> sending, atomically. A double-tapped [Send] button can therefore only send once. */
export async function lockDraftForSending(id: string, by: string): Promise<QuoteDraft | null> {
  const ref = db().collection('quoteDrafts').doc(id);
  return db().runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists || snap.data()?.status !== 'pending') return null;
    tx.update(ref, { status: 'sending', decidedBy: by, decidedAt: nowIso() });
    return snap.data() as QuoteDraft;
  });
}

export async function listDrafts(status: DraftStatus, limit = 100): Promise<QuoteDraft[]> {
  const snap = await db().collection('quoteDrafts').where('status', '==', status).limit(limit).get();
  return snap.docs.map(d => d.data() as QuoteDraft).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function audit(type: string, data: Record<string, unknown>): Promise<void> {
  try {
    await db().collection('agentAudit').add({ agent: 'quote-agent', type, at: nowIso(), ...JSON.parse(JSON.stringify(data)) });
  } catch (err: any) {
    console.error('[quote-agent] audit write failed:', err.message);
  }
}
