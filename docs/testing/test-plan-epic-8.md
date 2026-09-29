# Test Plan - Scope: Epic 8

**Source**: Helix solution document 4937 ("Epic 8: Verify Against Original Screenshots") — no local
`docs/plans/stories/epic-8-*.md` files exist; Epic 8 is verification-only per its own scope
statement ("any defect found here is fixed by reopening the relevant story in Epics 3, 6, or 7,
not by adding new scope here").
**Date**: 2026-09-29
**Author**: QA

---

## Scope

Visual and behavioral parity between the rebuilt Next.js app (`aura/`) and the true legacy static
app (`index.html`, `styles.css`, `app.js`, `data.js` at the repo root) — 3 stories:

- Story 8.1 — Visual parity check: form screen
- Story 8.2 — Visual and behavioral parity check: results screen
- Story 8.3 — Functional regression pass (refilter, no-results, formatting)

---

## Requirements Traceability

| Story | AC | Test Category |
|-------|-----|----------------|
| 8.1 | Default slider/select values, colors, spacing, fonts match original | Visual/manual diff |
| 8.1 | Discrepancies logged with screenshot, linked to responsible story | Documentation |
| 8.2 | Card layout, gradient/image treatment, "why" text style match original | Visual/manual diff |
| 8.2 | Wedding+wife test case (age 34, budget ₹2,00,000) produces same top-ranked set as original | Automated (script-based comparison) |
| 8.3 | Re-filter live-updates grid | Manual/code review |
| 8.3 | No-results message appears under same conditions | Manual/code review |
| 8.3 | Prices display in `₹XX,XXX` Indian-locale format | Code review + unit test |

---

## Test Categories

- **Automated**: scripted side-by-side execution of the legacy `recommend()` vs. `getRecommendations()` for the fixed test case (both are pure functions — directly comparable without a browser).
- **Manual/code review**: since no visual-regression tool (Percy, Playwright screenshot diffing) exists in this repo, visual parity is assessed by comparing actual source values (CSS custom properties, HTML defaults) side by side — not literal screenshots. This is disclosed as a scope limitation.
- **Documentation**: every discrepancy found is logged with severity and the file:line evidence for both sides.

---

## Test Scenarios

### Story 8.1 — Form screen parity
1. Compare `index.html`'s default input values against `aura/components/recommendations/RecommendationForm.tsx`'s `useState` defaults.
2. Compare `styles.css`'s `:root` custom properties against `aura/app/globals.css`'s `--aura-*` tokens.
3. Compare header copy (`index.html`'s `.tagline`) against `aura/components/auth/AuthHeader.tsx`'s tagline text.

### Story 8.2 — Results screen parity
1. Run the legacy `recommend()` function (via a Node `vm` context, since it has no build step) against the fixed test case (age 34, wife, wedding, budget ₹200,000, no style) and capture the top-6 item ids + scores.
2. Compare against `aura/lib/recommendation-engine.test.ts`'s locked regression baseline (`[16, 17, 18, 37, 36, 19]`) for the same inputs.
3. Compare card layout structure (`index.html`'s `.card`/`.card-image`/`.card-body` vs. `aura`'s `JewelleryCard.tsx`'s `Card`/image-block/`CardContent`).

### Story 8.3 — Functional regression
1. Code review: `RefilterBar.tsx`'s `router.replace` on searchParams change vs. legacy `applyRefilter()`'s direct re-render — confirm both re-render results on budget/style change without a full page reload.
2. Code review + live check: `ResultsGrid.tsx`'s empty-state message vs. legacy's `#no-results` text — compare wording and trigger condition.
3. Unit-level comparison: `lib/format.ts`'s `formatINR` vs. legacy's `formatPrice` — both `"₹" + n.toLocaleString("en-IN")`.

---

## Test Data Requirements

- Fixed test case: `{ age: 34, relationship: "wife", occasion: "wedding", budget: 200000, style: "" }` — this is the same input the Migration Document and `recommendation-engine.test.ts` already treat as the canonical regression case.
- No additional test data/accounts needed — this is a static-file and source-comparison exercise, not a live-session test (that's covered by the Epic 7 follow-up recommendation already noted in the Story 7.1-7.3 reviews).

## Environment Requirements

- Legacy app: read directly from `index.html`/`styles.css`/`app.js`/`data.js` at the repo root (no server needed — pure static files and a Node `vm` context for the scoring functions).
- Rebuilt app: `aura/` dev server (`npm run dev`, already used for Epic 7 verification).

---

## Quality Gates

- No 🔴 Critical or 🟠 High severity findings (would block).
- 🟡 Medium/🟢 Low findings are acceptable for release with documentation, per the QA rulebook's Release Decision rules — expected here given the repo's established pattern of Migration-Document-vs-actual-code drift (already seen twice: the recommendation-engine schema in Epic 4/6, and now expected again for design tokens/defaults in Epic 3).

---

**Next**: Run `aire-qa-validate` (scope: epic 8) against this plan.
