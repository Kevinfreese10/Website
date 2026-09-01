---
name: order-fulfillment-agent
description: >
  Autonomous AI agent for auditing, inspecting, verifying documents, progressing SOP checklists, managing regulator follow-ups, and handling order fulfillment end-to-end for My Accountant.
  Use whenever managing, auditing, or fulfilling client orders, verifying client uploads, or transitioning order states.
---

# Order Fulfillment AI Agent

This skill guides the autonomous order fulfillment workflow for the My Accountant platform. It executes standard operating procedures (SOPs) per service, analyzes uploaded KYC/compliance documents with Gemini vision, prepares checklist steps, runs automated SLA follow-ups with government regulators, and manages order state transitions.

## Autonomous Lifecycle & Workflow Steps

```
[New / Processing Order Ingested]
         │
         ▼
[1. Order Context & Snapshot Inspection]
         │
         ▼
[2. Document Verification & KYC Check (Gemini Multimodal)]
         │
         ├─► If docs missing/rejected ──► Post client reminder in Communication History & set 'Waiting on Customer'
         │
         └─► If docs valid (>85% match) ──► Mark AI Recommendation: APPROVE & assemble regulatory dossier
         │
         ▼
[3. Regulatory Lodgement & State Transition Engine]
         │
         ├─► Lodge with Regulator (NCR, CIPC, COIDA, SARS)
         └─► Automatically transition order status to 'Waiting on External'
         │
         ▼
[4. Autonomous SLA Follow-Up Cycle]
         │
         ├─► Follow-up at Day 30, Day 60, Day 75 with verified regulator inboxes
         └─► Log dispatch and Message ID in Order Communication History
         │
         ▼
[5. Completion & Transactional Notifications]
```

---

## 🏛️ Autonomous Regulator Follow-Up Engine (SLA Follow-Ups)

For statutory orders in **`Waiting on External`** (e.g. NCR Credit Provider Applications, CIPC company registrations, COIDA Letter of Good Standing, SARS VAT registrations):
1. **Automated Dispatch:** Dispatch follow-up emails on schedule from `info@myacc.co.za` directly to dedicated regulator officers.
2. **CC Policy:** Always CC the client's email and `info@myacc.co.za`.
3. **Audit Trail:** Append a record note with full email text and Message ID to the Order's **Communication History** (`order.notes` in Firestore).

### NCR Official Contact & Routing Directory:
- 🎯 **Intake & Allocations:** `registrations@ncr.org.za`
- 👤 **Desiree Ndaba** (Senior Data Administrator - Certificates & Allocations): `dndaba@ncr.org.za` *(Tel: 011 554 2614)*
- 👤 **Evelyn Moleko** (Branch Additions & Allocations): `emoleko@ncr.org.za`
- 👤 **Tumelo Xhati** (Annual Renewal Fees & Lapsing): `txhati@ncr.org.za` *(Tel: 011 554 2806)*
- 👤 **Elelwani Tshikundamalema** (Compliance Officer): `etshikundamalema@ncr.org.za` *(Tel: 011 554 2853)*
- 👤 **Motshaki Goba**: `mgoba@ncr.org.za` *(Tel: 011 554 2855)*
- 💳 **Fees Department:** `fees@ncr.org.za`
- ❌ **PERMANENTLY BLACKLISTED (Access Denied / Bounced):** `applications@ncr.org.za` — **NEVER USE**.

---

## 💳 Payment Notifications & Document Ingestion

1. **Bank Electronic Notifications (PayFast, Capitec RTC, Absa, FNB):**
   - The website's Instant Transaction Notification (ITN) webhook automatically transitions orders from `Pending Payment` to `Processing`.
   - General bank payment advice emails can be **ignored and auto-archived**.
2. **Direct Client Document Uploads via Email:**
   - When a client emails statutory documents, CoR certificates, bank confirmation letters, or IDs directly to `info@myacc.co.za`, the agent must:
     1. Upload the files to Firebase Storage (`orders/{orderId}/notes/...`).
     2. Post a confirmation note in the Order's **Communication History** (`order.notes`).
     3. Transition the order from `Cancelled` / `Waiting on Customer` to **`Processing`**.

---

## 🔄 State Machine Transition Guardrails

| Status Transition | Trigger & Condition |
|---|---|
| **`Waiting on Customer` $\rightarrow$ `Waiting on External`** | All required client uploads (signed Form NCR 2, POA, board resolutions, certified IDs, police clearances) are verified and the statutory dossier has been lodged with external regulators. |
| **`Processing` $\rightarrow$ `Waiting on Customer`** | Documents are missing, rejected, or require client signature/initials. Posted exclusively to Communication History. |
| **`Waiting on External` $\rightarrow$ `Completed`** | Final statutory certificate (e.g. NCRCP Certificate, CoR14.3, Tax Clearance PIN, Letter of Good Standing) received, uploaded to Storage, and posted to Communication History. |

---

## 🔒 Strict Client Communication Policy (CRITICAL INVARIANT)

- **NEVER** email draft documents, deliverables, or review queries directly to clients' email addresses.
- **ALWAYS** post exclusively to the Order's **Communication History** (`order.notes` in Firestore) with public Firebase Storage download links.
- This ensures all client communications, feedback, and audit trails remain 100% centralized within the order dashboard.
