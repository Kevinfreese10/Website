---
name: order-audit-and-document-generator
description: >
  Audits client orders across all My Accountant services, verifies uploaded KYC/statutory documents with AI vision, generates compliant statutory PDFs (Accounting Officer Letters, NCR Form 2, Fee Annexures, resolutions, share certificates, COIDA Form CF-1B, Special Power of Attorney, BEE affidavits, etc.), and routes delivery via Communication History or Kevin's review inbox based on strict confidence thresholds and state machine rules.
---

# Order Audit & Document Generator

This skill guides the end-to-end audit, document verification, statutory PDF generation, and delivery routing for all client orders on the **My Accountant** platform.

## Overview

```
[Order Triggered (Single ID / Batch / Live Listener)]
                         │
                         ▼
        [1. Ingest & Fetch Order Context]
                         │
                         ▼
    [2. Document Verification & KYC Pre-Flight]
      ├─ Missing docs? ──► Move to "Waiting on Customer" & post checklist reminder
      └─ Valid docs?   ──► Extract entity metadata & proceed to Drafting
                         │
                         ▼
           [3. Generate Statutory PDFs]
      (Form NCR 2, Fee Annexure, Special POA, Resolutions, Accountant's Letters, etc.)
                         │
                         ▼
   [4. CHECKPOINT: Present PDF Summary / Dispatch Review]
                         │
           ┌─────────────┴─────────────┐
           ▼                           ▼
  [Client Signature Needed]     [Statutory Lodgement / Delivery]
           │                           │
  [Post Drafts to Notes &]      [Lodge with Regulator (NCR/COIDA)]
  [Set "Waiting on Customer"]   [Set "Waiting on External"]
                                       │
                                [Approved / Issued]
                                [Set "Completed"]
```

## Dependencies

- `order-fulfillment-agent`: Platform SOP checklist rules, state machine, and portal communication policy.
- `src/lib/pdf/template-generators.ts` & `src/lib/documents/renderers/`: PDF generation engine with official brand letterhead, CIBA CBA (SA) #3561 credentials, and statutory templates.
- `src/lib/firebase-admin.ts`: Firestore database & Firebase Storage client.
- `src/lib/email.ts` / Nodemailer: SMTP transport (`mail.myacc.co.za:465`) for review notifications and client communications.

---

## Canonical Order Status Taxonomy & State Machine

| Status | Badge Color | Purpose / When to Apply |
|---|---|---|
| **`Processing`** | 🔵 Info (Blue) | Active order currently being worked on by staff/agent (document verification, trial balance, drafting). |
| **`Waiting on Customer`** | 🟡 Amber / Orange | Waiting for customer document uploads, digital/physical signatures on Form NCR 2 / POA / Resolutions, or client feedback on drafts. |
| **`Waiting on External`** | 🟣 Purple / Indigo | All documents verified and submitted to external regulators or government bodies (e.g. NCR at `applications@ncr.org.za`, COIDA Commissioner, SARS, CIPC). |
| **`Pending Payment`** | 🟡 Warning (Yellow) | Awaiting payment confirmation or ITN clearance. |
| **`Completed`** | 🟢 Success (Green) | All statutory deliverables, registration certificates, or signed letters posted to Communication History and confirmed. |

---

## Strict Email Routing Guardrail

> [!IMPORTANT]
> **Internal Review Emails**: Review emails and sign-off drafts must be routed **strictly to `kev@thinkestry.co.za`**.
> **NEVER include or CC `freesekevin@gmail.com`**.
>
> **Client Outbound Emails**: Dispatched from `winifred@myacc.co.za` / `info@myacc.co.za` (via `mail.myacc.co.za:465`) with responsive HTML layout and clean plain-text fallback, CCing `winifred@myacc.co.za` and `kev@thinkestry.co.za`.

---

## Step-by-Step Workflow Protocol

### Step 1: Ingest & Inspect
- Fetch order details: Customer Name, Email, Phone, Legal Entity Name, Registration Number, SARS Tax Number, Order Items, and Total.
- Inspect `documentUploads`, `uploadedFiles`, and `notes` (Communication History).

### Step 2: Document Verification & Extraction
- **Auditing Checklist against Service Playbook**:
  - **NCR Registration**: CIPC CoR14.3, Certified Director IDs (<3 months), SAPS/AFISwitch Criminal Clearance (<6 months), Bank Confirmation Letter in entity name (<3 months), SARS TCS PIN, Proof of Payment (R1,800).
  - **Accountant's Income Letter**: Certified ID, 6-month bank statements (PDF), proof of contract/invoice earnings, addressee details.
- **Handling Incomplete Documents**: Move order status to `Waiting on Customer` and post a clear itemized list of required documents to `order.notes`.
- **False-Positive Handling**: If automated vision flags valid contractor invoices (e.g., "Expected payslip but found invoice"), override to approved if justified by contractor/self-employed status.

---

### Step 3: Statutory PDF Generation Guidelines

#### A. Accountant's Confirmation of Income & Drawings
* **Typography & Word Wrapping**: Use dynamic font measurement to wrap text strictly on word boundaries (`wrapText`). Never truncate or split words across line breaks.
* **Layout Spacing**: Maintain generous vertical breathing room (12–16pt) between cards, paragraphs, tables, and the highlight box.
* **Scope Limitation**: Confine confirmation strictly to the examination of verified bank statements and invoices. Do NOT claim unperformed reviews (e.g., tax profile or billing audits).
* **Dedicated Digital Signature Slot**: Use an expanded signature box (85pt height) with a clean ~38pt open blank area above Kevin's printed name so digital signature stamps can be applied cleanly without overlapping text:
  ```text
  FOR MY ACCOUNTANT (PTY) LTD (REGISTRATION NO: 2020 / 548105 / 07):

  [ OPEN ~38PT BLANK SPACE FOR DIGITAL SIGNATURE ]

  Kevin Freese
  Chartered Business Accountant in Practice • CBAP (SA) #3561
  Practice Number: PR-0098553 • CIBA Member in Good Standing
  ```

#### B. NCR Credit Provider Registration Pack
* **Form NCR 2 (7 Pages)**:
  - Populate from official AcroForm template: `public/templates/NCR_Form_2_Fillable.pdf`.
  - Fill all applicant details, trading name, registration number, commencement date, FYE, tax number, physical/postal address, telephone, email, sole director/management profile, premises details, and disqualification questions (all NO, SAPS consent YES).
* **NCR Fee Annexure (Confirmation of Payment of Fees)**:
  - Populate from official AcroForm template: `public/templates/NCR_Annexure_Confirmation_of_Fees_Fillable.pdf`.
  - Reflect standard fee breakdown: R550.00 Application Fee + R1,250.00 Initial Registration Fee = **R 1,800.00 Total**.
* **Special Power of Attorney**:
  - Generate on My Accountant letterhead appointing Kevin Freese (CIBA #3561) to represent the entity before the National Credit Regulator.
  - Include director signature line and Kevin's statutory acceptance card.
* **Sole Director / Board Written Resolution**:
  - Authorising credit provider registration under Section 40 of NCA and authorising director to execute Form 2.

#### C. COIDA Nature of Business Change Pack
* **Official Form CF-1B (3 Pages)**: Use `public/templates/CF-1B Form Application for Change of Nature of Business_ORIGINAL_BACKUP.pdf`.
* **Special Power of Attorney**: Appointing Kevin Freese (CIBA #3561, ID: `8606205046085`) before the Compensation Commissioner.

#### D. B-BBEE Sworn Affidavit (EME - General)
* Use official dtic template `public/templates/Affidavit-EME-Gen.pdf`.
* Embed trimmed signature asset `public/templates/Signature_Kevin_New.png`.
* Position signature compactly above `Commissioner of Oaths:` header with Commissioner stamp box below.

---

### Step 4: Storage Upload & Client Communication History

* **Storage Upload Path**: `orders/{orderId}/notes/{timestamp}_{filename}.pdf` (public read permissions).
* **Firestore Data Structure**:
  - Notes and deliverables must be appended directly to `order.notes` using `FieldValue.arrayUnion()`.
  - Schema:
    ```javascript
    const note = {
      id: `note_${Date.now()}`,
      text: "...",
      authorId: "LRM285EOq3gwNMKayY6vtzooaC03",
      authorName: "Kevin Freese (Director)",
      date: new Date(),
      type: "note",
      subject: "...",
      isInternal: false,
      attachments: [{ name: "Document.pdf", url: "https://storage.googleapis.com/..." }]
    };
    ```

---

### Step 5: External Regulator Lodgement Protocol (NCR)

When all 10 statutory documents are signed and ready for lodgement:
1. **Lodgement Target**: `applications@ncr.org.za`
2. **CC List**: `registrations@ncr.org.za`, `kev@thinkestry.co.za`, client email, `winifred@myacc.co.za`.
3. **Attachments**: 26-page master combined PDF pack + individual signed statutory PDFs.
4. **Order Status Transition**: Update Firestore status immediately to **`Waiting on External`**.
5. **Log Confirmation**: Post confirmation note to Communication History with email timestamp and Message ID.

---

## Live Event Listener Integration Patterns

To run this skill continuously or reactively in Antigravity:

1. **Firestore `onSnapshot` Daemon**:
   ```javascript
   db.collection('orders')
     .where('status', 'in', ['Processing', 'Waiting on Customer'])
     .onSnapshot(snap => {
       snap.docChanges().forEach(change => {
         if (change.type === 'modified') {
           // Auto-trigger pre-flight audit when documentUploads array updates
         }
       });
     });
   ```
2. **Cron Scheduler (`/schedule`)**: Run recurring audits every 30 minutes to check orders awaiting customer response and draft polite follow-ups after 48 hours.
