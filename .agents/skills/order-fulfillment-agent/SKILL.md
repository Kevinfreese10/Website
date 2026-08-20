---
name: order-fulfillment-agent
description: >
  Autonomous AI agent for auditing, inspecting, verifying documents, progressing SOP checklists, and managing order fulfillment end-to-end for My Accountant.
  Use whenever managing, auditing, or fulfilling client orders, verifying client uploads, or transitioning order states.
---

# Order Fulfillment AI Agent

This skill guides the autonomous order fulfillment workflow for the My Accountant platform. It executes the standard operating procedure (SOP) per service, analyzes uploaded KYC/compliance documents with Gemini vision, prepares checklist steps, and keeps human staff in the loop for final sign-offs.

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
         ├─► If docs missing/rejected ──► Draft client reminder & set 'Awaiting Documents'
         │
         └─► If docs valid (>85% match) ──► Mark AI Recommendation: APPROVE & notify staff for 1-click confirmation
         │
         ▼
[3. SOP Checklist Progression]
         │
         ├─► Step: KYC / Document Verification (Auto-ticked upon doc approval)
         ├─► Step: Filing / Calculations / Preparations (Execute or guide staff)
         └─► Step: Final Review & Artifact Generation
         │
         ▼
[4. State Machine Transition Engine]
         │
         ▼
[5. Completion & Transactional Notifications]
```

## Available Tool Functions

In `src/lib/ai/order-fulfillment-tools.ts`:
- `getOrderFulfillmentContext(orderId)`: Retrieve full snapshot, requirements, checklist, and prerequisite status.
- `runAiDocumentVerification(orderId, requirementId)`: Perform multimodal compliance check on uploaded document.
- `confirmDocumentAiRecommendation(orderId, requirementId, performer)`: 1-click human confirmation of AI recommendation.
- `updateOrderChecklistItemAtomic(orderId, stepId, update, performer)`: Mark SOP checklist steps as completed, in_progress, or skipped with artifacts.
- `transitionOrderStatusAtomic(orderId, targetStatus, performer, options)`: Execute state transitions with deterministic guardrails.

## Human-in-the-Loop Safeguards

1. **Document Verification**: AI evaluates confidence and extracts metadata, setting `aiVerification.recommendation`. Human staff can verify with 1-click in the UI.
2. **Completion Guardrails**: Orders cannot transition to `Completed` if:
   - Any prerequisite orders are not `Completed`.
   - Any required documents are `pending` or `rejected`.
   - Any SOP checklist steps are incomplete (unless explicitly overridden with a logged bypass reason).

## Client Communication Policy

- **Strict Communication History Rule**: Never send direct external emails to clients for order-related queries, document requests, or status updates.
- **Centralized Portal Auditing**: Always post messages, requests, and documents directly using the **Post Note** function in **Communication History** (`orders/{orderId}/notes`).
- **Attachments**: Upload any required forms or documents to Firebase Storage and attach them to the note so the complete correspondence and document history remain permanently attached to the order.

