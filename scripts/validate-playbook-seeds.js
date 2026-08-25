/**
 * Validates every seed in src/lib/playbooks/seeds/*.json without touching Firestore.
 * Same rules as scripts/load-playbooks.js plus catalogue cross-checks.
 *
 *   node scripts/validate-playbook-seeds.js [--catalogue scratch/services-audit-raw.json]
 */
const fs = require('fs');
const path = require('path');

const STEP_TYPES = new Set(['doc_verification','document_drafting','external_filing','internal_calc','manual','signoff','collect','verify','calculate','draft_document','draft_client_message','email_submission','portal_filing','wait_external','deliver']);
const PORTALS = new Set(['cipc','efiling','cf_filing','ufiling','cidb','csd','ncr','nhbrc','dsd','other']);
const KINDS = new Set(['sa_id','passport','proof_of_address','cor14_3','cor39','moi','bank_confirmation','bank_statement','tcs_pin','sars_notice_of_registration','afs','management_accounts','trial_balance','payslip','irp5','it3','medical_aid_cert','ra_cert','logbook','invoice','receipt','share_certificate','resolution','power_of_attorney','letterhead','criminal_clearance','letter_of_good_standing','coida_registration','cidb_certificate','completion_certificate','letter_of_award','photo','other']);
const OWNERS = new Set(['agent','kevin','staff']);

function arg(name, fallback) { const i = process.argv.indexOf(`--${name}`); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback; }
const SEED_DIR = arg('dir', path.join(__dirname, '..', 'src', 'lib', 'playbooks', 'seeds'));
const CAT = arg('catalogue', path.join(__dirname, '..', 'scratch', 'services-audit-raw.json'));

let slugs = null;
if (fs.existsSync(CAT)) {
  const d = JSON.parse(fs.readFileSync(CAT, 'utf8'));
  const arr = Array.isArray(d) ? d : (d.services || Object.values(d));
  slugs = new Set(arr.map(s => s.slug));
}

const files = fs.readdirSync(SEED_DIR).filter(f => f.endsWith('.json') && !f.startsWith('_'));
let errors = 0, warnings = 0;
const seen = new Set();
for (const file of files) {
  const errs = [], warns = [];
  let seed;
  try { seed = JSON.parse(fs.readFileSync(path.join(SEED_DIR, file), 'utf8')); } catch (e) { console.log(`✖ ${file}: invalid JSON — ${e.message}`); errors++; continue; }
  if (!seed.slug) errs.push('missing slug');
  if (seed.slug && file !== `${seed.slug}.json`) errs.push(`file name should be ${seed.slug}.json`);
  if (seen.has(seed.slug)) errs.push('duplicate slug'); seen.add(seed.slug);
  if (slugs && seed.slug && !slugs.has(seed.slug)) errs.push(`slug "${seed.slug}" not in catalogue`);
  if (seed.playbookEntity && !['company','individual','either'].includes(seed.playbookEntity)) errs.push('bad playbookEntity');
  if (!Array.isArray(seed.playbookOutputs) || !seed.playbookOutputs.length) warns.push('no playbookOutputs');
  if (!Array.isArray(seed.playbookCommonFailures) || seed.playbookCommonFailures.length < 2) warns.push('fewer than 2 playbookCommonFailures');
  const steps = seed.fulfillmentChecklist;
  if (!Array.isArray(steps) || !steps.length) errs.push('fulfillmentChecklist empty');
  const ids = new Set();
  (steps || []).forEach((s, i) => {
    const tag = s.id || `#${i}`;
    if (!s.id) errs.push(`step ${tag} missing id`);
    if (ids.has(s.id)) errs.push(`duplicate step id ${s.id}`); ids.add(s.id);
    if (!s.title) errs.push(`step ${tag} missing title`);
    if (!STEP_TYPES.has(s.type)) errs.push(`step ${tag} bad type "${s.type}"`);
    if (s.owner && !OWNERS.has(s.owner)) errs.push(`step ${tag} bad owner`);
    if (!s.owner) warns.push(`step ${tag} no owner`);
    if (s.type === 'portal_filing') {
      if (!PORTALS.has(s.portalId)) errs.push(`step ${tag} portal_filing needs valid portalId`);
      if (s.submitMode === 'auto') errs.push(`step ${tag} submitMode auto not allowed in seeds`);
      if (!s.submitMode) warns.push(`step ${tag} no submitMode (defaults to stage)`);
    }
    if (s.type === 'email_submission' && !s.emailTo) errs.push(`step ${tag} email_submission needs emailTo`);
    if (s.type === 'wait_external' && !Array.isArray(s.followUpAfterDays)) warns.push(`step ${tag} wait_external without followUpAfterDays`);
    if (s.type === 'draft_document' && !(Array.isArray(s.templateIds) && s.templateIds.length)) warns.push(`step ${tag} draft_document without templateIds`);
    if (!s.doneCriteria) warns.push(`step ${tag} no doneCriteria`);
  });
  (seed.informationToProvide || []).forEach((r, i) => {
    if (!r.label) errs.push(`requirement #${i} missing label`);
    if (r.documentKind && !KINDS.has(r.documentKind)) errs.push(`requirement "${r.label}" bad documentKind ${r.documentKind}`);
    if (r.inNameOf && !['entity','director','either'].includes(r.inNameOf)) errs.push(`requirement "${r.label}" bad inNameOf`);
    if (r.type && r.type !== 'text' && !r.aiHint) warns.push(`requirement "${r.label}" has no aiHint`);
  });
  const stepTypes = new Set((steps || []).map(s => s.type));
  if (!stepTypes.has('signoff')) warns.push('no signoff step');
  if (!stepTypes.has('deliver')) warns.push('no deliver step');
  errors += errs.length; warnings += warns.length;
  console.log(`${errs.length ? '✖' : '✔'} ${file}  steps=${(steps || []).length} reqs=${(seed.informationToProvide || []).length}${errs.length ? '\n    ERR ' + errs.join('\n    ERR ') : ''}${warns.length ? '\n    warn ' + warns.join('\n    warn ') : ''}`);
}
if (slugs) {
  const missing = [...slugs].filter(s => !seen.has(s));
  console.log(`\nSeeds: ${seen.size}/${slugs.size} catalogue slugs covered.${missing.length ? ' Missing: ' + missing.join(', ') : ''}`);
}
console.log(`${errors} errors, ${warnings} warnings`);
process.exit(errors ? 1 : 0);
