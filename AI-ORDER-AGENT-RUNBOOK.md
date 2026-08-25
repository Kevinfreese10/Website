# AI Order Agent — Runbook

**For:** Kevin Freese, My Accountant
**Companion to:** `AI-ORDER-AGENT-PLAN.md` (the design). This is the operating manual: how to switch it on, in what order, what each screen means, and what to do when something is wrong.
**State on 25 August 2026:** Phases 0–5 built and typechecked; nothing switched on yet.

---

## 1. Go-live checklist, in order

Each step is safe to stop after. Nothing client-facing happens until step 6.

### Step 1 — Commit and deploy the code
```
npm run typecheck        # full project (the bridge could only check files in batches)
npm test                 # 93 tests
git add -A && git commit -m "AI order agent: phases 0-5"
```
Then rename `firestore.rules.phase5` over `firestore.rules` (Windows blocked that one write) and deploy rules:
```
firebase deploy --only firestore:rules
```
Deploy the app as usual.

### Step 2 — Environment variables (App Hosting)
| Variable | Purpose | Needed for |
|---|---|---|
| `ENCRYPTION_KEY` | already set — now also encrypts client portal passwords | Phase 1 |
| `CRON_SECRET` | already set — also guards `/api/cron/agent-tick` | Phase 2 |
| `AGENT_EXTRACTION_MODEL` | optional; e.g. `googleai/gemini-3.5-flash` for better ID/bank-letter reading. Default: site model (flash-lite) | Phase 2 |
| `SUBMISSIONS_EMAIL` | the from/reply-to address for regulator packs, e.g. `submissions@myacc.co.za` | Phase 4 |
| `SUBMISSIONS_IMAP_HOST` / `_PORT` / `_USER` / `_PASS` | poller for replies (port 993, TLS) | Phase 4 |
| `SUBMISSIONS_SMTP_HOST` / `_PORT` / `_USER` / `_PASS` | optional; only if that mailbox needs its own SMTP login | Phase 4 |

### Step 3 — Schedule the hourly tick
Cloud Scheduler → HTTP GET `https://<your-domain>/api/cron/agent-tick?limit=25` every hour, header `Authorization: Bearer <CRON_SECRET>`. It polls the submissions mailbox first, then runs the agent over the 25 least-recently-visited active orders. Each run of the daily cron stays as-is.

### Step 4 — Load the playbooks (as drafts)
From the repo root with `.env.local` loaded:
```
node scripts/validate-playbook-seeds.js      # must say 0 errors
node scripts/load-playbooks.js --dry-run
node scripts/load-playbooks.js               # writes all 71 as DRAFT
```
Optional but recommended first: `node scripts/order_volume_by_service.js` and review in that order.

### Step 5 — Review and approve playbooks
Admin → Manage Products → open a product → **Agent Playbook** tab.
- Read every step; fix anything marked ⚠ (there are ~140 across the 71 — mostly fee tables, form versions, and which mailbox/portal a filing actually goes to).
- Check the **Client Documents** tab: each row now has *document kind*, *in the name of*, *max age*, *certified*, and the AI hint. These drive the automatic checks.
- Click **Approve playbook**, then **Save**. The tab badge turns LIVE.
- Start with three or four services you sell most. A service without an approved playbook is untouched by the agent.

**Editing a step after approval clears the approval.** That's deliberate.

### Step 6 — First supervised run
Pick an active order for an approved service. Admin → **AI Order Agent** → type the order ID in the "run agent now" box → Run.
You'll get one or more cards. Nothing has happened yet; read them:
- **Document** cards: the agent's verdict on an upload with the evidence (click *Show evidence*). Approve, flip, edit, or reject.
- **Client message** cards: a chase in your voice. Edit freely; approving posts to Communication History and (if ticked) sends the standard document-request email and sets *Waiting on Customer*.
- **Hand-off** cards: a step the agent can't do yet. Do it, then approve to advance the playbook.
Upload a document to that order from the client dashboard: the mechanical check fires immediately (client sees a toast), and the agent re-runs after the response is sent.

### Step 7 — Documents (Phase 3)
No setup. When a playbook reaches a `draft_document` step the agent produces the drafts and a **Drafts** card with links. Unsigned drafts carry a DRAFT watermark. Approving signs the Kevin-signed ones and posts the files to the client. If a template can't be drafted the card lists exactly which fields are missing — that's the cue to add a questionnaire row to the playbook.
Smoke-test the templates any time: `npx tsx scripts/smoke-render-documents.ts` → `/tmp/docs-smoke/*.pdf`.

### Step 8 — Email submissions (Phase 4)
Needs step 2's `SUBMISSIONS_*` vars and a confirmed address in each `email_submission` step. The card refuses to send to a ⚠ placeholder; edit the address in. Approving sends with a `[MYACC-<order>]` tag; replies come back to the order automatically and appear on the **Regulator mail** tab (unmatched ones can be linked by order ID).

### Step 9 — Portal filings (Phase 5)
This is the only part that needs infrastructure outside the app.
1. Decide, per portal, that automated browser access under your login is acceptable to you (plan §9 #4).
2. Stand up the worker per `worker/portal-runner/DEPLOY.md` (a small VM is simplest). Give it the same `ENCRYPTION_KEY` as the app, the service-account key, and `CIPC_CUSTOMER_CODE` / `CIPC_PASSWORD`.
3. Run `npx tsx src/index.ts --health` once. The **Portal jobs** tab shows a green/red badge per portal.
4. First real job: a nil VAT201 on a client whose eFiling login you hold. Approve the *Queue* card → watch the Portal jobs tab → answer the *OTP* card within 10 minutes → review the screenshots on the *Press submit* card → Submit.
Expect the first run of each procedure to stop with a hand-off ("could not find …"): the portals' layouts were not verified from here. The screenshot shows where; the fix is a selector in `worker/portal-runner/src/drivers/*.ts`.

### Step 10 — Earning autonomy (Phase 6)
Nothing to build. The **Autonomy** tab counts consecutive unedited approvals per service per action type. At 50 a *Promote* button appears (admin only). Any later edit or rejection demotes automatically. Document approvals, status changes, OTPs, portal staging and non-promotable portal procedures never get a Promote button.
> Honest use matters: approving a mediocre draft to save time teaches the system that draft was fine.

---

## 2. The screens

**Admin → AI Order Agent** (`/admin/agent`)
| Tab | What it is |
|---|---|
| Queue | Everything pending, ranked: OTPs (95) › press-submit (80) › mechanical rejections (70) › rule rejections (65) › queue-portal (56) › chases (50+) › approvals (40). Red/amber left border = urgency. |
| Approved / Edited / Rejected | History with who decided and what executed. |
| Autonomy | Accept-rate counters and promotion switches. |
| Regulator mail | Inbound submissions-mailbox traffic; link unmatched mail. |
| Portal jobs | Every browser job with status, log tail, screenshots, re-queue; portal health badges. |

**Admin → Manage Products → Agent Playbook tab**: the procedure editor and approval stamp.

**Order page** (unchanged UI, new data): `checklist[]` steps now carry the agent's step config and complete automatically; `generatedDrafts[]`, `regulatorSubmissions[]`, `aiVerification` on uploads, `mechanicalCheck` on uploads, `lastAgentRunAt`.

---

## 3. What the agent will and won't do on its own

| It does automatically | It only proposes | It never does |
|---|---|---|
| Mechanical checks on every upload, with client feedback | Approve/reject a document | Complete, cancel or un-pay an order |
| Extract facts and run the rules engine | Post anything to Communication History | Touch totals, discounts, payouts, refunds |
| Complete `collect`/`verify`/`draft_document`/`email_submission`/`portal_filing` steps once their evidence exists | Send an email to a client or regulator | Delete anything |
| Record every run in `agentRuns` | Queue a browser job, press submit | Apply your signature without an approved draft |
| Poll the submissions mailbox and attach replies | Relay an OTP | Act on a service without an approved playbook |

---

## 4. When something is wrong

| Symptom | Where to look | Likely cause / fix |
|---|---|---|
| No cards appear after an upload | `agentRuns` (latest for the order) → `notes` | Playbook not approved for that service; or `after()` didn't run — the hourly tick will catch it |
| Card says "Needs a human" on a good document | Show evidence → NAME / AGE / KIND checks | Entity name not resolved on the order (add a "Company name" text requirement), or date mis-read (see facts.dates) |
| Chase drafted but the client already sent the file | Completeness uses requirement id/label matching | The upload's label doesn't match the playbook row — align labels in the playbook |
| Draft "missing X" | Drafts card | Add that questionnaire row to the playbook's requirements, or edit the field on re-draft (`draftOrderDocumentsAction` with overrides) |
| "Regulator address is unverified" | Playbook `email_submission` step → emailTo | Replace the placeholder; the ⚠ list is in the seed's aiInstructions |
| Portal job → `handoff: Could not find …` | Portal jobs tab → screenshot | Portal layout differs from the driver's selectors; adjust in `worker/portal-runner/src/drivers/`, re-queue |
| Portal job → `expired` | Portal jobs tab | OTP or submit decision not given in time; re-queue |
| Health badge red | Portal jobs tab | Login page changed or credentials wrong; nothing runs on that portal until green |
| Client sees `••••••••` for their password | Expected | Credentials are encrypted; staff reveal them on the order (audit-logged) |
| Promotion button greyed | Autonomy tab | Fewer than 50 consecutive unedited approvals, or the action type is never automated |

Logs: every run → `agentRuns/{id}` (reads, writes, model calls, notes); every proposal → `agentProposals/{id}` (payload, decision, execution result); every browser job → `portalJobs/{id}.log`.

---

## 5. Phase 7 — accounting-calculation bridges (scoped, not built)

**What it is:** `calculate` steps that pull the actual figures for trading returns and AFS: VAT201 input/output totals, EMP201 PAYE/UIF/SDL, the trial balance behind an ITR14 or a set of AFS, the turnover/available-capital inputs for a CIDB grade.

**What I found (25 Aug):** those figures are computed today *inside client-side React pages* — `admin/ai-accountant/[clientId]/reports/vat201/page.tsx` (484 lines, live `onSnapshot` over `aiAccountantClients/{clientId}/transactions`), `…/trial-balance/page.tsx` (676 lines) and `admin/ai-payroll/[clientId]/reports/emp201/page.tsx` (593 lines, over `aiPayrollClients/{clientId}/payslips`). There is no server module the agent can call, and an order carries no link to an AI Accountant / AI Payroll client.

**So Phase 7 is three pieces, in this order:**
1. **Extract the calculations** into pure, tested server functions (`src/lib/accounting/vat201.ts`, `trial-balance.ts`, `emp201.ts`) that take transactions/payslips as input and return the figures. The pages then call the same functions — one source of truth, and the numbers become unit-testable for the first time. ~1 week.
2. **Link orders to clients:** an `aiAccountantClientId` / `aiPayrollClientId` on the order (set at checkout when the customer is an existing client, or by staff on the order page). ~2 days.
3. **The `calculate` step:** the agent runs the function for the period on the step, produces a *calculation pack* (a new template, `tax_computation` / `vat_computation` / `payroll_computation`, already reserved in the registry) with the figures and their source counts, and proposes it for Kevin's review before the filing step. The figures are then available to the eFiling driver as inputs. ~1 week.

This stays draft-only permanently: a computation is signed off by you, never auto-filed.

---

## 6. Files map (what was added, by phase)

| Phase | Files |
|---|---|
| 0 | `types.ts` (playbook types), `components/admin/PlaybookEditor.tsx`, `ServiceForm.tsx` (Agent Playbook tab + verification fields), `checkout-core.ts`, `order-admin-actions.ts` (`updateOrderChecklistItemAtomic`), `api/cron/daily`, `scripts/load-playbooks.js`, `lib/playbooks/seeds/` |
| 1 | `lib/playbooks/seeds/*.json` (71), `scripts/validate-playbook-seeds.js`, `lib/verification/mechanical.ts` + tests, `run-upload-checks.ts`, `client-order-actions.ts`, `revealSecretUploadValueAtomic` |
| 2 | `ai/flows/extract-order-document.ts`, `lib/verification/facts.ts`, `rules.ts` + tests, `lib/agent/{types,orchestrator,drafting}.ts`, `actions/agent-actions.ts`, `api/cron/agent-tick`, `admin/agent/page.tsx`, rules, dashboard masking |
| 3 | `lib/documents/{types,helpers,registry,context,service}.ts`, `renderers/` (14), `scripts/smoke-render-documents.ts` |
| 4 | `lib/agent/email-channel.ts`, Regulator mail tab, `regulatorMail` collection |
| 5 | `lib/agent/{portal-registry,portal-channel}.ts`, Portal jobs tab, `worker/portal-runner/` (runtime, drivers, Dockerfile, DEPLOY.md) |
