# Requirements — Jewellery Age Advisor (Aura)

**Type**: Brownfield Enhancement (retrospective — documents already-shipped work)
**Date**: 2026-09-29
**Source**: Git commit history — `main` branch, commits `31bb7c9`..`d7c6e0c` — 6 epics (no Jira/GitHub/Azure DevOps tracker exists for this repo)
**Author**: ANALYST_PM_BROWNFIELD

---

## Project Overview

Aura is a jewellery recommendation advisor: given a recipient's age, relationship, occasion,
budget, and style preference, it surfaces up to 6 ranked jewellery items with a plain-language
"why this pick" explanation. The project originated as a dependency-free static HTML/CSS/JS MVP
(root of this repo), then was migrated to a production stack — Next.js 16 (App Router) + React 19
+ TypeScript + Tailwind v4 + Supabase (auth + Postgres) — under `aura/`, adding user accounts and
a favorites feature. The migration was executed as 6 sequential "Epics" against the
**"Aura Migration Document"** (now recovered — `SPEC/references/Aura-Migration-Document-Vanilla-JS-Next.jsTypeScriptSupabase.pdf`,
converted to `.md` in the same directory). Reading it resolves the two biggest open questions
from the initial (pre-document) version of this requirements pass:

1. **The dual-recommendation-engine divergence is a documented, deliberate decision, not an
   open question.** The Migration Document's own §9 item 7 ("Epic 4 data-model correction")
   records that its §1.3 design was written from an earlier analysis that no longer matched the
   real `app.js`/`data.js` (which use `scoreItem`/`recommend` with separate `occasionTags`/
   `relationshipTags` arrays and a per-item gradient, not the document's `heirloomSkew`/
   `occasionTagBoost`/`whyText` design with a flat `tags[]`). The team explicitly chose to follow
   the **document's design** (Epic 4 schema choice, confirmed again in Epic 6), not the live
   `app.js` code. `aura/lib/recommendation-engine.ts` is therefore the intended, approved
   implementation — `app.js` is the superseded legacy version the migration was deliberately
   diverging from, by design, not by accident.
2. **`app/api/favorites/route.ts` (GET list / POST add / DELETE remove) is an explicit, planned
   deliverable** — Migration Document §2 (target file tree) and §8 Step 6 ("Add favorites (new
   feature, protected)") both call for it. Its absence today (only `.gitkeep` exists) is a
   genuine **incomplete implementation**, not an ambiguous scope question — this is the clearest
   candidate for "next epic."

## Current System Context

**Architecture**: Server-rendered Next.js monolith with a client-side deterministic scoring
heuristic and Supabase as the sole backend (auth + one `favorites` table, no custom API layer).
Full detail: `docs/architecture/current/00-system-overview.md`.
**Affected Modules**: Project scaffold, Supabase schema/auth, Tailwind design system + shadcn/ui
primitives, domain types/data, auth pages/session/route-protection, recommendation engine +
results screens.
**Existing Patterns**: Pure-function scoring engine (no I/O, fully unit-testable); URL-search-param-driven
page state (no client store); centralized route protection via `proxy.ts` → `lib/supabase/middleware.ts`;
in-code breadcrumb comments explaining every deviation from the Migration Document. Full detail
(with DO/DON'T examples): `docs/architecture/current/01-recommendation-engine-deep-dive.md`.

## Roles & Permissions Matrix

> Canonical role registry. Every story's User Flow by Persona and RBAC Enforcement block
> references these role names + permission keys verbatim.

| Role (canonical) | Description | Key Permissions (allow) | Explicitly Denied | Auth Source | Origin |
|------------------|-------------|--------------------------|--------------------|--------------|--------|
| Guest (unauthenticated) | Any visitor, no account | Submit recommendation form, view `/results`, register, log in | Access `/favorites`, `/api/favorites` | None (public routes) | Existing |
| Authenticated User | Registered + logged-in Supabase user | Everything Guest can do, plus: view/manage own favorites (`favorites:read-own`, `favorites:create-own`, `favorites:delete-own`) | Access another user's favorites (enforced by RLS `auth.uid() = user_id`) | Supabase Auth (email/password, `@supabase/ssr` cookie session) | Existing |

**Permission keys**: `favorites:read-own`, `favorites:create-own`, `favorites:delete-own`.

**Notes**: Only two roles exist in the system; no admin/staff role has been introduced. RLS
policies on `public.favorites` (`aura/supabase/migrations/0001_favorites.sql`) are the actual
enforcement point — verified against code, not inferred. Single distinguishing factor is
authentication state, not a role hierarchy.

## Epics Reconstructed (from git history)

| # | Commit | Epic | Summary |
|---|--------|------|---------|
| 1 | `31bb7c9` | Epic 1: Project Scaffold | Next.js 16 + TypeScript + Tailwind v4 App Router skeleton; target folder structure for auth, recommendations, lib/supabase, types, data |
| 2 | `8a1e61c` | Epic 2: Supabase Schema | `favorites` table + RLS migration; setup docs; email-confirmation-required decision; `profiles` table explicitly skipped for MVP |
| 3 | `1462613` | Epic 3: Design System | Tailwind v4 `@theme` tokens (cream/ivory/gold/rose/ink, 18px radius, soft shadow); shadcn/ui primitives; gradient Button variant; Playfair Display + Poppins fonts |
| 4 | `426ad6f` | Epic 4: Types & Data | `types/jewellery.ts`, `types/auth.ts`; 40-item catalog ported into `data/jewellery.ts` (zero-diff verified against `data.js`); picsum.photos placeholder images (flagged for replacement); `lib/gradients.ts` |
| 5 | `48aa0f4` | Epic 5: Auth & Route Protection | Supabase browser/server clients; `proxy.ts` middleware; registration/login forms with validation; auth-aware header; protected `/favorites` and `/api/favorites` routes redirect to `/login` when logged out |
| 6 | `d7c6e0c` | Epic 6: Recommendation Engine & Screens | `lib/recommendation-engine.ts` ported per Migration Document §1.3 (intentionally diverges from live `app.js`); `RecommendationForm`, `ResultsGrid`, `RefilterBar`, `JewelleryCard`; 9-test Vitest suite with a locked regression baseline |
| — | `e91bb41` | Post-Epic-6 fix | Placeholder images actively misleading (random stock photos) — disabled via `SHOW_PLACEHOLDER_IMAGES = false`, gradient fallback shown instead |

**Note**: These commits pre-date the AIRE workflow being run against this repo (`aire-brownfield-inspect`
was first run 2026-09-29) — this table is a retrospective reconstruction from commit messages
and verified against the current code in `docs/architecture/current/`, not a forward plan.

## Functional Requirements

### Recommendation Flow
- The system SHALL accept recipient age (1–80), relationship (self/daughter/mother/wife/friend/sister),
  occasion (birthday/wedding/anniversary/festival/everyday/graduation), budget (₹1,000–₹200,000),
  and an optional style preference (minimal/traditional/statement/modern). (Epic 6)
- The system SHALL score each catalog item and return up to 6 top-ranked items, excluding items
  over budget by default. (Epic 6)
- The system SHALL provide a one-line "why this pick" explanation per recommended item, driven by
  age bracket and heirloom-context logic. (Epic 6)
- The system SHALL allow the user to refine budget/style on the results screen without resubmitting
  the full form (URL-param-driven refilter). (Epic 6)

### Authentication
- The system SHALL allow a visitor to register with email/password (8+ chars, letter+number),
  detecting duplicate emails including Supabase's anti-enumeration "empty identities" response. (Epic 5)
- The system SHALL require email confirmation before a session is granted. (Epic 2, Epic 5)
- The system SHALL allow a registered user to log in, showing a generic "Invalid login credentials"
  message on failure (no user-enumeration leak). (Epic 5)
- The system SHALL redirect unauthenticated requests to `/favorites` or `/api/favorites` to
  `/login?redirectedFrom=<path>`, and redirect an already-authenticated user away from `/login`/`/register`. (Epic 5)

### Favorites
- The system SHALL persist a user's favorited items in `public.favorites` (user_id, jewellery_item_id),
  enforced by RLS so a user can only read/insert/delete their own rows. (Epic 2, Migration Document §3.3)
- The system SHALL expose `GET/POST/DELETE app/api/favorites/route.ts` (list / add / remove a
  favorite), using the server Supabase client, with RLS as defense-in-depth behind the route's own
  auth check. (Migration Document §2, §8 Step 6)
- The system SHALL show a favorite-toggle control on `JewelleryCard` that redirects a logged-out
  user to `/login` and calls the favorites API when logged in. (Migration Document §5)
- The system SHALL provide a protected `app/favorites/page.tsx` rendering the user's saved items
  in the same grid style as results. (Migration Document §2, §8 Step 6)
- **Confirmed gap** (not an open decision — a planned deliverable not yet built): `aura/app/api/favorites`
  contains only a `.gitkeep`. This is the clear next epic per the Migration Document's own plan.
- **Known design constraint carried from the document** (§9 item 8, unresolved by the team so
  far): favorites are scoped only by `(user_id, jewellery_item_id)` — favoriting the same item
  while shopping for two different relationships/occasions collapses to one row. Confirm with the
  user before building whether this remains acceptable or needs richer scoping.

### Design System
- The system SHALL present the "warm luxury" visual identity (cream/ivory/gold/rose/ink palette,
  18px corner radius, soft shadows, Playfair Display + Poppins typography) consistently across
  all screens, built on Tailwind v4 `@theme` tokens + shadcn/ui primitives. (Epic 3)

## Success Criteria (Measurable)

1. `npm run build`, `npm run lint`, and `tsc --noEmit` pass with zero errors on `aura/`. (per Epic 1/4/5 verification notes)
2. `npm run test` (Vitest) passes 100% — currently 9/9 tests in `recommendation-engine.test.ts`. (Epic 6)
3. The regression-baseline test (age 34/wife/wedding/budget 200000/no style → ids `[16,17,18,37,36,19]`)
   continues to pass unless deliberately updated with a documented reason. (Epic 6)
4. `curl` against `/favorites` and `/api/favorites` while logged out returns a 307 redirect to
   `/login?redirectedFrom=...`; `/` remains open to guests. (Epic 5 verification)
5. A real Supabase signUp/signInWithPassword round-trip confirms email confirmation is enforced
   and wrong-password returns the generic error message. (Epic 5 verification)

## Failure Criteria (Explicit)

1. Any change that silently alters the recommendation engine's scoring weights/order without
   updating the locked regression-baseline test and documenting why.
2. Any change that reintroduces `app.js`'s scoring logic (or blends it with the active engine)
   as if it were the "real"/authoritative one — the Migration Document (§9 item 7) already
   settles this: `aura/lib/recommendation-engine.ts`'s design is the approved target, `app.js` is
   superseded legacy. Treat this as decided, not as something to re-litigate per-change.
3. Any change to `public.favorites` RLS policies that allows a user to read/write another user's
   favorite rows.
4. Any regression to the existing route-protection behavior (`/favorites`, `/api/favorites`
   becoming accessible while logged out, or `/login`/`/register` becoming accessible while logged in).
5. Introducing a new NPM dependency or external image host (e.g., reinstating picsum.photos)
   without the user's explicit approval, given the prior placeholder-image incident.

## Technical Constraints

- **Stack is fixed**: Next.js 16 App Router (doc specifies 14+; 16 installed per Epic 1's own
  documented deviation), React 19, TypeScript strict mode, Tailwind v4 (`@theme`-based, no
  `tailwind.config.ts` — another documented deviation from the doc's `tailwind.config.ts`
  assumption), Supabase (`@supabase/ssr`) — no framework swaps.
- **Source-of-truth document now available**: `SPEC/references/Aura-Migration-Document-Vanilla-JS-Next.jsTypeScriptSupabase.pdf`
  (converted to `.md` alongside it via `aire read`). Per the brownfield rulebook, this must be
  strictly followed for anything it specifies — do not suggest alternatives to what it defines,
  only flag genuinely ambiguous points.
- **Still explicitly open per the document's own §9 "Risks/Gaps"** (not resolved by any epic to
  date — confirm with the user before building anything that touches these):
  - Exact password policy (doc assumes 8+ chars, 1 letter, 1 number — confirm or adjust, and match Supabase's own configurable minimum).
  - Password reset ("Forgot password?") flow — not in the original step plan, only a placeholder link exists in `LoginForm`.
  - Dataset location (static file vs. a `jewellery_items` Postgres table) — currently static, per the "no backend for recommendations" constraint; flag before any change that would need an admin-editable catalog.
  - Relationship-scoped favorites (see Functional Requirements → Favorites above).
  - Rate limiting/abuse protection on auth routes — not addressed by the document or by any epic so far.
  - `allowOverBudget` parameter on `getRecommendations` — ported as an unused, harmless capability; not a bug, do not "clean it up" without confirming a new UI affordance is wanted.
- **CORRECTED (2026-09-29, during Story 7.1 implementation)**: this document previously claimed
  no `.env.example` existed in `aura/`. That was wrong — `aura/.env.local.example` already exists
  and lists all 3 vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`). `SUPABASE_SERVICE_ROLE_KEY` is still not referenced by any code in
  `aura/` as of Story 7.1 — the favorites API route uses the RLS-enforced anon-key client, not the
  service role, so the elevated key remains unused. No action needed unless a future feature
  requires bypassing RLS.
- **Middleware file is named `proxy.ts`**, not `middleware.ts` — a documented, deliberate Next.js 16
  convention change (the doc assumed `middleware.ts`); do not "fix" this by renaming it back.

## Quality Gates

- All Vitest tests pass (100%) — currently only `lib/recommendation-engine.test.ts` exists.
- `tsc --noEmit`, `eslint`, and `next build` all pass clean.
- New code follows the patterns catalogued in `docs/architecture/current/01-recommendation-engine-deep-dive.md`
  (pure-function business logic, URL-param-driven page state, RLS-enforced data access).
- **Coverage gap to close going forward**: no component/integration tests exist for
  `RecommendationForm`, `ResultsGrid`, `RefilterBar`, `JewelleryCard`, auth forms, or middleware
  route protection — any new epic touching these should add tests, not just extend the gap.

## Scope

### IN Scope (of this retrospective requirements capture)
- Documenting the 6 shipped epics and 1 post-Epic-6 fix as the system's build history.
- Surfacing the known gaps (favorites API missing, dual recommendation engines, missing Migration
  Document, disabled placeholder images) so they're tracked before further work begins.

### OUT of Scope
- Actually implementing the missing `app/api/favorites` route (confirmed as the next epic's
  scope; the design work happens in `aire-brownfield-architecture` / `aire-brownfield-plan`, not here).
- Re-opening the recommendation-engine choice — settled by the Migration Document itself (§9
  item 7); `aura/lib/recommendation-engine.ts` is authoritative.
- Sourcing real jewellery photography to replace picsum.photos placeholders.
- Decommissioning or archiving the legacy static app (`index.html`/`app.js`/`data.js`/`styles.css`)
  — the Migration Document treats it purely as the source analyzed for porting, with no
  decommission step in its plan; raise with the user separately if archival is wanted.
- Building a password-reset flow, moving the dataset into Postgres, or adding rate limiting —
  all explicitly flagged as undecided in the Migration Document §9, not assumed here.

### IMPACT Scope (indirect)
- Any future change to `lib/recommendation-engine.ts` scoring weights affects the locked
  regression-baseline test and every rendered "why" sentence.
- Any change to `public.favorites` RLS policies affects both the (currently unbuilt) favorites
  API and the existing `/favorites` protected page.
- Enabling `SHOW_PLACEHOLDER_IMAGES` again affects every `JewelleryCard` render across `/` and `/results`.

## Affected Modules

Project scaffold (`aura/` root config), Supabase integration (`lib/supabase/*`, `supabase/migrations/*`),
design system (`app/globals.css`, `components/ui/*`), domain types/data (`types/*`, `data/jewellery.ts`),
auth surface (`components/auth/*`, `app/login`, `app/register`, `app/auth/callback`), recommendation
engine + screens (`lib/recommendation-engine.ts`, `lib/format.ts`, `components/recommendations/*`,
`app/page.tsx`, `app/results/page.tsx`).

## Existing Patterns to Follow

See `docs/architecture/current/01-recommendation-engine-deep-dive.md` → Pattern Extraction:
- Deterministic, framework-free scoring functions (pure, no I/O, injectable item list for testing).
- Server-driven state via URL search params instead of a client-side state store.
- Co-located Vitest tests next to source, with locked regression baselines commented as
  "update deliberately, not silently."
- In-code breadcrumb comments explaining every deviation from spec (a norm across all 6 epics —
  continue this for any new work).

## Reference Files

- `SPEC/references/Aura-Migration-Document-Vanilla-JS-Next.jsTypeScriptSupabase.pdf` (converted
  to `.md` alongside it) — the authoritative migration spec for all 6 epics. Supersedes this
  document wherever the two conflict; this document should be revisited if the Migration Document
  is later updated or superseded.

## Known Divergence from the True Legacy App (2026-09-29, Epic 8 validation)

`docs/testing/validation-report-epic-8-2026-09-29.md` confirms, with file:line evidence, that the
Migration Document's own description of "the original app" is inaccurate in three areas, and that
`aura/` faithfully implemented the Migration Document's (inaccurate) description rather than the
true legacy code:

1. **Form defaults** — true legacy (`index.html`) defaults to age 25 / budget ₹50,000 / first
   dropdown option (`self`/`birthday`, no `selected` attribute); `aura/` uses age 28 / budget
   ₹40,000 / `wife`/`anniversary`, matching the Migration Document's (wrong) claim about the
   original.
2. **Design tokens** — every color/radius token in `aura/app/globals.css` differs from the true
   `styles.css` values (only `cream` matches exactly); `aura/` matches the Migration Document's
   §7.1 table, which itself mistranscribed the real CSS.
3. **Recommendation engine** (already documented above, repeated here for completeness) — the
   heirloom-skew test case's top-6 result set differs between the true `app.js` and
   `aura/lib/recommendation-engine.ts` by 2 of 6 items; this was an explicit, disclosed Epic 4/6
   decision (Migration Document §9 item 7), not new.

**None of these should be "fixed" by reverting to the true legacy values** — 3+ shipped epics
already build on the Migration Document's versions. This note exists so a future reader
understands which "original" is meant when this document or the Migration Document says
"matches the original."

---
---

# Epic 10 — Aura Shopping Flow (Product Detail → Cart → Address → Secure Checkout)

**Type**: Brownfield Enhancement (new feature set on a live system)
**Date**: 2026-10-08
**Source**: Helix solution 1080 — Epic document 5877 (v5) + 11 story documents (5878–5888) + tech spec 5875 + architecture map 5872 (empty template, not used). Local synced copy: `docs/helix/` (snapshot `synced_at: 2026-10-08`; manifest `docs/helix/INDEX.md`).
**Author**: ANALYST_PM_BROWNFIELD
**Status**: Approved (user, 2026-10-08)

> **Numbering.** Local Epic 10. Helix story numbers (1.1–4.3) are kept as "Helix X.Y" to avoid
> colliding with local Story 7.x docs. Mapping is in "Story Index" below.
> **Source of truth.** The Helix stories are the reference spec. Where this section adds to or
> corrects them, the addition is labelled **[ADDED]** (user-approved hardening) or **[CORRECTED]**
> (Helix text contradicts the real codebase). Nothing in a Helix story is silently dropped.
> **Decision record.** On 2026-10-08 the user delegated all open design decisions to the analyst
> ("whatever you think is best … make sure no error comes … database additions and migration
> should be done carefully"). The decisions below (D1–D9) are the analyst's recommendations,
> recorded so they can be revisited.

## Project Overview

Turn Aura from a recommendation tool into a purchase flow: card → product detail → cart
(localStorage, works for guests) → login → delivery address → checkout (Cash on Delivery or UPI ID)
→ order confirmation. Orders, order line items and one delivery address per user are persisted in
Supabase with RLS. 11 stories, 25 story points (Helix estimate).

## Decisions (D1–D9)

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | **Server-side price integrity [ADDED]**: `placeOrder` ignores client-sent prices/names. It accepts only `{ id, quantity }[]`, looks every item up in `JEWELLERY_ITEMS`, rejects unknown ids, quantities that are not integers in 1..10, empty carts, and duplicate ids, then computes subtotal/total itself. | Helix 4.2/tech-spec trust `JSON.parse` of browser data → a tampered price would create a cheap order. |
| D2 | **Server-side validation [ADDED]**: `saveAddress` and `placeOrder` validate on the server (phone `^[0-9]{10}$`, pincode `^[0-9]{6}$`, required fields trimmed and length-limited, UPI id format `^[A-Za-z0-9._-]{2,100}@[A-Za-z]{2,64}$`, payment method ∈ {cod, upi}). Client `pattern` attributes stay as UX only. | Client validation is bypassable. |
| D3 | **Atomic order creation [ADDED]**: order header + items are written in ONE database transaction via a Postgres function (`public.place_order`, `SECURITY INVOKER`, called with `supabase.rpc`), not two separate inserts. | Helix 4.2 inserts `orders` then `order_items`; a failure between them leaves an order with no items. |
| D4 | **Empty-cart guard [ADDED]**: `/checkout` shows a redirect/empty state when the cart is empty; Place Order is disabled and `placeOrder` rejects empty carts. | Helix 4.2 would allow a ₹0 order. |
| D5 | **No new npm dependencies.** Business logic (cart reducer, order validation/pricing, address validation) is implemented as pure functions in `lib/` and tested with the existing Vitest (node) setup. No jsdom / React Testing Library. UI components are verified by manual + QA validation, as in Epics 7–8. | Prior failure criterion #5: no new dependency without explicit approval. |
| D6 | **Route protection**: add `/checkout` and `/order-confirmation` to `PROTECTED_PATHS` in `lib/supabase/middleware.ts` (existing pattern), AND keep the in-page auth/address checks that Helix 3.3/3.2/4.3 specify (defense in depth, and the address check is not possible in the proxy). `/cart` and `/product/*` stay public. | Matches the codebase's centralized-guard pattern while honouring Helix. |
| D7 | **Numbering**: Epic 10; Helix story IDs kept as references (see Story Index). | Avoid collision with local 7.x. |
| D8 | **Sequencing vs Epic 9**: build and verify locally first. Migrations 0002/0003 are applied to the production Supabase project as an explicit deploy step after local verification and after Epic 9's Vercel/Supabase setup exists. | Epic 9 is still waiting on user dashboard actions; no production DB change is made without an explicit go. |
| D9 | **Roles**: no new auth roles; one derived state ("Authenticated User with saved address"). | See matrix. |

## Current System Context

**Architecture**: Next.js 16 App Router monolith (`aura/`), Supabase (auth + Postgres, RLS) via
`@supabase/ssr`; auth state refreshed in `proxy.ts` → `lib/supabase/middleware.ts`; client
helpers call `app/api/favorites` through `lib/favorites.ts`; business logic is pure functions
in `lib/`; tests are Vitest in node mode (`lib/*.test.ts` only).
**Verified facts** (read from code on 2026-10-08):
- `JEWELLERY_ITEMS` has **40** items (Helix text says 37 **[CORRECTED]** → 40; `generateStaticParams` must cover 40 and the "all 37" done-criteria become "all 40").
- Category union includes `"Hair Jewellery"`; `gradientForCategory(category: string)` exists in `lib/gradients.ts`.
- `SHOW_PLACEHOLDER_IMAGES = false` in `JewelleryCard`: product/cart/checkout screens use the gradient swatch, not `next/image` (no images on new screens).
- UI primitives present: `alert` (has `destructive`), `button` (`gradient`, `ghost`, `render={<Link/>}` pattern), `card`, `input`, `label`, `separator`, `select`, `slider`.
- `AuthHeader` is an async Server Component with `gap-3` button group.
- `app/layout.tsx` renders `<AuthHeader />` then `{children}`; there is no `CartProvider`.
- No `"use server"` Server Actions exist yet; no `context/` directory; migrations dir has only `0001_favorites.sql`.
- Favorite toggle logic lives inline in `JewelleryCard` (state + `listFavorites/addFavorite/removeFavorite`).
- `.env.local.example` exists; no new env vars are needed.
**Affected Modules**: see "Affected Modules" below.

## Roles & Permissions Matrix

| Role (canonical) | Description | Key Permissions (allow) | Explicitly Denied | Auth Source | Origin |
|------------------|-------------|--------------------------|--------------------|--------------|--------|
| Guest (unauthenticated) | Any visitor | Browse `/`, `/results`, `/product/[id]`, use cart (`cart:use-local`), view `/cart` | `/checkout`, `/checkout/address`, `/order-confirmation/*`, any order/address data | None (public routes; cart is browser-local) | Existing (cart permission New) |
| Authenticated User | Logged-in Supabase user | Everything Guest can do, plus favorites (existing), `address:read-own`, `address:write-own`, `order:create-own`, `order:read-own` | Another user's address/orders/order items (RLS `auth.uid() = user_id`); updating or deleting orders (no policy exists) | Supabase Auth (email/password) | Existing (new permission keys New) |

**Permission keys (new)**: `cart:use-local`, `address:read-own`, `address:write-own`, `order:create-own`, `order:read-own`.
**Notes**: "has a saved address" is a derived state, not a role. No admin/staff/fulfilment role is introduced; order status changes (`processing`/`shipped`/…) have no writer in this epic.

## Story Index

| Local ID | Helix ID (doc id) | Title | Pts | Depends on (Helix) |
|----------|-------------------|-------|-----|--------------------|
| 10.1 | 3.1 (5878) | Address DB Migration (`0002_user_addresses.sql`, `types/address.ts`) | 1 | — |
| 10.2 | 4.1 (5884) | Orders DB Migration (`0003_orders.sql`) + `place_order` function [ADDED] | 1 | — |
| 10.3 | 2.1 (5886) | CartContext (+ pure reducer in `lib/cart.ts`) | 3 | — |
| 10.4 | 1.1 (5880) | Clickable Jewellery Card | 1 | — |
| 10.5 | 1.2 (5879) | Product Detail Page | 3 | 1.1, 2.1 |
| 10.6 | 2.2 (5883) | Cart Icon in Header | 1 | 2.1 |
| 10.7 | 2.3 (5882) | Cart Page | 3 | 2.1 |
| 10.8 | 3.2 (5887) | Address Form & Server Action | 3 | 3.1 |
| 10.9 | 3.3 (5885) | Checkout Route Guard (guard-only `app/checkout/page.tsx`, extended by 10.10) | 2 | 2.1, 3.2 |
| 10.10 | 4.2 (5881) | Secure Checkout Page | 5 | 3.3, 4.1 |
| 10.11 | 4.3 (5888) | Order Confirmation Page | 2 | 4.2 |

Execution order: 10.1 → 10.2 → 10.3 → 10.4 → 10.5 → 10.6 → 10.7 → 10.8 → 10.9 → 10.10 → 10.11.

## Functional Requirements

### Product Detail (Helix 1.1, 1.2)
- The entire `JewelleryCard` SHALL navigate to `/product/{id}`; the heart button SHALL call `preventDefault()` + `stopPropagation()` and SHALL NOT navigate; card visuals unchanged (hover shadow allowed). Works on `/results` and `/favorites`. (Helix 1.1)
- `/product/[id]` SHALL render for all 40 catalog ids via `generateStaticParams()`, call `notFound()` for non-numeric/unknown ids (e.g. `/product/999`, `/product/abc`), and display gradient swatch, category, name, INR price, style chip, age range, tag chips, and an Add to Cart button. (Helix 1.2, corrected 37→40)
- Add to Cart SHALL call `useCart().addItem()` and show "Added to cart ✓" + "View Cart →" (`/cart`). (Helix 1.2)
- The product page SHALL include the favourite heart with the same behaviour as `JewelleryCard` (Helix 1.2 AC; missing from Helix's code snippet). **[CORRECTED]** The favorite logic is extracted into a shared hook (e.g. `useFavorite(itemId)`) used by both `JewelleryCard` and `ProductDetail`, with no behaviour change to the Epic 7 card (existing `lib/favorites.test.ts` must still pass).
- Back control SHALL use `router.back()`; if there is no in-app history it SHALL fall back to `/` (tech spec mentions "← Browse"). **[ADDED]**

### Cart (Helix 2.1, 2.2, 2.3)
- `CartContext` SHALL expose `items, addItem, removeItem, updateQty, clearCart, totalItems, totalPrice`; adding an existing item increments quantity; `updateQty(id, ≤0)` removes; `useCart()` outside the provider throws a descriptive error; `CartProvider` wraps `AuthHeader` + `{children}` in `app/layout.tsx`. (Helix 2.1)
- Cart state SHALL persist in `localStorage` key `aura_cart`, hydrated once on mount. **[CORRECTED]** Persistence MUST NOT write the initial empty state before hydration has completed (Helix's two-effect snippet overwrites the stored cart with `[]` and, under React StrictMode in dev, can lose the cart on refresh). Hydration SHALL also validate the stored JSON (array of `{id, name, category, price, imagePath, imageAlt, quantity}` with known ids and integer quantity 1..10) and discard anything malformed; all `localStorage` access SHALL be wrapped in try/catch (private mode / quota). **[ADDED]**
- Quantity SHALL be capped at 10 per item **[ADDED]** (consistent with D1); the stepper "+" stops at 10.
- Cart icon (`ShoppingBag`, lucide) SHALL show a rose badge with `totalItems` (hidden at 0, "9+" above 9) for guests and users, linking to `/cart`; implemented as a small client component so `AuthHeader` stays a Server Component. (Helix 2.2)
- `/cart` SHALL list items (swatch, category, name, unit price, − qty +, line total, remove), show item count and subtotal, show the empty state with "Browse Jewellery" → `/`, disable Proceed to Checkout when empty, send guests to `/login?redirectedFrom=/checkout`, and logged-in users to `/checkout`. (Helix 2.3)

### Address (Helix 3.1, 3.2, 3.3)
- `/checkout/address` SHALL be reachable only when logged in (guest → `/login?redirectedFrom=/checkout/address`), pre-fill an existing address (heading "Update Delivery Address") or show a blank form ("Add Delivery Address"), validate fields client- and server-side (D2), upsert one row per user, redirect to `/checkout` on success, show server errors in `<Alert variant="destructive">`, and Cancel → `/cart`. (Helix 3.2 + D2)
- `/checkout` SHALL route: logged out → `/login?redirectedFrom=/checkout`; logged in with no address → `/checkout/address`; logged in with address → render checkout; a user WITH an address is never blocked from `/checkout/address`. (Helix 3.3)
- Story 10.9 delivers the guard-only `app/checkout/page.tsx`; Story 10.10 extends the same file. **[CORRECTED]** (Helix lists 4.2 as depending on 3.3 while 3.3's code is the head of 4.2's page.)

### Checkout & Order (Helix 4.1, 4.2, 4.3)
- `/checkout` SHALL show Order Summary (lines, qty, line totals, "Free Delivery", Grand Total), Delivery Address with "Change" → `/checkout/address`, and Payment Method radios (Cash on Delivery; UPI with required UPI ID). Place Order is disabled until valid and shows "Placing Order…" while pending. (Helix 4.2)
- Empty cart on `/checkout` → redirect/empty state (D4).
- `placeOrder` SHALL follow D1–D3: authenticated user only; recompute prices server-side; one transactional insert; return the new order id; the client then calls `clearCart()` and routes to `/order-confirmation/{id}`. The cart is cleared only after the server confirms success. Errors surface in `<Alert variant="destructive">` with a generic message (no raw database error text shown to the user). **[ADDED]**
- Double-submit SHALL be prevented (button disabled while pending; server enforces by creating at most one order per request). **[ADDED]**
- `/order-confirmation/[id]` SHALL require login, return `notFound()` for unknown, malformed (non-UUID), or other users' order ids, and show success icon, `#` + last 8 chars of the id (upper-case), items with qty and price, Grand Total, payment method (UPI id shown), delivery address from the snapshot, "Estimated delivery: 5–7 business days", and "Continue Shopping" → `/`. (Helix 4.3)

## Database Requirements (careful-migration rules)

Only **additive** changes. No existing table (`favorites`) or policy is altered or dropped.

1. **`0002_user_addresses.sql`** — exactly the Helix 3.1 table/RLS (3 policies, `unique(user_id)`, update policy with `with check`). **[ADDED]** `check` constraints for `phone ~ '^[0-9]{10}$'` and `pincode ~ '^[0-9]{6}$'`, and `updated_at` maintained by the application on upsert.
2. **`0003_orders.sql`** — Helix 4.1 tables/RLS (select + insert policies only; **no update/delete policy** so users cannot alter or cancel orders from the client). **[ADDED]** `check (subtotal >= 0 and total >= 0)`, `check (jsonb_typeof(address_snapshot) = 'object')`, `check ((payment_method = 'upi') = (upi_id is not null))`, `quantity` upper bound `<= 10`, `price >= 0`, an index on `orders(user_id, created_at desc)` and `order_items(order_id)`.
3. **`public.place_order(p_payment_method text, p_upi_id text, p_items jsonb)`** — `SECURITY INVOKER` (RLS still applies; never `SECURITY DEFINER`), `set search_path = public`, `execute` granted to `authenticated` only (revoked from `public`/`anon`). It reads the caller's address from `user_addresses` (`auth.uid()`), builds the snapshot, inserts the order and items in one transaction, and returns the order id. Price authority stays in the application layer (the server action passes already-priced lines computed from `JEWELLERY_ITEMS`; the function re-checks `quantity` range and non-negative prices). Because the catalog is a static TS file, the database cannot independently verify prices — this limitation is accepted and documented.
4. **Safety procedure for every migration**: (a) written as plain SQL files in `aura/supabase/migrations/` matching the `0001` header style; (b) a paired rollback script `…_rollback.sql` kept beside it (drops only objects created by that migration); (c) first applied to a **non-production Supabase project / branch**, never first to production; (d) after applying, verify with a two-user RLS test (user A cannot select/insert/update user B's rows; guest/anon gets nothing), a CHECK-constraint rejection test, and a `place_order` success + rollback-on-failure test; (e) take a Supabase backup/point-in-time marker before applying to production; (f) production apply only after explicit user go-ahead (D8); (g) migrations are idempotent where cheap (`create … if not exists` is NOT used for policies, so re-running must be avoided — record applied state in `docs/status.md`).
5. `aire-data-design` SHALL be run before implementing 10.1/10.2 to produce the data model + contract + rollback plan.

## Success Criteria (Measurable)

1. `npm run build`, `npm run lint`, `tsc --noEmit` pass with zero errors; `npm run test` passes 100% (existing 16 tests unchanged + new tests).
2. Statement/branch coverage ≥85% on all new `lib/` business logic (cart reducer + storage hydration validation, order pricing/validation, address validation, UPI validation, route-protection path list). Component/route coverage is N/A without jsdom (D5) and replaced by documented manual + QA evidence per story.
3. `/product/1` … `/product/40` render (HTTP 200); `/product/999` and `/product/abc` return 404.
4. Cart survives refresh and navigation; adding the same item twice gives quantity 2; stored garbage in `aura_cart` does not crash the app (empty cart).
5. Logged out: `curl -I /checkout`, `/checkout/address`, `/order-confirmation/<uuid>` → 307 to `/login?redirectedFrom=…`; `/cart`, `/product/1` → 200.
6. Logged in, no address: `/checkout` → `/checkout/address`; after save → `/checkout`; with address → checkout renders.
7. A COD order and a UPI order each create exactly one `orders` row and the correct number of `order_items` rows; `total` equals the server-computed sum even if the request body contains altered prices (tamper test).
8. Forced failure inside `place_order` leaves zero new `orders`/`order_items` rows (atomicity test).
9. User B cannot read user A's address, order, or order items (RLS test) and cannot open A's `/order-confirmation/{id}` (404).
10. Full happy-path smoke test from the Helix epic ("Full Happy Path Test", 12 steps) passes end-to-end.

## Failure Criteria (Explicit)

1. Any order whose stored total differs from the server-computed catalog total.
2. Any order without items, or items without an order (non-atomic write).
3. Any RLS gap that exposes another user's address/order data, or any policy allowing client UPDATE/DELETE on orders.
4. Any regression in Epics 5–7: auth redirects, favorites API/RLS, `/favorites` page, favorite toggle on cards, recommendation engine regression baseline `[16,17,18,37,36,19]`.
5. Any change to existing `favorites` table/policies or the recommendation engine.
6. A new npm dependency, a new env var, or `SUPABASE_SERVICE_ROLE_KEY` use without explicit approval.
7. Raw database/Supabase error text shown to end users; secrets or full UPI ids written to logs.
8. A migration applied to production before being verified on a non-production database, or without a rollback script.
9. Cart lost on refresh, or cart cleared before the server confirmed the order.
10. Any `TODO` comments or placeholder code in delivered work (Production-Ready).

## Technical Constraints

- **Patterns to follow**: pure-function business logic + co-located Vitest tests; URL/redirect conventions `?redirectedFrom=`; RLS-enforced data access with the per-request server client (`lib/supabase/server.ts`); API/response conventions from `docs/architecture/design/03-patterns-and-standards-brownfield.md`; in-code breadcrumb comments for every deviation from Helix; `Button render={<Link/>}` pattern; design tokens (`rounded-aura-xl`, `border-border-soft`, `bg-ivory`, `shadow-soft`, `text-gold`, `font-serif`, `formatINR`).
- **Server Actions** are new to this codebase; they SHALL return typed results (`{ ok: true, … } | { ok: false, error }`) instead of throwing across the boundary, and SHALL NOT swallow framework `redirect()` — redirect either happens outside any try/catch or the action returns the target path for the client to navigate. **[CORRECTED]** (Helix wraps `saveAddress`/`placeOrder` in client `try/catch`, which can swallow Next's redirect signal.)
- **Database**: Supabase Postgres; additive migrations only; see "Database Requirements".
- **Money**: INR integers (rupees), consistent with catalog; no paise, no tax/shipping (delivery always "Free").
- **Payments**: COD and UPI **id capture only**. No payment gateway, no charge, no verification of the UPI id; order status defaults to `confirmed`. This must be stated on-screen as "UPI ID is recorded; payment is collected on delivery/confirmation" — wording to be finalized in UI/UX (OPEN-1).
- **Test coverage**: minimum 85%; tests location `aura/lib/*.test.ts` (Vitest, node).
- **PII**: addresses, phone numbers and UPI ids are personal data; stored only in RLS-protected tables; never logged.

## Quality Gates

- All tests pass (100%), coverage ≥85% on new `lib/` logic, build/lint/tsc clean.
- Each story: TDD for logic, per-story review doc in `docs/stories-implemented/`, evidence pasted (test output, curl status codes, SQL verification output).
- Migration gate: non-production verification output + rollback script reviewed before any production apply.
- Code review (`aire-review-code`) before QA; QA validation (`aire-qa-validate`) with the 12-step smoke test; regression run (`aire-qa-regression`).
- No TODO comments; follows existing patterns.

## Explicit Scope

### IN Scope
- All 11 Helix stories (10.1–10.11) plus D1–D4 hardening, the `place_order` function, the shared `useFavorite` hook, `lib/cart.ts`, `lib/checkout.ts` (validation + pricing) and their tests.
- `proxy.ts` / `lib/supabase/middleware.ts` protected-path additions (D6).
- Documentation updates: `docs/status.md`, per-story review docs, data-design doc.

### OUT of Scope
- Real payment processing (gateway, UPI collect/intent, refunds), payment verification webhooks.
- Order history list page, order cancel/edit, order status updates, admin/fulfilment, emails/SMS.
- Multiple addresses per user, address book, pincode serviceability, tax/shipping rules.
- Server-side/synced carts, cart merge on login, stock/inventory.
- Real product photography; moving the catalog to Postgres; rate limiting; password reset.
- Production deployment/migration apply (separate explicit step; Epic 9).
- Any change to the recommendation engine, favorites schema or favorites API contract.

### IMPACT Scope (indirect)
- `JewelleryCard` (anchor wrapper): nested interactive element (heart `<button>` inside `<Link>`) — keyboard/focus behaviour and click handling must be re-verified on `/results` and `/favorites`; Epic 7.2 behaviour must not regress.
- `app/layout.tsx` provider wrapping affects every page's render tree (hydration/SSR).
- `AuthHeader` layout (extra icon) at narrow widths.
- `proxy.ts` matcher/protected paths affect auth redirects site-wide.
- Epic 9 deployment: production needs migrations 0002/0003 applied and the same env vars; smoke test (Story 9.3) should be extended to cover this flow.
- Epic 8 baseline: no visual changes to the existing screens other than the header cart icon and card hover shadow.

## Affected Modules

New: `aura/context/CartContext.tsx`, `aura/lib/cart.ts`, `aura/lib/checkout.ts`, `aura/lib/useFavorite` (hook), `aura/types/address.ts`, `aura/components/cart/*`, `aura/app/product/[id]/*`, `aura/app/cart/page.tsx`, `aura/app/checkout/*` (incl. `address/`, `actions.ts`), `aura/app/order-confirmation/[id]/page.tsx`, `aura/supabase/migrations/0002_*.sql`, `0003_*.sql` (+ rollbacks).
Modified: `components/recommendations/JewelleryCard.tsx`, `components/auth/AuthHeader.tsx`, `app/layout.tsx`, `lib/supabase/middleware.ts`.
Untouched (must stay so): `lib/recommendation-engine.ts`, `lib/favorites.ts`, `app/api/favorites/*`, `supabase/migrations/0001_favorites.sql`, `data/jewellery.ts`.

## Existing Patterns to Follow

| Pattern | Reference |
|---------|-----------|
| Pure-function logic + co-located Vitest + locked regression baselines | `docs/architecture/current/01-recommendation-engine-deep-dive.md` |
| RLS as enforcement point; per-request server client | `aura/supabase/migrations/0001_favorites.sql`, `aura/app/api/favorites/route.ts` |
| Centralized route protection + `redirectedFrom` | `aura/lib/supabase/middleware.ts` |
| API/response, error-handling and testing standards | `docs/architecture/design/03-patterns-and-standards-brownfield.md` |
| Breadcrumb comments for deviations from the spec | all Epics 1–8 |

## Design References

**Location**: `SPEC/references/` holds only the Migration Document (no UI mocks). UI is specified by the Helix stories' markup (design tokens listed above) and the Helix "Design System Reference". No Figma/screenshots exist for these screens; `aire-ui-ux-design` is recommended before implementation (see OPEN-1).

## Reference Files

- `docs/helix/INDEX.md` and `docs/helix/documents/*` — snapshot of Helix solution 1080 (2026-10-08). Epic = `epic-aura-shopping-flow.md`; stories = `story-*.md`; the tech spec (`aura-shopping-flow-feature-specs.md`) is older — **where it disagrees with a story, the story wins** (e.g. `placeOrder` return value/error handling, `user_addresses` update policy `with check`).
- `SPEC/references/Aura-Migration-Document-…` — unchanged authority for Epics 1–8.

## Open Items (do not block approval; resolve in later steps)

- **OPEN-1** (UI/UX): ✅ RESOLVED 2026-10-08 in `docs/ui-ux/ui-ux-spec.md` — UPI wording: “Your UPI ID is saved with this order. No payment is taken on this page.”; COD: “Pay when your order arrives.”
- **OPEN-2** (Helix hygiene): Helix epic still says 37 items and Story 1.2 ids "all 37"; optionally update Helix after approval (not done automatically; Helix writes need explicit confirmation).
- **OPEN-3** (data-design): final column constraints/index list for 0002/0003 — finalized in `aire-data-design`.
