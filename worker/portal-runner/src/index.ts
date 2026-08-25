/**
 * My Accountant portal worker (AI-ORDER-AGENT-PLAN.md §6.4).
 *
 *   npx tsx src/index.ts            long-running: poll portalJobs and run them
 *   npx tsx src/index.ts --once     drain the queue once, then exit (Cloud Run job)
 *   npx tsx src/index.ts --health   run every driver's smokeLogin and write portalHealth/{portalId}
 */
import 'dotenv/config';
import admin from 'firebase-admin';
import { chromium, type BrowserContext } from 'playwright';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { DRIVERS } from './drivers/index.js';
import { AbandonedError, HandoffError, OtpTimeoutError, StageTimeoutError, type PortalJob, type ProcedureContext, type Shot } from './types.js';

// ---------------------------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------------------------

const WORKER_ID = process.env.WORKER_ID || `runner-${crypto.randomBytes(2).toString('hex')}`;
const POLL_MS = Number(process.env.POLL_INTERVAL_MS || 15000);
const HEADLESS = (process.env.HEADLESS || 'true') !== 'false';
const PROFILES_DIR = process.env.PROFILES_DIR || './profiles';
const OTP_TIMEOUT_MS = Number(process.env.OTP_TIMEOUT_MINUTES || 10) * 60_000;
const STAGE_TIMEOUT_MS = Number(process.env.STAGE_TIMEOUT_MINUTES || 240) * 60_000;
const BUCKET = process.env.STORAGE_BUCKET || 'studio-2604127518-57889.firebasestorage.app';

if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)), storageBucket: BUCKET });
  else admin.initializeApp({ storageBucket: BUCKET });
}
const db = admin.firestore();
const bucket = admin.storage().bucket(BUCKET);

// Same scheme as the app's src/lib/encryption.ts (aes-256-cbc, iv:hex).
function decrypt(text: string): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error('ENCRYPTION_KEY not set');
  const [ivHex, ...rest] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
  return Buffer.concat([decipher.update(Buffer.from(rest.join(':'), 'hex')), decipher.final()]).toString();
}

async function uploadShot(jobId: string, label: string, png: Buffer): Promise<Shot> {
  const name = `portalJobs/${jobId}/${Date.now()}_${label.replace(/[^a-z0-9]+/gi, '_')}.png`;
  const file = bucket.file(name);
  const token = crypto.randomBytes(16).toString('hex');
  await file.save(png, { metadata: { contentType: 'image/png', metadata: { firebaseStorageDownloadTokens: token } } });
  const url = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(name)}?alt=media&token=${token}`;
  return { label, url };
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const now = () => new Date().toISOString();

// ---------------------------------------------------------------------------------------------
// Job lifecycle
// ---------------------------------------------------------------------------------------------

async function claimNext(): Promise<PortalJob | null> {
  const snap = await db.collection('portalJobs').where('status', '==', 'queued').orderBy('createdAt').limit(5).get();
  for (const d of snap.docs) {
    const ref = d.ref;
    const claimed = await db.runTransaction(async tx => {
      const cur = await tx.get(ref);
      if (!cur.exists || cur.data()!.status !== 'queued') return false;
      tx.update(ref, { status: 'running', claimedAt: now(), claimedBy: WORKER_ID, heartbeatAt: now(), log: admin.firestore.FieldValue.arrayUnion({ at: now(), message: `Claimed by ${WORKER_ID}` }) });
      return true;
    });
    if (claimed) return { ...(d.data() as PortalJob), status: 'running' };
  }
  return null;
}

async function openContext(portalId: string, profileKey: string): Promise<BrowserContext> {
  const dir = path.join(PROFILES_DIR, portalId, profileKey.replace(/[^a-z0-9]+/gi, '_'));
  fs.mkdirSync(dir, { recursive: true });
  return chromium.launchPersistentContext(dir, { headless: HEADLESS, viewport: { width: 1280, height: 900 }, locale: 'en-ZA', timezoneId: 'Africa/Johannesburg', args: ['--disable-blink-features=AutomationControlled'] });
}

async function runJob(job: PortalJob) {
  const ref = db.collection('portalJobs').doc(job.id);
  const log = async (message: string) => { console.log(`[${job.id}] ${message}`); await ref.update({ heartbeatAt: now(), log: admin.firestore.FieldValue.arrayUnion({ at: now(), message }) }); };
  const driver = DRIVERS[job.portalId];
  if (!driver) { await ref.update({ status: 'handoff', handoff: { reason: `No driver for portal ${job.portalId}`, sheet: [], screenshots: [] } }); return; }
  const procName = job.procedure.includes('.') ? job.procedure.split('.').slice(1).join('.') : job.procedure;
  const procedure = driver.procedures[procName] || driver.procedures[procName.split(':')[0]];
  if (!procedure) { await ref.update({ status: 'handoff', handoff: { reason: `Driver ${job.portalId} has no procedure ${procName}`, sheet: [], screenshots: [] } }); return; }

  const decrypted = job.credentials.map(c => { try { return { label: c.label.toLowerCase(), value: decrypt(c.encryptedValue) }; } catch { return { label: c.label.toLowerCase(), value: '' }; } });
  const credential = (sub: string) => decrypted.find(c => c.label.includes(sub.toLowerCase()))?.value;
  const profileKey = credential('username') || credential('user') || 'firm';

  const context = await openContext(job.portalId, profileKey);
  const page = await context.newPage();
  page.setDefaultTimeout(30_000);
  const shots: Shot[] = [];

  const ctx: ProcedureContext = {
    job, page, context, credential, log,
    screenshot: async (label) => { const s = await uploadShot(job.id, label, await page.screenshot({ fullPage: true })); shots.push(s); return s; },
    requestOtp: async (sentTo) => {
      const expiresAt = new Date(Date.now() + OTP_TIMEOUT_MS).toISOString();
      await ref.update({ status: 'otp_required', otpRequest: { requestedAt: now(), sentTo: sentTo || null, expiresAt }, otpResponse: admin.firestore.FieldValue.delete() });
      await log(`OTP requested${sentTo ? ` (sent to ${sentTo})` : ''}`);
      const deadline = Date.now() + OTP_TIMEOUT_MS;
      while (Date.now() < deadline) {
        await sleep(5000);
        const cur = (await ref.get()).data() as PortalJob;
        if (cur.otpResponse?.code) {
          await ref.update({ status: 'running', otpRequest: admin.firestore.FieldValue.delete(), otpResponse: admin.firestore.FieldValue.delete() });
          await log('OTP received');
          return cur.otpResponse.code;
        }
      }
      throw new OtpTimeoutError();
    },
    stage: async (reviewSheet, screenshots) => {
      if (job.mode === 'auto') { await log('Auto mode: submitting without review'); return 'submit'; }
      const expiresAt = new Date(Date.now() + STAGE_TIMEOUT_MS).toISOString();
      await ref.update({ status: 'staged', staged: { at: now(), screenshots, reviewSheet, expiresAt } });
      await log('Staged — waiting for decision');
      const deadline = Date.now() + STAGE_TIMEOUT_MS;
      while (Date.now() < deadline) {
        await sleep(10_000);
        const cur = (await ref.get()).data() as PortalJob;
        if (cur.decision?.action === 'submit') { await log(`Submit approved by ${cur.decision.by}`); return 'submit'; }
        if (cur.decision?.action === 'abandon' || cur.status === 'abandoned') { await log(`Abandoned by ${cur.decision?.by || 'reviewer'}`); return 'abandon'; }
        await ref.update({ heartbeatAt: now() });
      }
      throw new StageTimeoutError();
    },
    handoff: (reason, sheet = []) => { throw new HandoffError(reason, sheet); },
  };

  try {
    await log(`Running ${job.procedure} (${job.mode})`);
    await driver.login(ctx);
    const result = await procedure(ctx, job.input);
    await ref.update({ status: 'submitted', result: { reference: result.reference || null, confirmationUrl: result.confirmationUrl || null, screenshots: shots, notes: result.notes || [] } });
    await log(`Submitted${result.reference ? ` — reference ${result.reference}` : ''}`);
  } catch (e: any) {
    let extra: Shot | null = null;
    try { extra = await uploadShot(job.id, 'at_failure', await page.screenshot({ fullPage: true })); shots.push(extra); } catch { /* page may be gone */ }
    const sheet = Object.entries(job.input || {}).map(([label, v]) => ({ label, value: typeof v === 'string' ? v : JSON.stringify(v) }));
    if (e instanceof HandoffError) { await ref.update({ status: 'handoff', handoff: { reason: e.reason, sheet: e.sheet.length ? e.sheet : sheet, screenshots: shots } }); await log(`Hand-off: ${e.reason}`); }
    else if (e instanceof AbandonedError) { await ref.update({ status: 'abandoned' }); }
    else if (e instanceof OtpTimeoutError) { await ref.update({ status: 'expired', error: 'OTP not provided within the time limit', handoff: { reason: 'OTP timed out', sheet, screenshots: shots } }); await log('Expired: OTP timeout'); }
    else if (e instanceof StageTimeoutError) { await ref.update({ status: 'expired', error: 'No submit/abandon decision within the time limit', handoff: { reason: 'Stage timed out', sheet, screenshots: shots } }); await log('Expired: stage timeout'); }
    else { await ref.update({ status: 'failed', error: String(e?.message || e).slice(0, 500), handoff: { reason: `Driver error: ${String(e?.message || e).slice(0, 200)}`, sheet, screenshots: shots } }); await log(`Failed: ${e?.message || e}`); }
  } finally {
    await context.close().catch(() => {});
  }
}

// ---------------------------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------------------------

async function healthCheck() {
  for (const [portalId, driver] of Object.entries(DRIVERS)) {
    const proc = driver.procedures['smokeLogin'];
    const ref = db.collection('portalHealth').doc(portalId);
    if (!proc) { await ref.set({ portalId, checkedAt: now(), ok: false, message: 'no smokeLogin procedure' }); continue; }
    const fake: PortalJob = { id: `health_${portalId}_${Date.now()}`, orderId: '-', orderNumber: '-', serviceId: '-', stepId: '-', portalId, procedure: `${portalId}.smokeLogin`, mode: 'stage', input: {}, credentials: [], status: 'running', createdAt: now(), createdBy: 'health', log: [] };
    const context = await openContext(portalId, 'firm');
    const page = await context.newPage();
    let shot: Shot | undefined;
    try {
      const ctx: ProcedureContext = { job: fake, page, context, credential: () => undefined, log: async m => console.log(`[health:${portalId}] ${m}`), screenshot: async l => (shot = await uploadShot(fake.id, l, await page.screenshot())), requestOtp: async () => { throw new HandoffError('OTP required during health check'); }, stage: async () => 'abandon', handoff: (r) => { throw new HandoffError(r); } };
      await driver.login(ctx);
      await proc(ctx, {});
      await ref.set({ portalId, checkedAt: now(), ok: true, message: 'login OK', screenshotUrl: shot?.url || null });
    } catch (e: any) {
      try { shot = await uploadShot(fake.id, 'health_failure', await page.screenshot()); } catch { /* ignore */ }
      await ref.set({ portalId, checkedAt: now(), ok: false, message: String(e?.message || e).slice(0, 300), screenshotUrl: shot?.url || null });
    } finally { await context.close().catch(() => {}); }
  }
}

// ---------------------------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------------------------

async function main() {
  const once = process.argv.includes('--once');
  if (process.argv.includes('--health')) { await healthCheck(); return; }
  console.log(`portal-runner ${WORKER_ID} started (headless=${HEADLESS}, drivers: ${Object.keys(DRIVERS).join(', ')})`);
  // Expire jobs whose stage/OTP window lapsed while no worker was watching.
  for (;;) {
    const job = await claimNext();
    if (job) { await runJob(job); continue; }
    if (once) { console.log('queue drained'); return; }
    await sleep(POLL_MS);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
