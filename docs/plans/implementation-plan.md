# Jewellery Age Advisor (Aura) - Implementation Plan

**Project**: Jewellery Age Advisor (Aura) — Favorites Completion | **Version**: 1.0 | **Created**: 2026-09-29
**Author**: PRODUCT_OWNER | **Status**: AWAITING

---

## Dependency Graph

```mermaid
graph TD
  classDef wave1 fill:#D4EDDA,stroke:#28A745
  classDef wave2 fill:#FFF3CD,stroke:#FFC107
  classDef wave3 fill:#F8D7DA,stroke:#DC3545

  S1_1["1.1 Favorites API Route"]:::wave1
  S1_2["1.2 Favorite Toggle (JewelleryCard)"]:::wave2
  S1_3["1.3 Favorites Page"]:::wave2
  S1_4["1.4 Integration Verification"]:::wave3

  S1_1 --> S1_2
  S1_1 --> S1_3
  S1_2 --> S1_4
  S1_3 --> S1_4
```

**Wave Summary**

| Wave | Stories | Independent? | Notes |
|------|---------|---------------|-------|
| 1 | 1.1 | Root | Favorites API route — nothing else can start without it |
| 2 | 1.2, 1.3 | Yes — disjoint files | Frontend toggle and favorites page are independent of each other |
| 3 | 1.4 | No | Integration verification — requires both wave-2 stories done |

**Wave Workload Distribution** (team_size: 1)

| Wave | Stories | Per Dev | Dev Assignments | Notes |
|------|---------|---------|-------------------|-------|
| 1 | 1 | 1 | Dev-1: [1.1] | ✅ Active |
| 2 | 2 | 2 | Dev-1: [1.2, 1.3] | ✅ Active (solo dev takes both, in either order) |
| 3 | 1 | 1 | Dev-1: [1.4] | ✅ Active |

Full graph: `docs/plans/dependency-graph.yml`

---

## 1. Overview

**Success Criteria** (from `docs/requirements.md` and `docs/architecture/design/02-target-architecture-brownfield.md`):
1. `GET/POST/DELETE /api/favorites` implemented, authenticated, RLS-backed, matching the API contract in the target architecture.
2. `JewelleryCard` has a working favorite toggle: redirects guests to `/login`, calls the API for authenticated users.
3. `/favorites` renders the signed-in user's saved items in the existing results-grid visual style.
4. `npm run test`, `npm run lint`, `tsc --noEmit`, and `next build` all pass clean.
5. No regressions to existing recommendation, auth, or route-protection behavior.

**Epic Breakdown**:
- Epic 1: Favorites Completion - Complete the favorites feature end-to-end (API → frontend toggle → page → verification), the one confirmed gap identified across discovery, deep-dive, requirements, target architecture, and patterns.

---

## EPIC 1: FAVORITES COMPLETION

**Owner**: DEV | **Goal**: Ship the favorites feature exactly as specified in the Aura Migration Document (§2, §5, §8 Step 6) and the approved target architecture — a working favorite/unfavorite flow backed by the existing `public.favorites` table and RLS.

**Must Read References**:
- `SPEC/references/Aura-Migration-Document-Vanilla-JS-Next.jsTypeScriptSupabase.md` — §2 (target file tree), §3.3 (schema/RLS), §5 (component table), §8 Step 6 (favorites plan)
- `docs/architecture/design/02-target-architecture-brownfield.md` — API contract, security design, technical decisions
- `docs/architecture/design/03-patterns-and-standards-brownfield.md` — error handling, API design, testing patterns

**Prerequisites**: `public.favorites` table + RLS (already exists, Epic 2 historical), `proxy.ts` route protection (already exists, Epic 5 historical), Supabase server/client helpers (already exist)
**Completion**: All 4 stories done; `npm run test`/`lint`/`build` clean; manual verification per Story 1.4 passes

---

### Story 1.1: Favorites API Route (GET/POST/DELETE)
**File**: `docs/plans/stories/epic-1-story-1.1-Favorites-API-Route.md`
One-line objective: Implement the authenticated `app/api/favorites/route.ts` handler backing all favorites reads/writes.

### Story 1.2: Favorite Toggle on JewelleryCard
**File**: `docs/plans/stories/epic-1-story-1.2-Favorite-Toggle-JewelleryCard.md`
One-line objective: Add a favorite/unfavorite control to `JewelleryCard` that redirects guests to `/login` and calls the new API for signed-in users.

### Story 1.3: Favorites Page
**Tracked in Helix** (not authored as a local story file — see note below).
One-line objective: Build the protected `/favorites` page that lists the signed-in user's saved items in the existing card-grid style.

### Story 1.4: Favorites Feature Integration Verification
**Tracked in Helix** (not authored as a local story file — see note below).
One-line objective: End-to-end manual + automated verification that favorites works across guest/auth states, RLS isolation, and existing-feature regressions.

> **Note (2026-09-29)**: Story authoring stopped after 1.1/1.2 — the user confirmed epics/stories for this
> project are already tracked in Helix UI. `docs/plans/dependency-graph.yml` still reflects the full
> 4-story plan (1.1–1.4) for reference, but only 1.1 and 1.2 have local story files under
> `docs/plans/stories/`. Story 1.3 and 1.4 should be picked up from Helix, not re-authored here.

---

## Quality Gates

**Per Story**: Patterns followed (per `docs/architecture/design/03-patterns-and-standards-brownfield.md`), tests pass, ESLint 0 errors, AC met, self-review
**Per Epic**: All 4 stories done, `npm run test`/`lint`/`build` pass, favorites feature works end-to-end, docs updated
**Final**: Epic 1 done, coverage ≥85% on new code, 0 ESLint errors, manual UAT (Story 1.4) passed

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| No existing test harness for Next.js Route Handlers or React components in this repo | M | Story 1.1/1.2 use mocked-`fetch` unit tests only (per patterns doc §8); flag component/route-handler test harness as a separate future improvement, not silently expanded here |
| `jewellery_item_id` has no DB foreign key to the static catalog | L | Story 1.3 must guard against a favorited id no longer present in `data/jewellery.ts` (e.g., filter out unresolvable ids rather than crashing) |
| RLS misconfiguration could leak cross-user favorites | H | Story 1.4's manual verification explicitly tests cross-user isolation before sign-off |

---

## Project Tracking

**Tracking**: GitHub Projects
**Repo**: argneshu/-jewellery-age-advisor
