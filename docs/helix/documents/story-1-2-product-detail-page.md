---
helix_id: "5879"
title: "Story 1.2 — Product Detail Page"
solution_id: "1080"
synced_at: "2026-10-08"
helix_metadata: { artifact_type: "story", visibility: "team", lifecycle_state: "CURRENT", version: 1, parent_registry_id: 5877, created_by: "Argneshu Gupta", created_at: "2026-10-08T10:15:00.428561+00:00", updated_by: null, updated_at: "2026-10-08T10:15:00.428561+00:00" }
---

# Story 1.2 — Product Detail Page

**Epic:** Aura Shopping Flow
**Feature:** Product Detail
**Points:** 3
**Status:** TO DO
**Depends On:** Story 1.1, Story 2.1 (CartContext)

---

## User Story

> As a shopper, when I click on a jewellery card I want to see a dedicated product detail page with full item information and an "Add to Cart" button so I can decide to purchase.

---

## Acceptance Criteria

- [ ] Route `/product/[id]` renders for any valid item ID from `JEWELLERY_ITEMS`
- [ ] If the ID does not match any item, Next.js `notFound()` is called (404 page)
- [ ] Page displays: product image (gradient fallback), category badge, item name, price (formatted INR), style tag, age range, tags as chips
- [ ] Prominent **"Add to Cart"** button (variant="gradient", full-width on mobile)
- [ ] Clicking "Add to Cart" calls `useCart().addItem()` and shows inline confirmation: "Added to cart ✓" with a "View Cart →" link to `/cart`
- [ ] Favourite heart button present with same logic as in `JewelleryCard`
- [ ] Back navigation: `← Back` button using `router.back()`
- [ ] `generateStaticParams()` exported for static generation of all 37 product pages

---

## Files to Create

```
-jewellery-age-advisor/aura/app/product/[id]/page.tsx
-jewellery-age-advisor/aura/app/product/[id]/ProductDetail.tsx
```

---

## Implementation

```tsx
// app/product/[id]/page.tsx — Server Component
import { notFound } from "next/navigation";
import { JEWELLERY_ITEMS } from "@/data/jewellery";
import { ProductDetail } from "./ProductDetail";

export function generateStaticParams() {
  return JEWELLERY_ITEMS.map((item) => ({ id: String(item.id) }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = JEWELLERY_ITEMS.find((i) => i.id === Number(id));
  if (!item) notFound();
  return <ProductDetail item={item} />;
}
```

```tsx
// app/product/[id]/ProductDetail.tsx — Client Component
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";
import { gradientForCategory } from "@/lib/gradients";
import { useCart } from "@/context/CartContext";
import type { JewelleryItem } from "@/types/jewellery";

export function ProductDetail({ item }: { item: JewelleryItem }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    addItem({
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      imagePath: item.imagePath,
      imageAlt: item.imageAlt,
    });
    setAdded(true);
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1 text-sm text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid gap-10 md:grid-cols-2">
        <div
          className="aspect-square w-full rounded-aura-xl"
          style={{ background: gradientForCategory(item.category) }}
        />
        <div className="flex flex-col gap-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{item.category}</p>
          <h1 className="font-serif text-3xl text-ink">{item.name}</h1>
          <p className="text-2xl font-semibold text-gold">{formatINR(item.price)}</p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-border-soft px-3 py-1 text-xs text-ink-soft">{item.style}</span>
            <span className="rounded-full border border-border-soft px-3 py-1 text-xs text-ink-soft">Ages {item.ageMin}–{item.ageMax}</span>
            {item.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-ivory px-3 py-1 text-xs text-ink-soft">{tag}</span>
            ))}
          </div>
          {added ? (
            <div className="flex items-center gap-3 rounded-aura-xl bg-ivory p-4">
              <span className="text-sm font-medium text-ink">Added to cart ✓</span>
              <Link href="/cart" className="text-sm font-semibold text-gold hover:underline">View Cart →</Link>
            </div>
          ) : (
            <Button variant="gradient" className="w-full" onClick={handleAddToCart}>
              <ShoppingBag size={18} className="mr-2" /> Add to Cart
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
```

---

## Definition of Done

- [ ] `/product/[id]` renders for all 37 item IDs
- [ ] `/product/999` returns 404
- [ ] "Add to Cart" updates CartContext and shows confirmation
- [ ] `generateStaticParams()` exported
- [ ] No TypeScript errors

---

## Referenced Paths

### High Relevance
- `-jewellery-age-advisor/aura/data/jewellery.ts` - JEWELLERY_ITEMS source of truth
- `-jewellery-age-advisor/aura/types/jewellery.ts` - JewelleryItem interface
- `-jewellery-age-advisor/aura/lib/gradients.ts` - gradientForCategory() for image fallback
- `-jewellery-age-advisor/aura/lib/format.ts` - formatINR() for price display

### Medium Relevance
- `-jewellery-age-advisor/aura/components/ui/button.tsx` - Button with gradient variant

### Low Relevance
- `-jewellery-age-advisor/aura/app/results/page.tsx` - Page layout pattern reference
