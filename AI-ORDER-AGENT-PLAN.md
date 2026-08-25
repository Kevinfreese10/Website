# AI Order Management Agent — Full Build Plan

**Prepared for:** Kevin Freese, My Accountant (Pty) Ltd
**Date:** 24 August 2026
**Status:** Approved 24 Aug. Phases 0–5 built 24–25 Aug (see §13 and `AI-ORDER-AGENT-RUNBOOK.md`). Not yet switched on.
**Decisions already taken (24 Aug):** full scope including portal filing · runs inside the myacc app (Genkit/Gemini + Firestore) · draft-only on day one, Kevin approves everything · this document lives in the repo.

---

## 1. The short version

You sell 71 services. Every one of them is, operationally, the same loop:

> collect the right documents from the right person → check them → prepare something (a form, a letter, a submission pack, a return) → send it somewhere (a regulator's portal, a regulator's inbox, or the client) → wait for the regulator → deliver the proof to the client → close.

What differs per service is *what* gets prepared and *where* it goes. There are exactly three delivery channels across the whole catalogue:

| Channel | What it means | Services (approx.) | Example |
|---|---|---|---|
| **PORTAL** | A human-style login to a government web portal and a form submitted there | 56 | Company registration on CIPC e-Services; ITR12 on SARS eFiling; CSD; CIDB; uFiling |
| **EMAIL** | A pack of prepared documents emailed (or uploaded) to a regulator's mailbox, then tracked by reply | 7 | NCR registration (Form 2 pack); COIDA Nature of Business change (CF-1B pack); PBO application to the SARS Tax Exemption Unit |
| **DOCUMENT** | The deliverable *is* a document we prepare and sign — nothing is filed anywhere | 9 | Accountant's Letter; B-BBEE affidavit; Share certificate; AFS; Management accounts |

Many services use more than one channel (a company registration is PORTAL for CIPC, then DOCUMENT for the share certificate, then PORTAL again for the tax number). Section 4 has the full 71-row classification.

So the agent is built as **one engine and three channel adapters**, not as 71 separate automations. The engine walks each order through a written playbook for its service; the adapters know how to draft a document, how to send and track an email submission, and how to drive a browser through a portal. Your job becomes approving what the agent has prepared, and supplying one-time passwords when portals ask for them.

**What changed since the 22 August plan.** That plan stopped at "prepare everything, Kevin files." You've asked to go further and have the agent log in and submit. That's buildable, and this plan covers it, but it is the riskiest part and it goes last: portals change without notice, they use OTPs and CAPTCHAs, and a wrong statutory submission is expensive to unwind. The plan therefore builds the portal runner in "drive to the last click, Kevin presses submit" mode first, and only lets it press submit itself per service, per form, after it has earned that right.

**The thing that must still happen first:** written procedures. Not one of the 71 services has a fulfilment checklist recorded (Section 3.3). An agent with no procedure guesses, which is exactly what the deleted v1 did. Section 5 is the bulk of the real work and most of what I need from you.

---

## 2. Principles the whole design follows

1. **The AI reads and drafts. Code decides. You approve.** Gemini extracts facts from documents and drafts letters, emails and form field values. Deterministic code decides whether a document passes, whether a step may proceed, and whether an order may complete. You approve anything a client or a regulator will see.
2. **One engine, three adapters.** Nothing is written per service except its playbook (data, not code).
3. **Nothing goes live without an approved playbook.** A service without an approved playbook stays fully manual, exactly as today.
4. **Every action goes through the existing audited server actions** (`transitionOrderStatusAtomic`, `reviewOrderDocumentAtomic`, note posting). The agent never gets a direct database handle to bypass guardrails.
5. **Prepare-to-the-last-click before auto-submit.** Portal and email submissions are staged and shown to you; the agent presses "submit" itself only after promotion (Section 8).
6. **Every proposal is recorded with what you did to it** (accepted / edited / rejected). That accept rate is the only thing that unlocks autonomy.
7. **Client comms live in Communication History** (`orders/{id}.notes`), never as loose emails. Regulator comms are logged on the order too.

---

## 3. What exists today (verified in the repo, 24 Aug)

### 3.1 Foundations to build on

| What | Where | Why it matters |
|---|---|---|
| Order state machine with completion guardrails | `src/app/actions/order-admin-actions.ts` → `transitionOrderStatusAtomic` (line 76) | Refuses to complete an order with pending documents, incomplete prerequisites or unfinished checklist steps. The agent goes *through* this, never around it. |
| Document review, custom document requests, dependency linking | same file → `reviewOrderDocumentAtomic`, `requestCustomDocumentAtomic`, `linkOrderDependencyAtomic` | The agent's writes reuse these. |
| Client-facing order emails | `src/app/actions/order-actions.ts` → `sendDocumentRequestEmailAction`, `sendReviewRequestEmailAction`, `sendOrderStatusUpdateEmailAction` | Already templated and logged to `notes`. |
| Client upload + questionnaire sync | `src/app/actions/client-order-actions.ts` → `submitClientDocumentUploadAction`, `syncClientQuestionnaireAction` | The natural trigger point for automatic document checks. |
| SMTP transport | `src/lib/email.ts` → `sendEmail` (mail.myacc.co.za:465, per-sender overrides) | Reused by the EMAIL adapter. `imap-simple` is already a dependency (used in `master-tasks-actions.ts`) — reusable for reading regulator replies. |
| Genkit + Gemini | `src/ai/genkit.ts` (`gemini-3.5-flash-lite`), 25 working flows in `src/ai/flows/` | The extraction flows (`extract-statement-data.ts` etc.) are the pattern to copy: facts in, structured JSON out, no verdicts. |
| Data model for procedures | `src/lib/types.ts` → `FulfillmentStep` (line 128), `FulfillmentStepType` (line 50), `OrderChecklistItem` (359), `OrderServiceSnapshot` (379), `GeneratedDocumentDraft`, `AIOrderFulfillmentAdvice` | The shape is right and the step types (`doc_verification`, `document_drafting`, `external_filing`, `internal_calc`, `manual`, `signoff`) map cleanly onto the three channels. It's just empty. |
| Order snapshots at checkout | `src/app/actions/checkout-core.ts` (lines ~212–232) | Every order freezes the service's requirements and checklist at purchase. Correct design. |
| Entity vs. ordering-contact resolution | `src/lib/service-utils.ts` → `resolveOrderEntityContext` | The fix for the order #10135 problem (NCR registration belongs to FIRST BLOOM FINANCE, not the person who placed the order). |
| Standard requirement presets with `aiHint`s | `src/lib/service-presets.ts` | ~20 well-written hints (e.g. "Do NOT treat a bank statement as a KYC confirmation letter"). Seed material for the playbooks. |
| PDF templates and signature assets | `public/templates/` — `NCR_Form_2_Fillable.pdf`, `NCR_Annexure_Confirmation_of_Fees_Fillable.pdf`, `Affidavit-EME-Gen.pdf`, `Share_Certificate_Professional.pdf`, `Signature_Kevin_New.png` | `pdf-lib` and `@react-pdf/renderer` are installed. `scripts/generate_share_certificate.js` and the `scratch/*_audit` folders show working one-off generators for NCR Form 2, BEE affidavits, POAs, accountant's letters. |
| Daily cron + secret | `src/app/api/cron/daily/route.ts` (SLA breach, deadlines, digests) | The scheduler pattern to extend. |
| Skills and agent notes | `.agents/skills/order-fulfillment-agent`, `.agents/skills/order-audit-and-document-generator`, `.claude/agents/order-manager.md` | Contain real domain rules (CF-1B layout, accountant's letter signature block, NCR prerequisites). Fold into playbooks. |
| Headless browser | `playwright-core` is in `devDependencies`; Chromium available in the build image | Basis for the PORTAL adapter. |

### 3.2 What was deleted and is not coming back as-is

Commit `aba0cdd2` (21 Aug) removed v1: `order-fulfillment-pipeline.ts`, `order-fulfillment-tools.ts`, `template-generators.ts`, `verify-order-document.ts`, `analyze-order-fulfillment.ts`, the checklist editor in `ServiceForm.tsx`. `src/lib/ai/` and `src/lib/pdf/` are now empty directories. The skills in `.agents/skills/` still reference those files — they'll fail at import until rebuilt. Sections 6–7 rebuild the *useful* parts on a sounder footing.

### 3.3 The gaps

- **0 of 71 services has a fulfilment checklist.** Every order falls back to `DEFAULT_FULFILLMENT_CHECKLIST` in `service-utils.ts` — four generic steps that describe nothing in particular.
- **214 document requirement rows, 0 with a stable ID, 0 with a required flag, ~0 with an `aiHint`** (catalogue export `scratch/services-audit-raw.json`, June 2026 — stale but indicative).
- **No editor.** `ServiceForm.tsx` has no UI for `fulfillmentChecklist` or `aiHint`. `aiHint` is in the validation schema and never rendered.
- **Checkout drops agent fields.** `checkout-core.ts` copies `title`, `description`, `type` from each step into the order checklist but not `aiInstructions` or `templateIds`.
- **Cron checks the wrong statuses.** `api/cron/daily` looks for `'In Progress'` and `'Waiting for Client'`; the real union is `'Processing'` / `'Waiting on Customer'`. The SLA breach check has therefore never fired. Small fix, worth doing in Phase 0.
- **No credential vault.** Client eFiling / CSD / CIDB passwords are collected as plain `text` requirements. A portal runner needs them encrypted at rest (`src/lib/encryption.ts` exists and is used for Gemini keys — extend it).
- **No inbound email.** Regulator replies (NCR acknowledgements, CF-1B confirmations, SARS letters) land in a mailbox no system reads.

---

## 4. The products, classified by how they're fulfilled

I read all 71 service definitions (`description`, `whatsIncluded`, `clientRequirements`, `informationToProvide`). The table below is what the agent will actually need to know: where the work goes, what we prepare, and what comes back as proof. **Rows marked ⚠ are my best understanding of the process and need your correction** — I have not done these filings and the regulators' channels change.

Legend — **P** portal login · **E** emailed pack · **D** document we produce · **C** internal calculation/compilation · **W** long external wait, needs follow-up.

### 4.1 CIPC — company secretarial (16 services)

All go through CIPC e-Services (customer code + password) or BizPortal. Proof back is a CoR certificate or a status change on the register.

| Service | Price | Channel | We prepare | Filed where | Proof back |
|---|---|---|---|---|---|
| Private Company Registration | 650 | P + D | Name reservation (CoR9.1), CoR14.1/14.1A, MOI (CoR15.1A), share certificate, director resolution | CIPC e-Services / BizPortal | CoR14.3, MOI, SARS tax number |
| Tender Ready Company Registration Package | 1600 | P + D + P | As above + share certificate + BEE affidavit template + tax clearance PIN (eFiling) | CIPC then SARS eFiling | CoR14.3, TCS PIN, certificate, affidavit |
| Non-Profit Company Registration | 950 | P + D | Name reservation, NPC MOI (CoR15.1C-ish, tailored), director details | CIPC | CoR14.3 |
| Personal Liability Company Registration | 1600 | P + D | Name reservation, custom MOI (Inc.) | CIPC | CoR14.3 |
| External Company Registration | 1950 | P + D | CoR20.1, certified foreign founding docs, POA, local office details | CIPC | CoR20.1 registration |
| Co-operative Society | 1400 | P + D ⚠ | Founding statement, constitution, CR1 forms | CIPC (co-ops registry) | Registration certificate |
| Add Director | 750 | P | CoR39, director consent | CIPC | Updated CoR39 confirmation |
| Remove Director | 650 | P + D | CoR39, resignation letter / resolution | CIPC | Updated register |
| Director Amendment | 650 | P | CoR39 | CIPC | Updated register |
| Company Name Change | 650 | P + D + W | CoR9.1 reservation, CoR15.2 amendment, special resolution | CIPC | CoR14.3 with new name |
| Company Address Change | 550 | P | CoR21.1 | CIPC | Updated CoR14.3 |
| Beneficial Ownership Declaration | 550 | P + D | BO register, security register, CoR-BO filing with certified IDs | CIPC BO portal | Filing confirmation |
| Annual Returns | 450 | P + C | Turnover-based fee calc, AR filing (+ BO declaration is now required with it) | CIPC | AR certificate |
| CIPC Annual Fees | 100 | P + C | Fee calc, payment on behalf | CIPC | Payment receipt |
| Company Reinstatement | 700 | P + D + W | CoR40.5, affidavit, deed search, outstanding ARs, R200 fee | CIPC | Reinstatement confirmation |
| CIPC Company Deregistration | 1150 | P + E + D + W | CoR40.1 request letter on letterhead, tax clearance, director IDs | CIPC (deregistration is emailed to deregistrations@cipc.co.za in practice ⚠) | Deregistration notice |

### 4.2 SARS eFiling — returns, registrations and customs (29 services)

All via SARS eFiling (client login shared with us, or our practitioner profile after tax-rep appointment). eFiling sends an **OTP** to the taxpayer's cell/email on login from a new device and on sensitive changes — the agent cannot get past this alone (Section 6.4).

| Service | Price | Channel | We prepare | Proof back |
|---|---|---|---|---|
| Individual ITR12 Simple | 550 | P | Return from IRP5/IT3 auto-populated data | ITA34 assessment |
| Complex Individual ITR12 (×2 listings, 750 / 950) | | P + C | Return incl. rental, CGT, foreign, logbook | ITA34 |
| Sole Proprietor ITR12 (×2 listings, 2500 / 2950) | | C + P | Income statement from bank statements/invoices, then return | ITA34 |
| ITR14 Company (Trading) | 650 | C + P | Tax computation from AFS, return | ITA34 |
| ITR14 Company (Nil) | 350 | P | Nil return | ITA34 |
| IRP6 Provisional (Trading, ×2 listings 350 / 450) | | C + P | Estimate, IRP6 | Submission confirmation |
| IRP6 Provisional (Nil) | 200 | P | Nil IRP6 | Confirmation |
| VAT201 (Trading) | 350 | P | Return from client's figures (calc excluded) | Confirmation |
| Periodic VAT Calculation and Submission | 1500 | C + P | Input/output VAT calc from records, VAT201 | Confirmation |
| VAT201 (Nil) | 200 | P | Nil return | Confirmation |
| EMP201 (Trading) | 350 | C + P | PAYE/UIF/SDL calc, EMP201 | Confirmation |
| EMP201 (Nil) | 200 | P | Nil EMP201 | Confirmation |
| EMP501 Annual Reconciliation (Trading) | 550 | C + P | Reconciliation, IRP5/IT3(a) generation (e@syFile or eFiling) | Confirmation + certificates |
| EMP501 (Nil) | 200 | P | Nil reconciliation | Confirmation |
| Tax Clearance Certificate | 350 | P | TCS request (tender / good standing) | TCS PIN |
| Tax Representative Appointment | 1500 | P + D + W | Registered representative request with certified IDs, CoR14.3, POA; SARS verification | Confirmation letter |
| PAYE Registration | 750 | P | Registration via eFiling "Register for PAYE" | PAYE reference |
| VAT Registration | 1400 | P + D + W | VAT101 via eFiling, invoices proving R120k / R1m threshold, bank confirmation, proof of address; SARS may call for interview | VAT103 notice |
| VAT Deregistration | 1000 | P + W | VAT123e, final returns | Confirmation |
| Tax Directive Application | 550 | P + D | IRP3 directive application with source docs | Directive |
| Remission of SARS Interest and Penalties | 1200 | D + P | Written motivation letter, RFR (Request for Remission) on eFiling | Outcome letter |
| Import Licence (customs code) | 950 | P + D + W | RLA (Registration, Licensing & Accreditation) application, DA185 equivalents, cell-number confirmation affidavit | Customs client number |
| Export Licence | 950 | P + D + W | As above | Customs client number |
| Clearing Agent Licence | 1150 | P + D + W | RLA application, bond/security details | Licence |
| Remover of Goods in Bond Licence | 1200 | P + D + W | RLA application, vehicle/premises details, surety | Licence |
| PBO Registration | 1800 | E + D + W ⚠ | EI1 application, founding docs, written motivation — submitted to the Tax Exemption Unit (teu@sars.gov.za) or via eFiling | PBO approval letter, s18A |

### 4.3 Department of Employment & Labour — COIDA / UIF (6 services)

| Service | Price | Channel | We prepare | Filed where | Proof back |
|---|---|---|---|---|---|
| COIDA Registration | 1400 | P + D ⚠ | W.As.2 registration, CoR14.3, IDs, bank proof, payroll estimate | CF-Filing online portal | Registration number |
| COIDA Renewal (Return of Earnings) | 600 | P + C | ROE (W.As.8) from payroll/AFS, or nil declaration | CF-Filing / ROE portal | Assessment + Letter of Good Standing |
| COIDA Nature of Business Change | 1400 | E + D + W | Form CF-1B (3 pages), Special POA, instruction letter on client letterhead, photos, AFS | Emailed to Compensation Fund | Reclassification confirmation |
| UIF Registration | 1200 | P + D + W ⚠ | UI-8 / UI-19, employee details | uFiling | UIF reference |
| Copy of UIF Registration | 1200 | E + W ⚠ | Request letter + IDs | Emailed to UIF | Copy of registration |
| NBC Provident Fund Company Registration | 550 | E + D ⚠ | Bargaining council registration forms, employee list | Emailed to the bargaining council | Confirmation |

### 4.4 NCR, CIDB, CSD, NHBRC, NCCA, DSD (11 services)

| Service | Price | Channel | We prepare | Filed where | Proof back |
|---|---|---|---|---|---|
| NCR Registration | 1400 | E + D + W (60–90 days) | Form 2 (fillable PDF exists), Annexure confirmation of fees, accounting officer appointment letter, R1,800 fee proof, criminal clearances, TCS | Emailed to NCR registrations inbox | NCRCP number + certificate |
| NCR Form 39 Annual Compliance | 1800 | P + C ⚠ | Form 39 from AFS and loan book | NCR online portal | Submission confirmation |
| NCR Form 40 Application & Compliance | 1950 | P + C ⚠ | Form 40 from loan book | NCR portal | Confirmation |
| CIDB Registration | 1150 | P + D | Application, AFS/management accounts, project proof, TCS PIN, 1 class of works | CIDB portal (CRS) | CIDB certificate + CRS number |
| CIDB Annual Renewal | 650 | P | Renewal with current AFS, TCS | CIDB portal | Renewed certificate |
| CIDB Upgrades (Grades 2–9) | 1800 | P + C + D | Grade calc from turnover/available capital, completion certificates, letters of award | CIDB portal | Upgraded certificate |
| CSD Registration | 950 | P | Supplier profile, bank details, TCS, B-BBEE, commodities | csd.gov.za | CSD registration report + MAAA number |
| CSD Profile Updates | 550 | P | Profile edits, doc uploads | csd.gov.za | Updated report |
| NHBRC Registration | 850 | P + D + W ⚠ | Application, IDs, TCS, bank details, proof of address | NHBRC online portal | NHBRC certificate |
| NCCA Registration Services | 1900 | E + D + W ⚠ | Application pack with COIDA LOGS etc. | Emailed ⚠ (please confirm which body "NCCA" is — the catalogue is ambiguous) | Certificate |
| NPO Registration (DSD) | 1200 | P + D + W (90 days) | NPO application, constitution/MOI, office bearers | DSD NPO online portal | NPO certificate |

### 4.5 Accounting deliverables — nothing is filed (9 services)

| Service | Price | Channel | We produce | Signed by |
|---|---|---|---|---|
| Accountant's Letter | 950 | C + D | Letter on letterhead (income confirmation etc.), inflow reconciliation from bank statements | Kevin, CBA(SA) #3561 |
| BEE Certificate (EME affidavit) | 450 | D | Sworn affidavit on dtic template with turnover and ownership %, commissioned | Client + Commissioner of Oaths |
| Share Certificate | 350 | D | Certificate from template, register entry | Director(s) |
| Share Register | 750 | D | Securities register + certificates | Director(s) |
| Annual Financial Statements (Draft & Sign Off) | 3000 | C + D | AFS compiled from TB/GL in the AI Accountant module | Kevin + directors |
| AFS (Non-VAT registered) | 5000 | C + D | Full compilation | Kevin + directors |
| AFS (VAT registered) | 7500 | C + D | Full compilation | Kevin + directors |
| Management Accounts | 5000 | C + D | Periodic P&L, balance sheet, cash flow, KPIs | Kevin |
| BEI Setup & Demonstration | 4950 | manual | Configuration + live demo session | — |

### 4.6 What the classification tells us

- **56 services touch a portal**, but only about six distinct portals: CIPC e-Services/BizPortal, SARS eFiling (incl. RLA), CF-Filing/uFiling, CIDB CRS, CSD, and the NCR/NHBRC/DSD portals. Six portal drivers cover the catalogue.
- **Every portal service also has a DOCUMENT component** (certified IDs, resolutions, POA, letters) — the DOCUMENT adapter is needed by everything, so it's built first.
- **Seven services are EMAIL-only submissions** and they're the long-wait, high-value ones (NCR, COIDA CF-1B, PBO). Tracking regulator replies matters most here.
- **Sixteen services need an accounting calculation first** (AFS, tax computations, VAT/PAYE, CIDB grade). Those pull from the existing AI Accountant / AI Payroll modules rather than from a new engine.
- **Three prerequisites recur everywhere:** a certified ID not older than 3 months, proof of address not older than 3 months, and an active tax representative / good tax compliance status. These deserve first-class treatment in the rules engine (validity windows, "whose name", certification checks).

---

## 5. The playbook layer — the real work

A **playbook** is the written procedure for one service. It's data in Firestore (`servicePlaybooks/{serviceId}`), edited in the admin UI, versioned, and stamped `approvedBy / approvedAt`. An order snapshots the approved playbook version at checkout (extending the existing `serviceSnapshots` pattern) so later edits don't rewrite in-flight orders.

### 5.1 What a playbook contains

```
Playbook
├── entity                 who the service is FOR: company | individual | either
├── requirements[]         what the client must supply
│     id · label · helpText · required · type (pdf/image/text/…)
│     documentKind         from a fixed list: sa_id, passport, proof_of_address, cor14_3,
│                          bank_confirmation, bank_statement, tcs_pin, afs, payslip, …
│     inNameOf             entity | director | either
│     maxAgeDays           e.g. 90 for certified IDs and proof of address
│     mustBeCertified      true/false
│     alternatives[]       passport for sa_id; lease for utility bill
│     aiHint               what a valid one looks like (free text, feeds extraction)
├── prerequisites[]        other services / states that must exist first
│     e.g. "active tax representative", "TCS in good standing", "already CIDB-registered"
├── steps[]                ordered; each is one of:
│     collect              wait for requirements (agent chases)
│     verify               run layers 1–3 on a requirement (Section 6.2)
│     calculate            pull from AI Accountant / AI Payroll (tax comp, VAT, ROE, grade)
│     draft_document       templateId + field mapping → PDF (DOCUMENT adapter)
│     draft_client_message purpose (chase / acknowledge / deliver / query)
│     email_submission     to · subject template · attachments (which drafts) · expectedReply
│     portal_filing        portalId · formId · field mapping · submitMode (stage | auto)
│     wait_external        expected days · follow-up cadence · what counts as "done"
│     deliver              which artefacts go to the client and how
│     signoff              who: kevin | staff role
│     each step: owner (agent | kevin | staff), doneCriteria, estimatedDays
├── outputs[]              what the client receives: cor14_3, tcs_pin, certificate, letter …
├── commonFailures[]       the 3–4 reasons this order usually bounces
└── approval               approvedBy · approvedAt · version · notes
```

The existing `FulfillmentStep` / `FulfillmentStepType` types are kept and extended (`email_submission`, `portal_filing`, `wait_external`, `deliver`, `collect`, `calculate` added to the union) so nothing downstream breaks.

### 5.2 How the 71 get written

1. **I draft all 71** from the catalogue, `service-presets.ts`, the existing skills (which already hold the CF-1B, NCR Form 2 and accountant's letter rules), and the `scratch/order_*_audit` folders (real completed orders #10036, #10072, #10102, #10135, #10138, #10139, #10143).
2. Drafts are written as JSON seed files in `src/lib/playbooks/seeds/*.json`, one per service, committed to git, and loaded to Firestore by a script. That keeps them reviewable in a pull request and diffable over time.
3. **You review in volume order.** ~10 minutes per service, ~12 hours total. Section 9 asks for the order-volume query that sets the sequence.
4. Nothing drives automation until `approvedAt` is set. Unapproved playbooks are visible in the UI as "DRAFT — not in use".

**Honest risk:** I can write a procedure that reads well and is wrong, because I haven't done these filings. A plausible wrong playbook is worse than an obviously incomplete one. That's why rows marked ⚠ in Section 4 exist and why approval isn't optional.

---

## 6. Architecture

Everything runs inside the existing Next.js app on Firebase App Hosting, with one addition: a separate long-running **worker** for browser automation, because Cloud Run request handlers (60s–ish, 512 MiB per `apphosting.yaml`) can't host a Chromium session filing a company.

```
                         ┌──────────────────────────────────────────────┐
  Triggers               │  ORCHESTRATOR  (Genkit flow, src/ai/agent/)   │
  ─ order paid           │                                              │
  ─ document uploaded ──►│  load order + snapshot playbook              │
  ─ regulator email in   │  find current step → is it automatable?      │
  ─ hourly cron          │  yes → run adapter → record result           │
  ─ Kevin: "run order N" │  needs approval → write PROPOSAL             │
                         │  blocked → set fulfillmentStatus, explain    │
                         └──────┬───────────────┬────────────┬─────────┘
                                │               │            │
                    ┌───────────▼───┐   ┌───────▼──────┐  ┌──▼──────────────┐
                    │ DOCUMENT      │   │ EMAIL        │  │ PORTAL          │
                    │ adapter       │   │ adapter      │  │ adapter         │
                    │ pdf-lib +     │   │ nodemailer   │  │ Playwright      │
                    │ react-pdf     │   │ outbox +     │  │ worker (Cloud   │
                    │ templates     │   │ IMAP inbox   │  │ Run job / VM)   │
                    └───────────────┘   └──────────────┘  └─────────────────┘
                                │               │            │
                         ┌──────▼───────────────▼────────────▼─────────┐
                         │  APPROVAL INBOX  /admin/agent                │
                         │  proposals · drafts · staged submissions     │
                         │  OTP requests · exceptions · accept-rate     │
                         └─────────────────────────────────────────────┘
                                             │
                         ┌───────────────────▼─────────────────────────┐
                         │  Existing audited actions                   │
                         │  transitionOrderStatusAtomic · review docs  │
                         │  post note · request document               │
                         └─────────────────────────────────────────────┘
```

### 6.1 Orchestrator (`src/ai/agent/orchestrator.ts`)

One Genkit flow, `runOrderAgent(orderId, trigger)`. It is deliberately boring:

1. Load the order, its playbook snapshot, uploads, notes, dependencies, and `resolveOrderEntityContext`.
2. Walk `steps[]` to the first step not `completed`/`skipped`.
3. Decide by step type and autonomy level (Section 8) whether to **execute**, **propose**, or **wait**.
4. Execute via the adapter; write results to the order (`checklist[]`, `generatedDrafts[]`, `auditLog[]`) through server actions.
5. Emit a `proposal` document (`agentProposals/`) for anything needing approval.
6. Set `fulfillmentStatus` and, when the playbook says so, the client-visible `status` via `transitionOrderStatusAtomic`.
7. Log everything: what was read, what was written, which model, token cost.

Gemini is only called inside steps (extraction, drafting), never to choose the next step. The next step is the playbook's next step.

Triggers: `submitClientDocumentUploadAction` and `syncClientQuestionnaireAction` (after write), PayFast ITN success (`api/payfast/notify`), a new `api/cron/agent-tick` (hourly, replaces the ad-hoc `scripts/auto_followup_pending_orders.js`), the IMAP poller on regulator replies, and a "Run agent" button on the order page.

### 6.2 Verification — layers 1–3 (unchanged from the 22 Aug plan, kept because it's right)

| Layer | What | AI? | Runs |
|---|---|---|---|
| 1 Mechanical | opens, not empty, not password-protected, MIME matches, size, duplicate hash, SA ID checksum, CIPC number format, phone/email format, every required item supplied | No | Instantly on upload; client told immediately |
| 2 Extraction | `documentKind` (from the fixed list), names, ID/reg numbers, dates, presence of stamp/signature/certification, page count, legibility — **facts with confidence, never verdicts** | Gemini (`src/ai/flows/extract-order-document.ts`) | On upload, internal |
| 3 Rules | compare facts to the playbook requirement: right kind? right name (`inNameOf` vs resolved entity)? within `maxAgeDays` of *today*? certified if required? → `pass` / `fail(reason)` / `needs_human(reason)` | No, pure TS, unit-tested | Automatically; regression test for #10135 |

Confidence never routes a decision. Ambiguity goes to you.

### 6.3 DOCUMENT adapter (`src/lib/documents/`)

- **Template registry** (`templates/index.ts`): one entry per statutory/letter template with `templateId`, source file in `public/templates/`, field schema (zod), renderer (`pdf-lib` fill for official fillable forms; `@react-pdf/renderer` for letterhead documents), single-page rule, signature policy (Kevin digital signature / client wet signature / commissioner stamp box).
- **Initial templates** (all already exist as one-offs in `scratch/` or the skills, so this is consolidation, not invention): Accountant's Letter (income confirmation), Special Power of Attorney, Director/Shareholder Resolution, Share Certificate, Securities Register, B-BBEE EME Affidavit, NCR Form 2 + Annexure, COIDA Form CF-1B, Deregistration request letter, Instruction letter on client letterhead, SARS remission motivation letter, Tax representative appointment cover letter.
- **Field mapping** comes from the playbook step; values come from the order's resolved entity + extracted facts + questionnaire answers. Gemini drafts only free-text paragraphs (letters, motivations); every structured field is filled by code.
- Output is uploaded to Storage under `orders/{id}/drafts/` and recorded in `generatedDrafts[]` with `status: 'draft'` until you approve. Approval flips it to `approved` and (optionally) posts it to Communication History for the client to sign.
- **Signature rule:** a document carrying Kevin's signature image is never generated without a proposal; the signature is applied at approval time, not at draft time.

### 6.4 PORTAL adapter — the hard one (`worker/portal-runner/`)

**Runtime.** A separate Node service (Cloud Run *job* or a small always-on VM) running `playwright-core` + Chromium, pulling jobs from a Firestore queue (`portalJobs/`). It is not inside the Next.js request path. It writes screenshots and a step log to Storage on every action so you can see exactly what it did.

**Portal drivers** (`drivers/cipc.ts`, `drivers/efiling.ts`, `drivers/cfFiling.ts`, `drivers/cidb.ts`, `drivers/csd.ts`, later `ncr.ts`, `nhbrc.ts`, `dsd.ts`). Each driver exposes named *procedures* (`cipc.fileCoR39`, `cipc.registerPrivateCompany`, `efiling.submitNilReturn(type)`, `efiling.requestTCS`, …) and each procedure has two modes:

- **`stage`** — log in, navigate, fill every field, stop *before* the final submit, screenshot the review page, park the browser session, and raise a proposal. You open the approval inbox, see the screenshots and field values, and click **Submit** — the worker then presses the button and captures the confirmation/reference number. If you don't act within a timeout the session is abandoned and re-runnable.
- **`auto`** — same, but the worker presses submit itself. Only reachable after promotion (Section 8), per procedure.

**Credentials.** Client portal passwords are collected today as plain `text` requirements. New: a `credentials` sub-collection per order/client, encrypted with `src/lib/encryption.ts` (already used for Gemini keys), decrypted only inside the worker, never returned to the browser UI, and rotated/deleted on order completion where the playbook says so. Firm-level credentials (our CIPC customer code, practitioner eFiling profile) live in Secret Manager.

**OTPs and CAPTCHAs — the honest constraint.** SARS eFiling sends an OTP to the taxpayer's cell/email on new-device login; CIPC and CSD can too; some portals show CAPTCHAs. The worker cannot get past these alone. Design:

- **OTP relay:** the worker pauses, writes an `otpRequest` on the job, and you (or the client, via a link in Communication History if the playbook allows) type the code into the approval inbox or reply to a push notification. The worker resumes. Timeout 10 minutes, then the job fails cleanly.
- **Persistent browser profiles** per portal per firm login, so "new device" prompts happen once, not every run.
- **CAPTCHA:** no solving. If a CAPTCHA appears the job pauses for you to solve it via a live screenshot/click relay, or falls back to *hand-off mode*: the worker exports the fully-prepared field values and you complete it manually in your own browser (or in a Claude-in-Chrome session). Hand-off mode is also the fallback whenever a driver breaks because a portal changed.

**Terms of use.** Automated access may breach a portal's terms. You need to confirm you're comfortable with that per portal, and whether any offer a sanctioned channel (CIPC has an XBRL/eServices API programme for some filings; SARS has no third-party API for eFiling). Section 9 asks.

**Where the browser skill fits.** Until a driver exists for a portal, the agent still prepares everything (documents, field values, checklist) and the filing step is `manual` with a hand-off sheet. You — or a supervised Claude-in-Chrome session — does the clicks. This is how *all* 56 portal services work from Phase 2 onward, before any driver is written, which is why the plan delivers value before the risky part is built.

### 6.5 EMAIL adapter (`src/lib/agent/email-channel.ts`)

- **Outbox with approval.** `email_submission` steps create a proposal holding `to`, `subject`, body (Gemini-drafted from the playbook template, in your voice), and the approved draft PDFs as attachments. On approval it goes through `sendEmail` from a dedicated address (`submissions@myacc.co.za` or `winifred@` — your call) with a `Reply-To` and a subject tag `[MYACC-{orderId}]` so replies can be matched.
- **Inbox poller.** The hourly cron uses `imap-simple` (already installed) to read that mailbox, match `[MYACC-{orderId}]` or the regulator's reference number, attach the reply to the order (`notes`, `isInternal: true`) and advance the `wait_external` step. Unmatched mail goes to an "unmatched regulator mail" list in the inbox for you to link by hand.
- **Follow-up cadence** per playbook (e.g. NCR: follow up at 30, 60, 75 working days) drafted as proposals, not sent automatically until promoted.

### 6.6 Client communication

Unchanged policy: everything the client sees goes through Communication History. The agent drafts into `agentProposals` with `kind: 'client_message'`; approval posts the note (and sends the existing templated email via `sendDocumentRequestEmailAction` / `sendOrderStatusUpdateEmailAction` where applicable). Drafts are in your voice: plain South African English, name the document, say why, no deadline threats.

### 6.7 Approval inbox (`/admin/agent`)

The one new screen you'll live in.

- **Queue** of proposals across all orders, ranked: statutory deadline risk → OTP waiting (time-boxed) → staged submissions → drafts → chases. Each shows the order, the step, the evidence (extracted facts, screenshots, the draft), and three buttons: **Approve**, **Edit & approve**, **Reject (with reason)**.
- **Per-service autonomy panel**: accept rate per action type, promotion switches (Section 8).
- **Exceptions**: failed jobs, broken drivers, unmatched regulator mail, `needs_human` verifications.
- **Order page additions** (`/admin/orders/[id]`): playbook progress bar, "Run agent now", per-step evidence, proposal history. Partners never see agent internals (`stripInternalAiData` extended to new fields).

### 6.8 Data model additions (Firestore)

| Collection / field | Purpose |
|---|---|
| `servicePlaybooks/{serviceId}` | Approved procedures (Section 5.1), versioned |
| `orders/{id}.playbookSnapshot` | Frozen copy at checkout (alongside existing `serviceSnapshots`) |
| `orders/{id}.checklist[]` | Existing; now carries `aiInstructions`, `templateIds`, channel fields |
| `orders/{id}.generatedDrafts[]` | Existing type; now populated |
| `agentProposals/{id}` | kind · orderId · stepId · payload · status (pending/approved/edited/rejected) · decidedBy/At · editDistance |
| `portalJobs/{id}` | portal · procedure · mode · status · screenshots[] · otpRequest · result (reference number) |
| `agentRuns/{id}` | one per orchestrator invocation: trigger, reads, writes, model calls, cost, duration |
| `credentials/{orderId}/{portal}` | encrypted client portal logins |
| `regulatorMail/{id}` | parsed inbound mail, matched orderId or null |
| `autonomyPolicy/{serviceId}` | per action type: level, consecutiveAccepts, promotedAt/By |

Firestore rules: all new collections admin-only; `agentProposals` readable by assigned staff; nothing partner- or client-readable.

---

## 7. Build phases

Estimates are build effort for one engineer working with an AI assistant. Each phase ships something you can use.

### Phase 0 — Unblock the playbook layer (week 1)

- Extend `FulfillmentStepType` and add the playbook types in `src/lib/types.ts`.
- Rebuild the checklist/playbook editor in `ServiceForm.tsx` (deleted with v1) including `aiHint`, `inNameOf`, `maxAgeDays`, `mustBeCertified`, step channel fields, approval stamp.
- Fix `checkout-core.ts` to carry `aiInstructions`, `templateIds` and the playbook snapshot into orders.
- Rebuild `updateOrderChecklistItemAtomic` (staff-guarded) in `order-admin-actions.ts`.
- Fix the status names in `api/cron/daily`.
- Seed loader: `scripts/load-playbooks.ts` reads `src/lib/playbooks/seeds/*.json` → Firestore.
- **From you:** nothing yet. Review the screens.

### Phase 1 — Playbooks drafted + mechanical checks (weeks 1–3, overlaps Phase 0)

- I draft all 71 playbooks as seed JSON, busiest services first. You review at ~10 min each.
- Layer 1 mechanical checks (`src/lib/verification/mechanical.ts`), fully unit-tested, wired into `submitClientDocumentUploadAction`, with immediate client feedback.
- Encrypted `credentials` store replaces plain-text password requirements for eFiling/CSD/CIDB logins.
- **From you:** the order-volume query result (Section 9 #1); playbook review time; corrections on every ⚠ row.

### Phase 2 — Extraction, rules, orchestrator, approval inbox (weeks 3–5)

- `extract-order-document.ts` Genkit flow (facts only) and the Layer 3 rules engine with tests including the #10135 regression.
- Orchestrator flow, `agentRuns`, `agentProposals`, hourly `agent-tick` cron, triggers on upload/questionnaire/payment.
- `/admin/agent` approval inbox v1 (proposals, evidence, approve/edit/reject, accept-rate capture).
- Client-message drafting in your voice.
- **Value at end of Phase 2:** every order with an approved playbook is tracked step by step, documents are checked on upload, missing items are chased (with your approval), and you have one ranked queue instead of 71 mental checklists. All filing is still by hand — but the agent hands you a prepared sheet for each one.
- **From you:** ~20 real documents per common kind (ID, proof of address, bank confirmation, CoR14.3, TCS), *including rejected ones*, redacted as needed. Two weeks of daily use and feedback.

### Phase 3 — DOCUMENT adapter (weeks 5–7)

- Template registry and the twelve templates in 6.3, consolidated from `scratch/` and the skills. Signature-at-approval rule.
- `draft_document` steps live for: Accountant's Letter, Share Certificate/Register, B-BBEE affidavit, POA, resolutions, NCR Form 2 pack, CF-1B pack, deregistration and instruction letters.
- **Value:** the nine DOCUMENT-only services and the document halves of everything else are drafted automatically for your signature.
- **From you:** confirm each template against a recently accepted real one; sign-off wording.

### Phase 4 — EMAIL adapter (weeks 7–8)

- Outbox proposals, dedicated submissions mailbox, IMAP poller, reply matching, follow-up cadences.
- Live for NCR Registration, COIDA Nature of Business Change, PBO, Copy of UIF, NBC, NCCA, CIPC deregistration letter.
- **From you:** the mailbox and its IMAP/SMTP credentials; which address submissions go from; regulator inbox addresses you actually use.

### Phase 5 — PORTAL adapter, stage mode (weeks 8–13)

Built one portal at a time, in the order that covers the most orders. Each driver ships in `stage` mode only.

| Order | Driver | Procedures first | Why first |
|---|---|---|---|
| 1 | SARS eFiling | nil returns (VAT201/EMP201/IRP6/ITR14), TCS request, ITR12 simple | Highest volume, most repetitive, lowest judgement |
| 2 | CIPC e-Services | Annual return, CoR39 director changes, address change, BO declaration, name reservation | Second-highest volume; company registration end-to-end comes after the smaller filings prove the driver |
| 3 | CSD | registration, profile update | Simple, well-structured portal |
| 4 | CIDB CRS | renewal, registration, upgrade | Moderate |
| 5 | CF-Filing / uFiling | ROE, registration | Portals are brittle; last |
| later | NCR, NHBRC, DSD | on demand | Low volume, long waits |

Also in this phase: worker runtime, `portalJobs` queue, screenshot trail, OTP relay, persistent profiles, hand-off mode, driver health checks (a nightly login-only smoke test per portal that alerts you when a portal changed).

- **From you:** confirmation on portal terms-of-use (Section 9 #4); firm credentials into Secret Manager; you on the other end of OTP requests during the trial; a test company/taxpayer profile per portal if you have one.

### Phase 6 — Earning autonomy (ongoing from Phase 2)

Section 8. No build work beyond the promotion switches; this is an operating discipline.

### Phase 7 — Accounting-calculation steps (after Phase 5, sized separately)

`calculate` steps that pull tax computations, VAT201 figures, EMP201/ROE numbers and CIDB grade inputs from the AI Accountant and AI Payroll modules. These modules already exist; the work is the bridge and the sign-off flow. Deliberately last: they're the highest-judgement steps and the ones you're most likely to keep doing yourself anyway.

**Total to a working, draft-only agent with staged portal filing: roughly 13 weeks of build, plus ~12 hours of your playbook review and daily use.**

---

## 8. Autonomy — how the agent earns the right to act alone

Every proposal records what you did with it. Promotion is **per action type per service**, never global.

| Action type | Day-one level | Can be promoted to | Likely to earn it |
|---|---|---|---|
| Mechanical upload feedback ("this PDF won't open") | auto | — | already auto: near-zero risk |
| Document pass/fail on Layer 3 `pass`/`fail` | auto, internal only | client-visible rejection message | yes, quickly |
| Chase missing document | propose | auto | yes |
| Acknowledge upload / status update | propose | auto | yes |
| Draft letter / certificate / form | propose | — (always signed by a human) | never auto-signed |
| Email submission to regulator | propose (stage) | auto-send | maybe, per regulator |
| Regulator follow-up email | propose | auto | yes |
| Portal filing — nil returns, TCS, annual return | stage | auto-submit | eventually |
| Portal filing — registrations, director changes, VAT reg, deregistration | stage | stays stage | probably never |
| Move order to Completed / Cancelled / Pending Payment | never | never | — |
| Anything touching money | never | never | — |

**Promotion rule:** 50 consecutive proposals accepted *unedited* for that action type on that service, then you flip the switch by hand. Any rejection after promotion drops it straight back to propose/stage and tells you. If you accept mediocre drafts to save time the accept rate becomes meaningless — the system will promote something it shouldn't.

**Hard boundaries enforced in code** (server actions refuse, regardless of prompt): never completes/cancels an order; never touches totals, discounts, payouts, commissions or refunds; never deletes; never approves a document on its own; never applies Kevin's signature without an approved proposal; never submits on a portal in `auto` mode without an `autonomyPolicy` record saying so; always goes through `transitionOrderStatusAtomic`.

---

## 9. What I need from you

| # | What | When it blocks | Why |
|---|---|---|---|
| 1 | **Order volume by service, last 12 months.** `scripts/order_volume_by_service.js` already does exactly this; run it from the repo root with `.env.local` loaded and paste me the output. | Before drafting playbooks | Sets review order and the driver order in Phase 5. |
| 2 | **Corrections to every ⚠ row in Section 4**, and anything else I've got wrong about *where* a filing actually goes. Particularly: NCR channel, COIDA/UIF portals vs email, PBO, NCCA (which body?), co-operatives, CIPC deregistration. | Before drafting playbooks | The channel determines which adapter the step uses. |
| 3 | **2–3 completed orders per service** (or as many as you have) — order IDs are enough, I'll read them via a script you run. | Before drafting playbooks | Playbooks should reflect what you actually did, not the marketing copy. |
| 4 | **Portal terms of use and API options.** For CIPC, eFiling, CF-Filing/uFiling, CIDB, CSD, NCR, NHBRC, DSD: are you comfortable with automated browser access under your/your client's login? Does any offer a sanctioned API or bulk channel you have access to? | Before Phase 5 | Legal/relationship risk is yours to weigh. I'll build hand-off mode regardless. |
| 5 | **Real documents, good and bad** — ~20 per common kind including rejected ones. | Phase 2 | Rejected examples are the half I don't have. |
| 6 | **Mailbox for submissions** and its IMAP/SMTP details; which regulator addresses you use. | Phase 4 | EMAIL adapter. |
| 7 | **Gemini model appetite.** Currently `gemini-3.5-flash-lite`. Extraction from scanned IDs and bank letters will want the stronger `flash`/`pro` tier for that flow only. Cost per document is small; you decide. | Phase 2 | Cost/accuracy trade-off. |
| 8 | **Playbook review time** — ~12 hours spread over Phases 1–2. | Phase 1 | The bottleneck. No way round it. |
| 9 | **Confirm the never-automate list** in Section 8. | Before Phase 2 | You own that line. |

---

## 10. Risks and how they're handled

| Risk | Handling |
|---|---|
| A playbook I drafted is plausible and wrong | Nothing runs unapproved; approval stamped per service; ⚠ rows flagged for you explicitly. |
| Wrong statutory submission filed automatically | Portal filings ship in `stage` mode; auto-submit only after 50 clean accepts and a manual switch, and never for registrations/deregistrations. |
| Portal changes and the driver breaks | Nightly login smoke test alerts; driver fails closed into hand-off mode with the prepared field sheet — the order keeps moving, just by hand. |
| OTP/CAPTCHA blocks a run | Time-boxed relay to you; clean failure and re-run; never stored OTPs. |
| Client portal passwords leak | Encrypted at rest, decrypted only in the worker, never rendered in the UI, deleted per playbook on completion; firm creds in Secret Manager. |
| Portal terms of use breached | Your decision per portal (Section 9 #4); hand-off mode exists for any portal you exclude. |
| Model confidence looks trustworthy but isn't | Confidence never routes; Layer 3 is code; ambiguity → human. |
| Agent tells a client something wrong | Nothing client-facing without approval until promoted, per action type per service. |
| Agent works around a guardrail | Same server actions as a human; no direct DB writes from the orchestrator; hard boundaries in code. |
| Regulator reply missed | IMAP poller + subject tags + reference-number matching; unmatched mail surfaced daily. |
| Partners see agent internals | `stripInternalAiData` extended to all new fields; new collections admin-only in rules. |
| Kevin becomes the bottleneck again (approval fatigue) | Ranked queue, one-click approve, edit-in-place; promotion of the routine actions is the release valve. |
| Nobody notices drift | Accept rate per action type visible; drop auto-demotes. |

---

## 11. What this gets you, honestly

| Today | After Phase 2 | After Phase 5 |
|---|---|---|
| You check every uploaded document | Obvious problems caught in seconds; you see only judgement calls | same |
| Clients learn a document is wrong days later | Told at upload | same |
| Chasing is manual | Drafted for you; routine chases go automatic once promoted | same |
| No view of which orders are at risk | Ranked queue, deadline risk first | same |
| Procedures live in your head | Written, versioned, enforced per service | same |
| Letters, certificates, forms drafted by hand | (Phase 3) drafted automatically for your signature | same |
| Regulator email packs assembled by hand | (Phase 4) assembled and tracked; you press send | some auto-send |
| Every filing done by you, from scratch | Prepared sheet handed to you for every filing | Browser drives to the last click; you press submit; routine filings eventually submit themselves |

**Limits that stay true:** portals will break drivers and you'll do some filings by hand in those weeks; anything needing professional judgement (tax computations, VAT interviews, remission motivations) is drafted, not decided; setup is real — 13 weeks and 12 hours of your review; it will still be wrong sometimes, and the design is about making that visible and cheap, not impossible.

---

## 12. Recommended sequence

1. You answer §9 items 1–3 (about an hour) and confirm §9 #9.
2. Phase 0 — editable playbooks, checkout fix, cron fix (week 1).
3. Phase 1 — I draft 71 playbooks in volume order while you review; mechanical checks go live (weeks 1–3).
4. Phase 2 — extraction, rules, orchestrator, approval inbox (weeks 3–5). Two-week trial of daily use.
5. Phase 3 — DOCUMENT adapter (weeks 5–7).
6. Phase 4 — EMAIL adapter (weeks 7–8).
7. Phase 5 — PORTAL adapter in stage mode, eFiling first, then CIPC (weeks 8–13).
8. Phase 6 — promotions as earned. Phase 7 — calculation bridges, sized when we get there.



---

## 13. Implementation status (25 August 2026)

| Phase | Status | Notes |
|---|---|---|
| 0 Playbook layer | Built | Editor, approval stamp, checkout snapshot fix, cron status fix, seed loader |
| 1 Playbooks + mechanical checks | Built | 71 seeds drafted (140 ⚠ flags for Kevin), Layer 1 checks live on upload, credentials encrypted |
| 2 Extraction, rules, orchestrator, inbox | Built | #10135 regression test passes; 93 tests total |
| 3 DOCUMENT adapter | Built | 14 templates; signature only at approval; NCR Form 2 fills the official PDF |
| 4 EMAIL adapter | Built | Needs `SUBMISSIONS_*` env; refuses ⚠ placeholder addresses |
| 5 PORTAL adapter | Built, uncalibrated | Worker + eFiling/CIPC drivers in stage mode; selectors unverified against live portals |
| 6 Autonomy | Built | Counters + promotion switches; never for document approvals, status, OTP, staging, or non-promotable procedures |
| 7 Calculation bridges | Scoped | Computations currently live in React pages; extraction first (runbook §5) |

Deviations from the plan worth knowing: the plan's Phase 1 asked for order volume to sequence the playbook review — no volume data was available, so all 71 were drafted and the review order is Kevin's choice. The ⚠ rows in §4 remain unconfirmed and are carried into the seeds as ⚠ notes. Credentials are stored on the upload record (encrypted) rather than a separate `credentials` collection; the effect is the same and it needed no client-side change.
