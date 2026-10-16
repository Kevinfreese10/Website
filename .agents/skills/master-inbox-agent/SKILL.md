---
name: master-inbox-agent
description: Master Inbox Dispatcher & Orchestration Agent for My Accountant. Centrally ingests unread client emails across mailboxes, detects intent, filters spam, auto-replies to standard catalog inquiries, delegates active orders and statutory audits to /order-fulfillment-agent, routes quote drafting to /quote-generator, and coordinates isolated Antigravity worker subagents with a dual-channel executive approval queue (in-chat briefing + email to kev@thinkestry.co.za).
---

# Master Inbox Dispatcher & Orchestrator Agent

> [!IMPORTANT]
> **`info@myacc.co.za` is owned by the 24/7 cloud quote agent** (`/api/cron/quote-agent`, see `/quote-generator` §Cloud Agent). This skill must **not** poll, archive, move, flag or reply to anything in `info@`, and must not schedule against it. Doing so races the cloud agent and can double-reply to clients. Drafts the cloud agent couldn't send are at `/admin/quote-drafts` and in Telegram. This skill still covers `kev@thinkestry.co.za` and the order/subagent orchestration below.

The **Master Inbox Agent** is the single central orchestrator for **My Accountant**. It continuously monitors incoming correspondence, filters noise, executes low-risk standard tasks with full autonomy, and delegates complex client workflows to specialized worker subagents in isolated contexts.

---

## 🎯 Architecture & Operating Matrix

```
                      [Central Master Inbox]
                    (Forwarded from all inboxes)
                               │
                               ▼
                 ┌─────────────────────────────┐
                 │    Master Dispatcher Agent   │
                 │   (`master-inbox-agent`)     │
                 └──────────────┬──────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
  [Spam & Solicitations]  [Standard Catalog]      [Active Client / Order]
  Auto-archive silently    Auto-price reply &     Match Firestore order/thread
                           link to checkout                     │
                                                                ▼
                                                  ┌─────────────────────────────┐
                                                  │  Spawn Dedicated Subagent   │
                                                  │ (Isolated Context / Client) │
                                                  └──────────────┬──────────────┘
                                                                 │
                                ┌────────────────────────────────┴────────────────────────────┐
                                ▼                                                             ▼
                     Quote Generator Agent                                        Order Fulfillment Agent
                     (`/quote-generator`)                                       (`/order-fulfillment-agent`)
                    - Scopes retainer inquiry                                   - Audits KYC uploads (AI Vision)
                    - Prepares Section 200 pack                                 - Compiles statutory PDFs
                    - Formats 30-sec HTML proposal                              - Drafts clean portal note
                                │                                                             │
                                └────────────────────────────────┬────────────────────────────┘
                                                                 │
                                                                 ▼
                                               ┌───────────────────────────────────┐
                                               │    Consolidated Master Briefing   │
                                               │     & Executive Approval Gate     │
                                               └─────────────────┬─────────────────┘
                                                                 │
                                          ┌──────────────────────┴──────────────────────┐
                                          ▼                                             ▼
                            [Antigravity Chat Artifact]                   [Email to kev@thinkestry.co.za]
                            - Live approval action queue                  - Inline executive summary cards
                            - 1-click execution commands                  - For quick review while on mobile
```

---

## 🚦 Tiered Autonomy & Delegation Rules

| Category | Trigger / Detection | Delegated Worker / Agent | Autonomy Level | Action Taken |
|---|---|---|:---:|---|
| **Spam & Solicitations** | SEO pitches, crypto, offshore web design, cold marketing | Internal Regex & NLP Filter | **100% Autonomous** | Moves to `INBOX.Archive` or `Spam`; 0 notifications sent to Kevin. |
| **Fixed Catalog Inquiry** | Inquiry matches standard catalog services (Company Reg, CIDB, Tax PIN, etc.) | Cloud quote agent (`info@`) / `/quote-generator` (manual) | **Autonomous within the code gate** | Handled 24/7 by the cloud agent's strict rules (≤3 services, ≤R10,000, clean catalog prices). Do not duplicate from chat. |
| **Active Order Update / Uploads** | Subject has `#XXXXX` or sender matches open Firestore order | `/order-fulfillment-agent` | **Supervised (Approval Gate)** | Uploads files to Firebase Storage, audits documents via AI vision, compiles statutory PDFs. Prepares review pack for Kevin. |
| **Accounting / Payroll Retainer** | Monthly bookkeeping, management accounts, payroll inquiry | `/quote-generator` | **Supervised (Approval Gate)** | Sends neutral consultation acknowledgment to client, compiles Retainer Scoping Questionnaire, routes dossier to Kevin for pricing. |
| **SARS Tax Debt Compromise** | Tax debt relief, debt compromise, Section 200 | `/quote-generator` | **Supervised (Approval Gate)** | Asks the client for the approximate debt amount and to appoint us as tax representative. **Never ask for eFiling passwords, credentials or OTPs.** Notifies Kevin immediately. |
| **Personal / Non-Business** | Medical aid, gym, personal receipts, personal banking at `kev@thinkestry.co.za` | Internal Filter | **Untouched** | Left 100% untouched in your personal INBOX. Never archived or altered. |

---

## 📬 Multi-Mailbox Intake & Executive Loop Protection

The master agent monitors **two distinct mailboxes**:

1. **Practice Intake (`info@myacc.co.za`)**: **handled by the cloud quote agent, not this skill.**
   - The cloud agent triages every email, auto-sends strict catalog quotes, drafts everything else for approval, and alerts Kevin on Telegram.
   - From chat, only read its results: `/admin/quote-drafts`, Telegram `/quotestatus`, Firestore `quoteAgentMessages` / `quoteDrafts`.
2. **Executive Intake (`kev@thinkestry.co.za`)**:
   - Monitors direct emails sent to Kevin.
   - **Loop Protection Guardrails**:
     - Automatically ignores briefing summaries and review alerts sent by `no_reply@myacc.co.za` to prevent recursive email storms.
     - Leaves personal correspondence untouched in INBOX.
     - Places all client inquiries arriving at this address into the **Approval Queue** (never auto-replies directly from Kevin's address without approval).
   - **Configuration**: Set `KEVIN_IMAP_PASS=<password>` in your `.env` to activate polling for this mailbox.

---

## 🤖 Antigravity Subagent Orchestration Protocol

When the Master Agent identifies tasks requiring deep analysis, multi-document auditing, or complex proposal drafting, it **DOES NOT** clutter the main chat. It delegates each task to an isolated subagent using the `invoke_subagent` tool:

### 1. Delegating Order Fulfillment
```json
{
  "Subagents": [
    {
      "TypeName": "self",
      "Role": "Order 10072 Fulfillment Subagent",
      "Prompt": "Execute statutory audit and compile statutory pack for Order #10072 using /order-fulfillment-agent rules. Ingest documents, run forensic checks, generate NCR/statutory PDFs, and return the drafted communication note for Kevin's approval."
    }
  ]
}
```

### 2. Delegating Bespoke Quotation or Retainer Scoping
```json
{
  "Subagents": [
    {
      "TypeName": "self",
      "Role": "Zenith Logistics Quote Subagent",
      "Prompt": "Scope monthly accounting retainer for Zenith Logistics (15 staff, VAT registered). Check brain/clients/ for past context, query Firestore services, apply /quote-generator formatting, and prepare the 30-Second Executive Proposal for Kevin's sign-off."
    }
  ]
}
```

### 3. Aggregating Results
Each subagent performs its work in its isolated sandbox. When complete, the Master Agent aggregates the outcomes and renders a single **Master Briefing artifact** in the master conversation.

---

## 🛠️ CLI Execution Commands

### 1. Run Complete Master Triage Cycle
```bash
npx tsx .agents/skills/master-inbox-agent/scripts/master_orchestrator.ts --run
```

### 2. Dry-Run Mode (Safe Preview)
Inspects incoming emails, classifies every message, and prints proposed actions without sending emails or modifying Firestore:
```bash
npx tsx .agents/skills/master-inbox-agent/scripts/master_orchestrator.ts --dry-run
```

### 3. View Current Approval Queue
```bash
npx tsx .agents/skills/master-inbox-agent/scripts/master_orchestrator.ts --summary
```

### 4. 1-Click Order Approval & Deliverables Commitment
Approves and posts compiled deliverables to portal notes:
```bash
npx tsx .agents/skills/master-inbox-agent/scripts/master_orchestrator.ts --approve-order <orderId>
```

### 5. 1-Click Quote Approval & Dispatch
```bash
npx tsx .agents/skills/master-inbox-agent/scripts/master_orchestrator.ts --approve-quote <quoteId>
```

---

## ⏰ Background Autonomous Schedule (20 Minutes)

To run the master inbox continuously in the background, configure via the native `schedule` tool or `/schedule` slash command:

```text
CronExpression: "*/20 * * * *"
Prompt: "Run the master-inbox-agent cycle to triage incoming emails, auto-reply to catalog inquiries, delegate client tasks to subagents, and render the master approval queue."
IsDaemon: true
```
