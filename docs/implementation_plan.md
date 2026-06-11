# Implementation Plan - Partner White-Labeling & Email Fixes

This plan resolves the dynamic partner landing page crashes caused by Firestore security rules, allows partners to update orders placed with their reseller ID, implements server-side email rendering to reduce client bundle size, and improves white-label branding consistency across partner pages and email templates.

## Proposed Changes

### Component 1: Firestore Security Rules

#### [MODIFY] [firestore.rules](file:///c:/myacc/firestore.rules)
* Update the `/orders/{orderId}` write/update rules to allow reseller partners to update their own orders.

---

### Component 2: Firebase Admin SDK Utility Integration

#### [MODIFY] [firebase-admin.ts](file:///c:/myacc/src/lib/firebase-admin.ts)
* Add high-level, server-side helper functions to fetch partner details, categories, services, and overrides using the Admin SDK (bypassing Firestore client rules).
* Implement a robust, recursive Firestore timestamp serializer (`serializeDbData`) so fields like `createdAt` are automatically formatted to ISO strings for client transportation.

---

### Component 3: Server Component Database Refactoring

#### [MODIFY] [layout.tsx](file:///c:/myacc/src/app/p/[slug]/layout.tsx)
* Replace the Firebase Client SDK database fetches with the new Admin SDK helper functions.
* Inject `--primary` and `--ring` variables into the dynamic style block to map third-party and standard Tailwind components directly to the partner's brand color.

#### [MODIFY] [page.tsx](file:///c:/myacc/src/app/p/[slug]/page.tsx)
* Replace Client SDK calls (`getPartnerBySlug`, `getServices`, `getPartnerOverrides`, `getCategories`) with Admin SDK helpers.

#### [MODIFY] [products/[serviceSlug]/page.tsx](file:///c:/myacc/src/app/p/[slug]/products/[serviceSlug]/page.tsx)
* Replace Client SDK calls (`getPartnerBySlug`, `getService`, `getPartnerOverride`) with Admin SDK helpers.

#### [MODIFY] [popia/page.tsx](file:///c:/myacc/src/app/p/[slug]/popia/page.tsx)
* Refactor database fetches to use the Admin SDK helper.

#### [MODIFY] [refund-policy/page.tsx](file:///c:/myacc/src/app/p/[slug]/refund-policy/page.tsx)
* Refactor database fetches to use the Admin SDK helper.

#### [MODIFY] [terms/page.tsx](file:///c:/myacc/src/app/p/[slug]/terms/page.tsx)
* Refactor database fetches to use the Admin SDK helper.

---

### Component 4: Server-Side Email Rendering & Dynamic Themes

#### [MODIFY] [email.ts](file:///c:/myacc/src/lib/email.ts)
* Update `sendEmail` to query reseller/partner data using the Admin SDK (`getAdminDb`) instead of the Client SDK so it never fails under an unauthenticated scope.

#### [MODIFY] [actions.ts](file:///c:/myacc/src/app/actions.ts)
* Add a server action `sendOrderConfirmationEmailAction` to render the confirmation email dynamically on the server using React Email's `render` function.

#### [MODIFY] [ServiceCheckoutForm.tsx](file:///c:/myacc/src/components/checkout/ServiceCheckoutForm.tsx)
* Call `sendOrderConfirmationEmailAction` to process rendering on the server.
* Remove client-side `@react-email/components` imports.

#### [MODIFY] [OrderConfirmationEmail.tsx](file:///c:/myacc/src/components/emails/OrderConfirmationEmail.tsx)
* Update styles dynamically to use `reseller?.landingPage?.primaryColor` as the highlight color instead of hardcoded `#214392`.

---

## Verification Plan

### Automated Tests
- Run compile check `npx tsc --noEmit` to ensure no TypeScript or packaging warnings exist.

### Manual Verification
- Verify that partner subpages load correctly when logged out.
- Ensure standard Tailwind UI components inherit the partner's primary colors correctly.
