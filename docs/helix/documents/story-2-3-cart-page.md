---
helix_id: "5882"
title: "Story 2.3 — Cart Page"
solution_id: "1080"
synced_at: "2026-10-08"
helix_metadata: { artifact_type: "story", visibility: "team", lifecycle_state: "CURRENT", version: 1, parent_registry_id: 5877, created_by: "Argneshu Gupta", created_at: "2026-10-08T10:15:00.634765+00:00", updated_by: null, updated_at: "2026-10-08T10:15:00.634765+00:00" }
---

# Story 2.3 — Cart Page

**Epic:** Aura Shopping Flow
**Feature:** Cart
**Points:** 3
**Status:** TO DO
**Depends On:** Story 2.1 (CartContext)

---

## User Story

> As a shopper, I want to view all items in my cart with quantities and a subtotal, adjust quantities, remove items, and proceed to checkout.

---

## Acceptance Criteria

- [ ] `/cart` renders all items currently in the cart
- [ ] Each item row: gradient swatch, name, category, unit price, quantity stepper (− / +), line total, remove (×) button
- [ ] Tapping − at quantity 1 removes the item
- [ ] Cart summary shows subtotal and item count
- [ ] **"Proceed to Checkout"** button: disabled when cart is empty; redirects guests to `/login?redirectedFrom=/checkout`; navigates logged-in users to `/checkout`
- [ ] Empty cart shows friendly state with "Browse Jewellery" CTA → `/`

---

## Files to Create

```
-jewellery-age-advisor/aura/app/cart/page.tsx
-jewellery-age-advisor/aura/components/cart/CartItemRow.tsx
-jewellery-age-advisor/aura/components/cart/CartSummary.tsx
```

---

## Implementation

```tsx
// app/cart/page.tsx
"use client";
import { useCart } from "@/context/CartContext";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { CartSummary } from "@/components/cart/CartSummary";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const { items } = useCart();
  if (items.length === 0) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 flex flex-col items-center justify-center gap-6 py-20">
        <ShoppingBag size={48} className="text-ink-soft" />
        <h2 className="font-serif text-2xl text-ink">Your cart is empty</h2>
        <p className="text-sm text-ink-soft">Discover jewellery curated just for you</p>
        <Button variant="gradient" render={<Link href="/" />}>Browse Jewellery</Button>
      </main>
    );
  }
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16">
      <h2 className="mb-8 font-serif text-3xl text-ink">Your Cart</h2>
      <div className="space-y-4">
        {items.map((item) => <CartItemRow key={item.id} item={item} />)}
      </div>
      <CartSummary />
    </main>
  );
}
```

```tsx
// components/cart/CartItemRow.tsx
"use client";
import { Minus, Plus, X } from "lucide-react";
import { gradientForCategory } from "@/lib/gradients";
import { formatINR } from "@/lib/format";
import { useCart } from "@/context/CartContext";
import type { CartItem } from "@/context/CartContext";

export function CartItemRow({ item }: { item: CartItem }) {
  const { updateQty, removeItem } = useCart();
  return (
    <div className="flex items-center gap-4 rounded-aura-xl border border-border-soft bg-ivory p-4 shadow-soft">
      <div className="h-16 w-16 shrink-0 rounded-lg" style={{ background: gradientForCategory(item.category) }} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{item.category}</p>
        <p className="truncate font-serif text-base text-ink">{item.name}</p>
        <p className="text-sm font-semibold text-gold">{formatINR(item.price)}</p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => updateQty(item.id, item.quantity - 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-border-soft text-ink-soft hover:text-ink" aria-label="Decrease quantity"><Minus size={14} /></button>
        <span className="w-6 text-center text-sm font-medium text-ink">{item.quantity}</span>
        <button onClick={() => updateQty(item.id, item.quantity + 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-border-soft text-ink-soft hover:text-ink" aria-label="Increase quantity"><Plus size={14} /></button>
      </div>
      <p className="w-24 text-right text-sm font-semibold text-ink">{formatINR(item.price * item.quantity)}</p>
      <button onClick={() => removeItem(item.id)} className="text-ink-soft hover:text-rose transition-colors" aria-label={`Remove ${item.name}`}><X size={18} /></button>
    </div>
  );
}
```

```tsx
// components/cart/CartSummary.tsx
"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatINR } from "@/lib/format";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function CartSummary() {
  const { items, totalItems, totalPrice } = useCart();
  const router = useRouter();

  async function handleCheckout() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login?redirectedFrom=/checkout"); return; }
    router.push("/checkout");
  }

  return (
    <div className="mt-8 rounded-aura-xl border border-border-soft bg-ivory p-6 shadow-soft">
      <Separator className="mb-4" />
      <div className="flex justify-between text-sm text-ink-soft mb-1">
        <span>{totalItems} item{totalItems !== 1 ? "s" : ""}</span>
      </div>
      <div className="flex justify-between font-serif text-lg text-ink font-semibold">
        <span>Subtotal</span>
        <span className="text-gold">{formatINR(totalPrice)}</span>
      </div>
      <p className="mt-1 text-xs text-ink-soft">Delivery charges calculated at checkout</p>
      <Button variant="gradient" className="mt-6 w-full" disabled={items.length === 0} onClick={handleCheckout}>
        Proceed to Checkout
      </Button>
    </div>
  );
}
```

---

## Definition of Done

- [ ] `/cart` renders all cart items
- [ ] Qty stepper and remove work correctly
- [ ] Empty cart state with CTA
- [ ] "Proceed to Checkout" routes correctly for guests and logged-in users
- [ ] No TypeScript errors

---

## Referenced Paths

### High Relevance
- `-jewellery-age-advisor/aura/lib/gradients.ts` - gradientForCategory() for swatches
- `-jewellery-age-advisor/aura/lib/format.ts` - formatINR() for prices
- `-jewellery-age-advisor/aura/lib/supabase/client.ts` - Auth check in CartSummary

### Medium Relevance
- `-jewellery-age-advisor/aura/components/ui/button.tsx` - Button variants
- `-jewellery-age-advisor/aura/components/ui/separator.tsx` - Divider in summary

### Low Relevance
- `-jewellery-age-advisor/aura/app/favorites/page.tsx` - Page layout pattern
