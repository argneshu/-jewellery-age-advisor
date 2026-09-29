# Validation Report - Scope: Epic 8

**Date**: 2026-09-29
**Author**: QA
**Test Plan**: `docs/testing/test-plan-epic-8.md`
**Source Stories**: Helix solution document 4937

---

## Executive Summary

Epic 8 verifies the rebuilt `aura/` app against the **true legacy code** (`index.html`,
`styles.css`, `app.js`, `data.js`), not against the Migration Document's *description* of that
legacy code. This distinction matters: the validation found that several of the Migration
Document's own claims about "the original" (default form values, design token hex values, the
heirloom-skew test case's expected result set) do not match the actual legacy files — a pattern
already identified twice before in this repository (Epic 4/6's recommendation-engine schema
divergence, documented in `docs/requirements.md`). This is the third instance of the same root
cause: the Migration Document was written from an earlier, since-diverged analysis pass.

**Overall result**: 🟡 **CONDITIONAL** — no critical/high defects; several medium/low cosmetic and
copy discrepancies found, all traceable to Migration Document inaccuracies rather than Epic 3/6/7
implementation errors. None block release per the QA rulebook's Release Decision rules, but should
be explicitly acknowledged (not silently fixed against the wrong target) before Epic 9 (Deploy).

---

## Requirements Coverage

| Story | AC | Result | Evidence |
|-------|-----|--------|----------|
| 8.1 | Default slider/select values match original | ❌ FAIL (documented — see Issues) | `index.html:21-51` vs `RecommendationForm.tsx:46-50` |
| 8.1 | Colors/radius match original | ❌ FAIL (documented — see Issues) | `styles.css:1-13` vs `aura/app/globals.css:67-76` |
| 8.1 | Discrepancies logged with evidence | ✅ PASS | This report |
| 8.2 | Card layout/gradient/why-text style match original | ✅ PASS (structurally equivalent) | See Issues #4 for one cosmetic note |
| 8.2 | Wedding+wife test case produces same top-ranked set | ❌ FAIL (accepted deviation — see Issues) | Script output below |
| 8.3 | Re-filter live-updates grid | ✅ PASS | `RefilterBar.tsx:36-40` (`router.replace` on param change) vs `app.js:156-166` (`applyRefilter`) — both re-render on budget/style change without full reload |
| 8.3 | No-results message appears under same conditions | ✅ PASS (trigger condition), 🟢 wording differs | See Issues #5 |
| 8.3 | Prices in `₹XX,XXX` Indian-locale format | ✅ PASS — identical implementation | `lib/format.ts:4` (`"₹" + n.toLocaleString("en-IN")`) = `app.js:83-85`'s `formatPrice` |

---

## Test Execution Summary

**Automated (scripted comparison)**:
```
Legacy top 6 ids (age 34, wife, wedding, budget 200000, no style): [16, 17, 37, 19, 22, 34]
  16: Polki Bridal Necklace Set (score 115)
  17: Kundan Heirloom Choker (score 115)
  37: Traditional Gold Maang Tikka (score 115)
  19: Gold Investment Bangles (Pair) (score 95)
  22: Investment Gold Chain (score 95)
  34: Festival Kundan Earrings (score 95)

aura's locked regression baseline (same inputs, per lib/recommendation-engine.test.ts):
  [16, 17, 18, 37, 36, 19]
```
Overlap: 4 of 6 items (16, 17, 19, 37) appear in both sets; order differs; 2 items differ (legacy's
22, 34 vs. aura's 18, 36).

**Code review**: `RefilterBar.tsx`, `ResultsGrid.tsx`, `lib/format.ts`, `RecommendationForm.tsx`,
`aura/app/globals.css` read against their legacy counterparts (`app.js`, `styles.css`, `index.html`).

**Manual**: dev server (`npm run dev`) confirmed running and serving `/`, `/results`, `/favorites`
during this validation session (reused from the Epic 7 verification session).

---

## Quality Gate Status

| Gate | Target | Actual | Status |
|------|--------|--------|--------|
| Critical Bugs | 0 open | 0 | ✅ |
| High Bugs | 0 open | 0 | ✅ |
| Medium Bugs | — | 3 (documented below) | 🟡 acceptable with documentation |
| Low Bugs | — | 1 (documented below) | ✅ safe to release |

---

## Functional Testing Results

- **Refilter**: ✅ confirmed via code review — both implementations re-score and re-render on
  budget/style change without a full page reload.
- **No-results condition**: ✅ triggers identically (budget too low for any in-range item after
  filtering) — see Issue #5 for wording-only difference.
- **Price formatting**: ✅ byte-for-byte equivalent logic.

---

## Issues Found

### Issue #1 — Form default values don't match true legacy (🟡 Medium)
**Found**: `aura/components/recommendations/RecommendationForm.tsx:46-50` defaults to
`age=28, budget=40000, relationship="wife", occasion="anniversary"`. The true legacy
`index.html:21-51` defaults to `age=25` (`value="25"`), `budget=50000` (`value="50000"`), and no
`selected` attribute on any `<option>` for relationship/occasion — meaning the browser defaults to
the *first* option in each list, i.e. `self`/`birthday`.
**Root cause**: The Migration Document's own Epic 8 acceptance criteria claims the original
defaults are "age 28, budget ₹40,000... `wife`, `anniversary`" — this claim is itself wrong, and
Epic 6's implementation faithfully followed the (incorrect) documented claim rather than the real
`index.html`. Same root cause as the Epic 4/6 recommendation-engine schema divergence already
documented in `docs/requirements.md`.
**Fix location**: This is NOT a defect to silently "fix" — it requires a product decision (keep
the Migration Document's chosen defaults, which arguably represent more common real-world
searches — 28/wife/anniversary is a very plausible default persona — vs. reverting to the true
legacy's arbitrary browser-default behavior). Recommend flagging to the user rather than
auto-correcting.

### Issue #2 — Design token hex values don't match true legacy (🟡 Medium)
**Found**: Every color token in `aura/app/globals.css:67-76` differs from `styles.css:1-13`'s true
values:

| Token | True legacy (`styles.css`) | Migration Doc §7.1 claimed "original" | `aura` actual |
|---|---|---|---|
| cream | `#fbf6ee` | `#FBF6EE` | `#fbf6ee` ✅ matches |
| ivory | `#f4ead9` | `#FFFDF8` | `#fffdf8` ❌ |
| gold | `#c9a24b` | `#C6952C` | `#c6952c` ❌ |
| gold accent | `#a9822f` (gold-**deep**) | `#E8C874` (gold-**light**) | `#e8c874` ❌ (also inverted light/dark role) |
| rose-gold | `#d9a79c` | `#B76E79` | `#b76e79` ❌ |
| rose accent | `#b97e70` (rose-**deep**) | `#E8B4BC` (rose-**light**) | `#e8b4bc` ❌ (also inverted) |
| ink | `#3a2f22` | `#2B2420` | `#2b2420` ❌ (close) |
| ink-muted/soft | `#7a6c58` | `#6B5F53` | `#6b5f53` ❌ (close) |
| border | `#e6d8bd` | `#E9DFCB` | `#e9dfcb` ❌ (very close) |
| radius | `14px` | `18px` | `18px` ❌ |

**Root cause**: Identical pattern to Issue #1 — the Migration Document's §7.1 "Current CSS
variable" column mistranscribed the real `styles.css` values, and Epic 3 (per its own commit
message) ported the *documented* values, not the real ones — without disclosing this as a
deviation the way Epic 4 did for the dataset schema.
**Assessment**: The overall warm-cream/gold/ink mood is preserved directionally (same color
*family*), but exact values differ across the board — cream is the only literal match. This is a
genuine, previously-undisclosed drift from "the original," though visually in the same aesthetic
territory, not a jarring departure.

### Issue #3 — Heirloom-skew test case produces a different top-6 set (🟡 Medium — accepted, not new)
**Found**: See Test Execution Summary — 4 of 6 items overlap, order differs, 2 items differ.
**Root cause**: This is the **already-known, already-decided** divergence between
`app.js`'s `scoreItem`/`recommend` and `aura/lib/recommendation-engine.ts`'s `heirloomSkew`-based
design, explicitly resolved in the Migration Document's own §9 item 7 ("Epic 4 data-model
correction... Per an explicit decision, Epic 4 kept this document's schema... rather than
reshaping to match the live code exactly"). **This is not a new defect** — Epic 6's commit message
already disclosed and accepted this divergence. Included here only to give Epic 8's validation a
concrete, measured answer to its own AC, which technically fails as literally worded but was never
expected to pass given the prior, documented decision.

### Issue #4 — Card visual structure: cosmetic note only (🟢 Low)
**Found**: Legacy `.card-image` is a fixed `height: 140px` band; `aura`'s `JewelleryCard.tsx` uses
`aspect-square` (1:1 ratio) for its image block. Both are gradient-filled placeholder blocks (no
real images in either, per the known placeholder-image situation). Structurally equivalent
(image/gradient block → name → category → price → why-text), but the image area's proportions
differ.
**Assessment**: Cosmetic only, doesn't affect functionality or the overall "curated card grid"
impression. Not linked to any story for a mandatory fix — noted for awareness only.

### Issue #5 — No-results message wording differs (🟢 Low)
**Found**: Legacy: `"No pieces match these filters — try widening your budget or style."`
(`index.html:94`). `aura`: `"No pieces match this budget yet — try widening the range."`
(`ResultsGrid.tsx:32-34`). Trigger condition is identical (budget too low for any in-range item);
only the copy differs, and `aura`'s wording is arguably more precise (the legacy message mentions
"style" even though style is never the reason the pool becomes empty, since only budget filters
the pool before scoring in either implementation).
**Assessment**: Low severity, arguably an improvement, not a regression.

---

## Test Evidence

- Script output (Issue #3): captured above in Test Execution Summary — reproducible via a Node
  `vm`-context script running the true `app.js`/`data.js` against the fixed test case (script not
  committed, ephemeral verification only, per this repo's established pattern from the Epic 7
  verification scripts).
- File:line citations throughout Issues #1-#5, each comparing a real legacy source line against
  the corresponding `aura/` source line.

## Recommendations

1. **Do not "fix" Issues #1-#3 by reverting to the true legacy values** — the current `aura/`
   behavior reflects deliberate (if under-disclosed) product decisions already baked into 3 shipped
   epics. Reverting now would be a larger, riskier change than accepting the drift.
2. **Do add a short note to `docs/requirements.md` or a new decision record** stating explicitly:
   "the rebuilt app's design tokens, form defaults, and recommendation-engine weights intentionally
   diverge from the true legacy app in several respects; the Migration Document's own description
   of 'the original' was itself inaccurate in these areas." This closes the loop opened by the
   Epic 4/6 disclosure and extends it to Epic 3/8's findings, so a future reader isn't confused
   about which "original" is meant.
3. **Issues #4 and #5 need no action** — cosmetic/copy-only, arguably neutral-to-positive.
4. Epic 9 (Deploy) may proceed once this report is acknowledged — no blockers found.

## Sign-Off

**Result**: 🟡 CONDITIONAL PASS — no critical/high defects; 3 medium findings (all pre-existing,
now formally documented rather than newly introduced) and 2 low findings (cosmetic/copy, one
arguably an improvement). Recommend proceeding to Epic 9 once Recommendation #2 (documentation)
is addressed.
