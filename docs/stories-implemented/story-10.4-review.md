# Story 10.4 — Clickable Jewellery Card — Review

**Date**: 2026-10-08 | **Helix**: Story 1.1 (doc 5880) | **Status**: ✅ Done (2026-10-08) — automated gates passed; all 5 browser checks PASSED (user, 2026-10-08)

## What Was Implemented
- `aura/lib/login-redirect.ts` (new, pure): `buildLoginRedirect(pathname, query)` — the exact `/login?redirectedFrom=<encoded>` format Epic 7 used.
- `aura/lib/use-favorite.ts` (new, `"use client"`): `useFavorite(itemId)` — the favorite logic moved out of `JewelleryCard` unchanged (signed-in check, `listFavorites` initial state, optimistic toggle with rollback, guest → login redirect).
- `aura/components/recommendations/JewelleryCard.tsx`: whole card wrapped in `<Link href={`/product/${item.id}`}>`; heart `onClick` calls `preventDefault()` + `stopPropagation()` then `toggleFavorite()`; hover shadow added; heart now has a 44×44px hit area around the unchanged 32px visual circle (UI/UX spec); link has a visible focus ring (`gold-deep`).
- Tests: `aura/lib/login-redirect.test.ts` (4). Coverage config: React hooks `lib/use-*.ts` excluded from coverage (no DOM harness — verified manually/QA).

## Patterns Applied
Pure logic split from React (patterns §E10.9); no new dependency; breadcrumb comments for the extraction; Epic 7 files untouched.

## Testing Summary (actual output)
```
npm run test          → Test Files 4 passed (4) | Tests 66 passed (66)   (62 before + 4 new; all 16 Epic 1–8 tests unchanged)
npm run test:coverage → lib/ 93.16% stmts | 89.53% branch ; lib/cart.ts 100/93 ; login-redirect.ts 100%
npm run lint          → 0 errors / 0 warnings
npx tsc --noEmit      → clean
npm run build         → ✓ Compiled successfully; ✓ Generating static pages (10/10)
SSR check: GET /results?age=34&relationship=wife&occasion=wedding&budget=200000 → 200
   6 product links → ids [16,17,18,37,36,19]  (= locked regression baseline order, engine unchanged)
   6 of 6 cards have the heart <button type="button"> inside the link; prices still rendered
```

## DoD Evidence
### Gate 1 — Spec Echo
| # | Requirement | Proof |
|---|---|---|
| AC1 | Entire card wrapped in `<Link href={`/product/${item.id}`}>` from `next/link` | `JewelleryCard.tsx:5` (import), `:39-42` (Link), SSR: 6/6 anchors `href="/product/N"` |
| AC2 | Click anywhere except the heart navigates to `/product/[id]` | anchor wraps the whole `<Card>` (`JewelleryCard.tsx:39-…`); **browser click check pending** |
| AC3 | Heart calls `e.stopPropagation()` and `e.preventDefault()` | `JewelleryCard.tsx:65-66` |
| AC4 | Card visual appearance unchanged (hover shadow allowed) | only additions: `transition-shadow group-hover:shadow-md` (`:43`), heart wrapper span keeps `h-8 w-8 rounded-full bg-ivory/80` (`:72`) at the same centre (button `right-1.5 top-1.5 h-11 w-11` ⇒ same 28px offset as the old `right-3 top-3 h-8 w-8`); **visual check pending (browser)** |
| AC5 | Works in results and favourites grids | both render `JewelleryCard` (`ResultsGrid.tsx`, `app/favorites/page.tsx` unchanged); results verified by SSR; **favorites page browser check pending** |
| AC6 (local) | Favorite logic moved to `useFavorite`, zero behaviour change | `use-favorite.ts:14-67` is the old code line-for-line (only `item.id`→`itemId`, redirect built by `buildLoginRedirect`); `buildLoginRedirect` regression test equals the Epic 7 string |
| AC7 (local) | Existing `lib/favorites.test.ts` untouched and green | `git diff --stat -- lib/favorites.ts lib/favorites.test.ts` empty; 16/16 legacy tests pass |
| UI/UX | Heart hit area ≥44px, visual size unchanged | `JewelleryCard.tsx:69` (`h-11 w-11`) around `:72` (`h-8 w-8`) |
| UI/UX | Visible focus ring on the link | `JewelleryCard.tsx:41` (`focus-visible:ring-2 … ring-gold-deep`) |
| Steps 1–4 | tests first (watched fail: "Cannot find package '@/lib/use-favorite'" → later module path), hook, card refactor, manual verification | commands above; manual pending |
| Quality | build/lint/tsc/tests | outputs above |

### Gate 2 — Negative-Space
| Rule | Check | Result |
|---|---|---|
| Must not change favorites lib/API/page, ResultsGrid, engine, catalog | `git diff --stat -- lib/favorites.ts lib/favorites.test.ts app/api app/favorites components/recommendations/ResultsGrid.tsx lib/recommendation-engine.ts data \| wc -l` | **0** |
| No TODO/FIXME/console | grep in the 3 files | **0** |
| No new styles besides hover/focus/hit-area | diff review of className changes | only `group block rounded-aura-xl outline-none focus-visible:…`, `transition-shadow group-hover:shadow-md`, heart wrapper classes |
| Heart must not navigate | handler calls `preventDefault`+`stopPropagation` (`:65-66`); `type="button"` (SSR check) | ✅ code-level; **browser check pending** |
| No product page yet (404 expected until 10.5) | not created | ✅ |

### Gate 3 — Contract Consistency
| Hook (producer) | Card (consumer) | Epic 7 behaviour |
|---|---|---|
| returns `{ isFavorited, toggleFavorite }` | uses both; aria-label by `isFavorited`; heart fill by `isFavorited` | same labels/classes as before ✅ |
| `buildLoginRedirect(pathname, query)` | called by hook only | equals the old inline string (test) ✅ |
| `useFavorite(item.id)` effect deps `[itemId]` | was `[item.id]` | same ✅ |

## Challenges / Decisions
- Hook body can't be unit-tested without a DOM harness (D5), so the only pure piece (`buildLoginRedirect`) was split into `login-redirect.ts` to give honest coverage numbers; hooks are excluded from the coverage report and verified manually/QA.
- **AA-GAP-2 (logged, not changed)**: the card price keeps `text-gold` (2.67:1 on ivory) because Helix AC says "card visual appearance unchanged" and this is existing Epic 6 UI. Candidate app-wide follow-up together with AA-GAP-1 (use `text-gold-deep`).
- Anchor-wrapping the card puts a `<button>` inside an `<a>` (accepted in architecture §10.13); keyboard behaviour must be confirmed in the browser.

## Manual checks (browser) — RESULT: all 5 PASSED (user confirmed 2026-10-08)
1. Open `/results?age=34&relationship=wife&occasion=wedding&budget=200000`. Cards look the same as before (heart in the same place).
2. Click a card body → URL becomes `/product/<id>` (a 404 page is **expected** until Story 10.5).
3. Click a heart → **no navigation**; as a guest you go to `/login?redirectedFrom=…`; signed in (`usera@test.dev`), the heart fills and the row appears in auradev → `favorites`.
4. Keyboard: Tab to a heart, press Enter/Space → toggles, does **not** navigate; Tab to the card link shows a gold focus ring; Enter on the link opens the product URL.
5. Open `/favorites` (signed in): clicking a card opens `/product/<id>`; heart still toggles.

## Next Steps
After the manual checks → mark 10.4 ✅ → **10.1 (Address DB migration, needs auradev)** or **10.5 (Product Detail)**, per your choice.
