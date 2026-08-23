---
description: Universal guardrails for Firebase Auth, Client SDK queries, and Next.js Server Action serialization
globs: ["src/**/*.{ts,tsx}", "firestore.rules"]
---

# Firebase Client Safety & Server Action Architectural Invariants

### 1. Identity & Auth Resolution
- **Direct Primary Lookup**: Always query `/users/{uid}` directly as the primary identity document.
- **Safe Fallback Queries**: Never use bare `Promise.all()` across collections with differing RBAC permissions (e.g. `users` vs `adminClients` vs `partnerClients`). Wrap secondary collection lookups in individual `try/catch` blocks so permission denials never abort user logins.

### 2. Client SDK vs. Server Action Boundaries
- **No Client Enumeration of Users**: Client-side components (`'use client'`) must NEVER query the `users` collection to look up staff, consultants, or partner metadata.
- **Use Server Actions for Multi-Document / Cross-Entity Lookups**: All order confirmation lookups, payment handoffs, and guest/email matching must use Server Actions (`getAdminDb()`) such as `getClientOrdersAction` and `getOrderDetailsAction`.
- **Simple Client Subscriptions**: Client-side Firestore real-time listeners (`onSnapshot`) should strictly use single-field equality filters matching `auth.uid` (e.g. `where('userId', '==', user.uid)`).

### 3. Server Action Serialization & Date Handling Invariants
- **Clean JSON Serialization**: All data returned across the Server Action boundary to Client Components must be sanitized with `serializeFirestoreData` or `JSON.parse(JSON.stringify())` to strip Firestore `Timestamp` instances and non-serializable classes.
- **Safe Date Formatting**: Client components must coerce date fields using safe conversion helpers (e.g. `toDate(val)`) before calling `.getTime()` or `.toISOString()`.
