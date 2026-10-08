---
helix_id: "5883"
title: "Story 2.2 — Cart Icon in Header"
solution_id: "1080"
synced_at: "2026-10-08"
helix_metadata: { artifact_type: "story", visibility: "team", lifecycle_state: "CURRENT", version: 1, parent_registry_id: 5877, created_by: "Argneshu Gupta", created_at: "2026-10-08T10:15:00.693266+00:00", updated_by: null, updated_at: "2026-10-08T10:15:00.693266+00:00" }
---

# Story 2.2 — Cart Icon in Header

**Epic:** Aura Shopping Flow
**Feature:** Cart
**Points:** 1
**Status:** TO DO
**Depends On:** Story 2.1 (CartContext)

---

## User Story

> As a shopper, I want to see a cart icon in the header with a badge showing how many items are in my cart so I can always see my cart status and navigate to it.

---

## Acceptance Criteria

- [ ] `ShoppingBag` icon (lucide-react) appears in the top-right nav of `AuthHeader`
- [ ] Red badge with `totalItems` count appears when cart has items; disappears when empty
- [ ] Badge caps at "9+" for large carts
- [ ] Clicking the icon navigates to `/cart`
- [ ] Works for both logged-in and logged-out users

---

## Files to Create

```
-jewellery-age-advisor/aura/components/cart/CartIconLink.tsx
```

## Files to Modify

```
-jewellery-age-advisor/aura/components/auth/AuthHeader.tsx
```

---

## Challenge: AuthHeader is a Server Component

`AuthHeader` is `async` (calls `supabase.auth.getUser()`). Extract the cart icon as a small `"use client"` component so the server component boundary is preserved.

---

## Implementation

```tsx
// components/cart/CartIconLink.tsx
"use client";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";

export function CartIconLink() {
  const { totalItems } = useCart();
  return (
    <Link href="/cart" className="relative flex items-center" aria-label="View cart">
      <ShoppingBag size={22} className="text-ink-soft hover:text-ink transition-colors" />
      {totalItems > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center
                         rounded-full bg-rose text-[10px] font-semibold text-white leading-none">
          {totalItems > 9 ? "9+" : totalItems}
        </span>
      )}
    </Link>
  );
}
```

```tsx
// AuthHeader.tsx — import CartIconLink and add to nav
import { CartIconLink } from "@/components/cart/CartIconLink";

// In the nav div:
<div className="flex shrink-0 items-center gap-4">
  <CartIconLink />
  {user ? (
    // ... existing logout section
  ) : (
    // ... existing sign-in / register buttons
  )}
</div>
```

---

## Definition of Done

- [ ] `components/cart/CartIconLink.tsx` created as client component
- [ ] `AuthHeader.tsx` imports and renders `<CartIconLink />`
- [ ] Badge appears/disappears correctly based on cart state
- [ ] Badge shows "9+" for counts above 9
- [ ] No TypeScript errors

---

## Referenced Paths

### High Relevance
- `-jewellery-age-advisor/aura/components/auth/AuthHeader.tsx` - Modified to add CartIconLink

### Medium Relevance
- `-jewellery-age-advisor/aura/app/layout.tsx` - CartProvider must be in place (Story 2.1)

### Low Relevance
- `-jewellery-age-advisor/aura/package.json` - Confirms lucide-react is installed
