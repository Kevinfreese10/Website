# Task Checklist - Partner White-Labeling & Email Fixes

- [x] Update `firestore.rules` to allow reseller partners to update their own orders
- [x] Add Admin SDK helper methods and recursive timestamp serializer to `src/lib/firebase-admin.ts`
- [x] Refactor `src/app/p/[slug]/layout.tsx` to use Admin SDK and inject Tailwind variables (`--primary`, `--ring`)
- [x] Refactor partner subpage database fetches to use the Admin SDK helper:
  - [x] `src/app/p/[slug]/page.tsx`
  - [x] `src/app/p/[slug]/products/[serviceSlug]/page.tsx`
  - [x] `src/app/p/[slug]/popia/page.tsx`
  - [x] `src/app/p/[slug]/refund-policy/page.tsx`
  - [x] `src/app/p/[slug]/terms/page.tsx`
- [x] Refactor `src/lib/email.ts` to fetch reseller data using the Admin SDK
- [x] Add server action `sendOrderConfirmationEmailAction` to `src/app/actions.ts`
- [x] Refactor checkout flow in `src/components/checkout/ServiceCheckoutForm.tsx` to use server action and remove client email rendering imports
- [x] Modify `src/components/emails/OrderConfirmationEmail.tsx` to dynamically apply reseller primary colors
- [x] Run `npx tsc --noEmit` compilation check and verify implementation
