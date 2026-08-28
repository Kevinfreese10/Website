# My Accountant — UI Audit & Premium UI Implementation Plan

**Date:** 28 Aug 2026 · **Status:** Awaiting approval — no changes made yet
**Delivery:** Phased commits on a feature branch (`feature/premium-ui`), foundation first, all three surfaces (marketing site, client dashboard, admin/staff portal). Dark mode explicitly out of scope for now.

---

## Part 1 — UI Audit (current state)

### Stack & foundation

| Area | Finding |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| UI system | shadcn/ui (~39 primitives in `src/components/ui`), Radix, Tailwind 3 + `tailwindcss-animate`, CVA |
| Icons | lucide-react only — already a single consistent icon system ✅ |
| Charts | Recharts installed; `chart.tsx` primitive present |
| Animation | No animation library. Only Tailwind keyframes (`float`, `shimmer`, `gradient-shift`, `aurora-drift`) — all decorative, none interaction-driven |
| Tokens | Good HSL CSS-variable token system (`--primary`, `--radius`, sidebar tokens). Radius scale already consistent ✅ |
| Scale | 511 `.tsx` files; admin portal is the largest surface (~30 modules), plus client dashboard and ~80 public SEO/service pages |

### What's already good

- Solid shadcn foundation: dialog, sheet, dropdown, tooltip, toast, sidebar (with `collapsible="icon"` already in use), command primitive, skeleton primitive all exist.
- Design tokens are centralised — restyling ripples everywhere automatically.
- Focus-visible rings are defined on buttons/inputs.
- The button `neon-glow` regression was already fixed (moved to an opt-in `hero` variant).

### Gaps found (mapped to your premium feature list)

1. **Loading states:** 162 files use raw `Loader2`/`animate-spin` spinners; only 8 use `Skeleton`. No table/card/page skeleton patterns.
2. **Command palette:** `cmdk` is installed and `command.tsx` exists, but nothing is wired — no Ctrl/Cmd+K, no global search.
3. **Data tables:** 53 admin files hand-roll `<Table>` with no shared DataTable. No sorting, filter chips, saved views, column visibility, bulk selection, or inline editing anywhere. `admin/orders/page.tsx` is 962 lines, `admin/clients/page.tsx` is 1,123 lines — both monoliths.
4. **Navigation:** No breadcrumbs (one ad-hoc instance on product pages). No recently-viewed, no pinned/favourite items, no keyboard shortcuts, no Quick Create.
5. **Feedback:** Radix toast used in 139 files but visually basic; no undo pattern, no optimistic UI; destructive actions vary between AlertDialog and inline patterns.
6. **Empty states:** Ad hoc "No X found" text in ~32 admin files; no shared EmptyState with icon + explanation + CTA.
7. **Micro-interactions:** Buttons have `transition-colors` only — no press feedback, no card lift/hover reveal system, no page/route transitions.
8. **Visual excess on marketing side:** `globals.css` carries heavy glass/neon/aurora utilities (some with `!important`) that need to be corralled into deliberate "hero moments" rather than general-purpose utilities.
9. **KPI/dashboard:** Stats render as static numbers — no trends, sparklines, counters, or configurable widgets.
10. **Records:** No slide-over quick view, no document preview drawer, no activity timeline UI, no status stepper on orders.
11. **Forms:** react-hook-form + zod are in place ✅, but no autosave indicators, draft recovery, multi-step patterns, or sticky form actions.
12. **Mobile/PWA:** Desktop UI collapses rather than being designed for mobile; no bottom action bar, no PWA manifest, no offline/reconnect state.
13. **Layout hardcoding:** `bg-white` and similar literals in layouts (e.g. admin layout) bypass the token system — worth fixing for consistency even without dark mode.

---

## Part 2 — Implementation Plan

Nine phases, ordered so every later phase builds on shared primitives instead of duplicating one-off UI. Each phase ends with `typecheck` + `lint` + `build` + a visual smoke test, then a commit to `feature/premium-ui`.

### Phase 0 — Design-system foundation (the multiplier)

- **Motion system:** add the `motion` (framer-motion) library; define motion tokens (durations 150/250/400ms, standard easings) and a small set of reusable variants (fade-up, scale-press, stagger). Global `prefers-reduced-motion` support.
- **Elevation system:** 3-tier shadow tokens (surface / raised / overlay) replacing arbitrary card shadows; layered surface treatment (page vs section vs interactive card).
- **Typography hierarchy:** page-title / section-heading / metadata / supporting-text utility classes applied consistently.
- **Corral decorative CSS:** scope glass/neon/aurora utilities to marketing hero use; remove `!important`s; replace hardcoded `bg-white` in layouts with tokens.
- **Focus & hover polish:** consistent focus rings; standard hover-lift treatment for interactive cards.

*Covers: soft elevation, layered surfaces, consistent radius, premium typography, icon consistency, focus states, theme-aware components (token hygiene), restrained gradient accents.*

### Phase 1 — Upgraded core primitives

- **Button:** press-scale micro-interaction, built-in `loading` prop (spinner + disabled), success flash option.
- **Toasts:** restyle toast system (elevation, icons, semantic variants) + **undo-action toast** helper.
- **Skeletons:** `TableSkeleton`, `CardSkeleton`, `PageSkeleton`, `StatSkeleton` — then migrate the highest-traffic spinner screens (admin orders/clients/tasks, dashboard home).
- **EmptyState:** icon/illustration + explanation + CTA component; roll out across the ~32 ad-hoc admin empty states.
- **StatusBadge:** one smart badge component (status, priority, overdue, AI, risk) with consistent colour semantics.
- **ConfirmDialog:** single contextual confirmation component replacing mixed patterns.
- **Stepper, AnimatedNumber, Sparkline, RichTooltip:** shared primitives for later phases.

*Covers: micro-interactions, skeleton loaders, premium toasts, undo actions, beautiful empty states, smart badges, custom confirmations, animated counters, sparklines, rich tooltips, status steppers.*

### Phase 2 — Navigation & wayfinding

- **Command palette (Ctrl/Cmd+K):** wire `cmdk` — grouped results for clients, orders, services, pages, and actions; role-aware (admin vs client); recent items surfaced first.
- **Global smart search:** Firestore-backed lookups powering the palette with grouped, instant results.
- **Breadcrumbs:** smart breadcrumb component in admin + dashboard layouts, with contextual actions slot.
- **Recently viewed & pinned items:** lightweight tracking (local + per-user Firestore) shown in palette and dashboard.
- **Quick Create:** global "+ New" (client, order, invoice, task, document request) in the header + FAB on mobile.
- **Keyboard shortcuts:** `g o` / `g c` style navigation, `?` shortcut-help overlay.
- **Sidebar polish:** icon-collapsed mode tooltips, active-state treatment, section grouping.
- **Page transitions:** subtle fade/slide via `template.tsx` in app segments (no flashiness).

*Covers: command palette, global search, quick create/FAB, smart breadcrumbs, expandable side nav, recently viewed, favourites, keyboard shortcuts, animated page transitions.*

### Phase 3 — Advanced data tables

- **Shared DataTable** on TanStack Table: sorting, column visibility & resizing, filter chips (removable), pagination, URL-synced state.
- **Saved views:** per-user views in Firestore ("My Orders", "Overdue", "Waiting for Client", "Urgent").
- **Bulk-selection action bar:** slides in when rows are selected (assign, status change, export, archive).
- **Inline editing:** status, assignee, dates, notes directly in cells with optimistic save.
- **Row quick actions:** consistent `•••` menus.
- **Migrations:** orders → clients → tasks → users first (breaking up the 900–1,100-line pages into composable pieces as we go), then remaining admin tables incrementally.

*Covers: advanced tables, saved views, filter chips, bulk actions, inline editing, contextual quick actions, optimistic UI (tables).*

### Phase 4 — Record experiences (orders, clients, documents)

- **Slide-over quick view:** inspect/edit orders & clients from any list without navigating; quick-view modals for invoices/documents.
- **Sticky contextual header:** key client/order facts + actions remain visible while scrolling detail pages.
- **Status stepper on orders:** visual multi-stage progress, with a restrained completion celebration on final states.
- **Activity timeline & audit trail UI:** polished who/what/when history on order and client records.
- **Documents:** drag-and-drop uploads with progress + validation, thumbnails, and a PDF/image preview drawer (pdf-lib/browser viewer) — no downloads needed.
- **Optimistic UI + undo** for status changes and archive/delete across records.

*Covers: slide-over panels, quick-view modals, split-view (list + detail via slide-over), sticky headers, activity timelines, animated progress, completion celebrations, drag-drop uploads, document preview, thumbnails, audit trail UI.*

### Phase 5 — Dashboards & KPIs

- **Interactive KPI cards:** current value + trend % vs prior period + sparkline + animated count-up on load.
- **Personalised widgets:** users choose visible cards and rearrange via drag-and-drop (dnd-kit), persisted per user.
- **Notification centre:** grouped, actionable notifications panel with unread badges (builds on existing Firestore data).

*Covers: interactive KPI cards, animated counters, mini charts, personalised/drag-drop dashboards, notification centre & badges.*

### Phase 6 — Forms & AI polish

- **Forms:** multi-step form wrapper for long flows (onboarding, order creation), live zod validation feedback, autosave with `Saving… → Saved` indicator, draft recovery, sticky Save/Continue bars, smart defaults.
- **AI surfaces (Khai, AI accountant, AI payroll):** branded AI loading/shimmer states, streaming response treatment, suggested next-step chips, confidence indicators on automated decisions, and a "Why did AI do this?" explanation drawer.

*Covers: multi-step forms, live validation, autosave indicators, draft recovery, sticky form actions, smart defaults, all five AI-UI items.*

### Phase 7 — Mobile & PWA

- **Mobile-first nav** for dashboard/admin (purpose-built bottom nav + sheet menus rather than collapsed desktop UI).
- **Bottom action bars:** primary actions thumb-accessible on record pages.
- **PWA baseline:** manifest, icons, installability; **offline/reconnection banner** with graceful recovery.
- Pull-to-refresh on dashboard lists (if it earns its keep after PWA baseline).

### Phase 8 — Onboarding & discovery (final layer)

- First-use experiences for unconfigured features, contextual tips where features live, subtle "New" feature badges, and an optional guided tour for new clients/staff.

### Deferred (agreed or recommended)

- **Dark mode** — skipped per your call (Phase 0's token hygiene keeps the door open).
- **Real-time presence / collaboration indicators & @mentions** — needs realtime infrastructure decisions; propose as its own follow-up once Phases 0–5 land.
- **Glass surfaces / animated gradients** — kept, but restricted to marketing hero moments only.

---

## Sequencing & verification

- Branch: `feature/premium-ui`, one commit (or a few) per phase, so any phase can be reviewed or reverted independently.
- Every phase gate: `npm run typecheck`, `npm run lint`, `npm run build`, plus a visual check of touched screens in the dev server.
- Rough effort split: Phases 0–2 are the fastest wins (foundation + palette + navigation); Phase 3 is the largest single chunk (table migrations); Phases 4–8 are incremental on top.

**Suggested start:** Phase 0 + Phase 1 together (they're what every screenshot-worthy improvement depends on), then Phase 2 for the "wow" moment of Cmd+K.
