---
helix_id: "5880"
title: "Story 1.1 — Clickable Jewellery Card"
solution_id: "1080"
synced_at: "2026-10-08"
helix_metadata: { artifact_type: "story", visibility: "team", lifecycle_state: "CURRENT", version: 1, parent_registry_id: 5877, created_by: "Argneshu Gupta", created_at: "2026-10-08T10:15:00.540934+00:00", updated_by: null, updated_at: "2026-10-08T10:15:00.540934+00:00" }
---

# Story 1.1 — Clickable Jewellery Card

**Epic:** Aura Shopping Flow
**Feature:** Product Detail
**Points:** 1
**Status:** TO DO
**Depends On:** —

---

## User Story

> As a shopper browsing the results or favourites grid, I want to click on a jewellery card so that I am taken to the product detail page for that item.

---

## Background

`JewelleryCard` is used in two places:
- `app/results/page.tsx` → via `ResultsGrid`
- `app/favorites/page.tsx`

Currently the card is **not clickable** for navigation — only the heart (favourite) button is interactive. This story makes the entire card a navigation link to `/product/[id]`.

---

## Acceptance Criteria

- [ ] The entire `JewelleryCard` is wrapped in `<Link href={`/product/${item.id}`}>` from `next/link`
- [ ] Clicking anywhere on the card (except the heart button) navigates to `/product/[item.id]`
- [ ] The heart (favourite) button calls `e.stopPropagation()` and `e.preventDefault()` to prevent triggering navigation
- [ ] Card visual appearance is unchanged — no new styles added
- [ ] Works correctly in both the results grid and the favourites grid

---

## Files to Modify

```
-jewellery-age-advisor/aura/components/recommendations/JewelleryCard.tsx
```

---

## Implementation

```tsx
// JewelleryCard.tsx — wrap the outer <Card> in a Link
import Link from "next/link";

<Link href={`/product/${item.id}`} className="block group">
  <Card className="overflow-hidden rounded-aura-xl border-border-soft bg-ivory shadow-soft
                   transition-shadow group-hover:shadow-md">
    {/* ... existing card content ... */}

    {/* Heart button — prevent navigation */}
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleToggleFavorite();
      }}
      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-ivory/80"
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart size={20} className={isFavorited ? "fill-rose text-rose" : "text-ink-soft"} />
    </button>
  </Card>
</Link>
```

---

## Definition of Done

- [ ] `JewelleryCard` wrapped in `<Link href="/product/[id]">`
- [ ] Heart button has `e.preventDefault()` + `e.stopPropagation()`
- [ ] Card renders identically visually (subtle hover shadow acceptable)
- [ ] No TypeScript errors
- [ ] Tested in results grid and favourites grid

---

## Referenced Paths

### High Relevance
- `-jewellery-age-advisor/aura/components/recommendations/JewelleryCard.tsx` - The only file modified in this story

### Medium Relevance
- `-jewellery-age-advisor/aura/components/recommendations/ResultsGrid.tsx` - Renders JewelleryCard; verify no breaking change
- `-jewellery-age-advisor/aura/app/favorites/page.tsx` - Second place JewelleryCard is rendered

### Low Relevance
- `-jewellery-age-advisor/aura/types/jewellery.ts` - JewelleryItem.id type (number) used in href
