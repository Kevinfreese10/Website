/**
 * Loads AI order agent playbook seeds into Firestore `services` documents.
 *
 * Seeds live in src/lib/playbooks/seeds/<slug>.json (one per service, keyed by slug).
 * Each seed may set: fulfillmentChecklist, informationToProvide (merged by id/label),
 * playbookEntity, playbookOutputs, playbookCommonFailures.
 *
 * Seeds are ALWAYS loaded as DRAFTS: playbookApproval is set to null and playbookVersion
 * is bumped. Approval only happens in the admin UI (ServiceForm → Agent Playbook tab).
 * See AI-ORDER-AGENT-PLAN.md §5.2.
 *
 * Usage (from repo root, .env.local loaded):
 *   node scripts/load-playbooks.js --dry-run              # show what would change
 *   node scripts/load-playbooks.js --slug ncr-registration  # one service
 *   node scripts/load-playbooks.js                        # all seeds
 *   node scripts/load-playbooks.js --key path/to/sa.json  # explicit service account
 */
const fs = require('fs');
const path = require('path');
const admin = require(path.join(__dirname, '..', 'node_modules', 'firebase-admin'));

// Plain `node` does not read .env.local (Next does). Load it here so the script works from the
// repo root without exporting anything. Existing environment variables win.
(function loadDotEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const raw of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[k] === undefined) process.env[k] = v;
  }
})();

function flag(name) { return process.argv.includes(`--${name}`); }
function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const DRY = flag('dry-run');
const ONLY = arg('slug', null);
const KEY = arg('key', process.env.GOOGLE_APPLICATION_CREDENTIALS);
const SEED_DIR = path.join(__dirname, '..', 'src', 'lib', 'playbooks', 'seeds');


if (!admin.apps.length) {
  // Same resolution order as src/lib/firebase-admin.ts:
  //   FIREBASE_SERVICE_ACCOUNT  = the JSON itself
  //   FIREBASE_SERVICE_ACCOUNT_KEY = a path to the JSON file (or --key on the command line)
  //   GOOGLE_APPLICATION_CREDENTIALS = a path to the JSON file
  const PROJECT_ID = 'studio-2604127518-57889';
  let sa = null;
  const tryJson = (txt, label) => { try { return JSON.parse(txt); } catch (e) { console.error(`${label} is not valid service-account JSON: ${e.message}`); return null; } };
  const tryFile = (p, label) => { if (p && fs.existsSync(p)) return tryJson(fs.readFileSync(p, 'utf8'), `${label} (${p})`); if (p) console.error(`${label} points to a file that does not exist: ${p}`); return null; };
  if (process.env.FIREBASE_SERVICE_ACCOUNT) sa = tryJson(process.env.FIREBASE_SERVICE_ACCOUNT, 'FIREBASE_SERVICE_ACCOUNT');
  if (!sa) sa = tryFile(KEY, '--key / GOOGLE_APPLICATION_CREDENTIALS');
  if (!sa) sa = tryFile(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'FIREBASE_SERVICE_ACCOUNT_KEY');
  if (!sa) {
    console.error('\nNo usable Firebase credentials. Either:\n  - put the service-account JSON file path in .env.local as FIREBASE_SERVICE_ACCOUNT_KEY=C:\\path\\to\\key.json, or\n  - run: node scripts/load-playbooks.js --key C:\\path\\to\\key.json');
    process.exit(1);
  }
  admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || PROJECT_ID });
}
const db = admin.firestore();

function validateSeed(seed, file) {
  const errors = [];
  if (!seed.slug) errors.push('missing slug');
  if (!Array.isArray(seed.fulfillmentChecklist) || seed.fulfillmentChecklist.length === 0) errors.push('fulfillmentChecklist must be a non-empty array');
  const ids = new Set();
  (seed.fulfillmentChecklist || []).forEach((s, i) => {
    if (!s.id) errors.push(`step ${i} missing id`);
    if (ids.has(s.id)) errors.push(`duplicate step id ${s.id}`);
    ids.add(s.id);
    if (!s.title) errors.push(`step ${s.id || i} missing title`);
    if (!s.type) errors.push(`step ${s.id || i} missing type`);
    if (s.type === 'portal_filing' && !s.portalId) errors.push(`step ${s.id} portal_filing needs portalId`);
    if (s.type === 'email_submission' && !s.emailTo) errors.push(`step ${s.id} email_submission needs emailTo`);
    if (s.type === 'portal_filing' && s.submitMode === 'auto') errors.push(`step ${s.id}: seeds may not set submitMode 'auto' (autonomy is earned, not seeded)`);
  });
  if (errors.length) throw new Error(`${file}: ${errors.join('; ')}`);
}

/** Merge seed requirements into existing informationToProvide by id, then by case-insensitive label. */
function mergeRequirements(existing = [], seeded = []) {
  const out = existing.map(r => ({ ...r }));
  for (const s of seeded) {
    let idx = s.id ? out.findIndex(r => r.id === s.id) : -1;
    if (idx === -1 && s.label) idx = out.findIndex(r => (r.label || '').trim().toLowerCase() === s.label.trim().toLowerCase());
    if (idx === -1) out.push({ ...s });
    else out[idx] = { ...out[idx], ...s, id: out[idx].id || s.id };
  }
  return out;
}

async function main() {
  const files = fs.readdirSync(SEED_DIR).filter(f => f.endsWith('.json') && !f.startsWith('_'));
  const servicesSnap = await db.collection('services').get();
  const bySlug = new Map();
  servicesSnap.forEach(d => { const data = d.data(); if (data.slug) bySlug.set(data.slug, { ref: d.ref, data }); });

  let applied = 0, skipped = 0;
  for (const file of files) {
    const seed = JSON.parse(fs.readFileSync(path.join(SEED_DIR, file), 'utf8'));
    if (ONLY && seed.slug !== ONLY) continue;
    validateSeed(seed, file);
    const target = bySlug.get(seed.slug);
    if (!target) { console.warn(`SKIP ${file}: no service with slug "${seed.slug}"`); skipped++; continue; }

    const update = {
      fulfillmentChecklist: seed.fulfillmentChecklist,
      playbookApproval: null,
      playbookVersion: (target.data.playbookVersion || 0) + 1,
      ...(seed.playbookEntity ? { playbookEntity: seed.playbookEntity } : {}),
      ...(seed.playbookOutputs ? { playbookOutputs: seed.playbookOutputs } : {}),
      ...(seed.playbookCommonFailures ? { playbookCommonFailures: seed.playbookCommonFailures } : {}),
      ...(seed.informationToProvide ? { informationToProvide: mergeRequirements(target.data.informationToProvide, seed.informationToProvide) } : {}),
      playbookSeededAt: new Date().toISOString(),
      playbookSeedFile: file,
    };

    const wasApproved = !!(target.data.playbookApproval && target.data.playbookApproval.approvedAt);
    console.log(`${DRY ? '[dry-run] ' : ''}${seed.slug}: ${seed.fulfillmentChecklist.length} steps, ${(seed.informationToProvide || []).length} requirement rows${wasApproved ? '  ** clears existing approval — re-approve in UI **' : ''}`);
    if (!DRY) { await target.ref.set(update, { merge: true }); applied++; }
  }
  console.log(`\nDone. ${DRY ? 'Would apply' : 'Applied'} ${DRY ? files.length - skipped : applied}, skipped ${skipped}.`);
  if (!DRY) console.log('Remember: seeds load as DRAFT. Approve each playbook in Admin → Products → Agent Playbook.');
}

main().catch(e => { console.error(e); process.exit(1); });
