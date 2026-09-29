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
- **No `.env.example` in `aura/`** — `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  are only discoverable by reading `lib/supabase/*.ts` source. The Migration Document's own file
  tree (§2) specifies `.env.local` with a third var, `SUPABASE_SERVICE_ROLE_KEY` (server-only) —
  not currently referenced anywhere in `aura/`'s code; confirm whether it's needed yet (likely
  only once `app/api/favorites` is built, if it needs elevated privileges beyond RLS).
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
