---
helix_id: "5885"
title: "Story 3.3 — Checkout Route Guard"
solution_id: "1080"
synced_at: "2026-10-08"
helix_metadata: { artifact_type: "story", visibility: "team", lifecycle_state: "CURRENT", version: 1, parent_registry_id: 5877, created_by: "Argneshu Gupta", created_at: "2026-10-08T10:15:00.797365+00:00", updated_by: null, updated_at: "2026-10-08T10:15:00.797365+00:00" }
---

# Story 3.3 — Checkout Route Guard

**Epic:** Aura Shopping Flow
**Feature:** Address Management
**Points:** 2
**Status:** TO DO
**Depends On:** Story 2.1 (CartContext), Story 3.2 (Address Form)

---

## User Story

> As a shopper clicking "Proceed to Checkout", I want the system to check whether I'm logged in and have a saved address, and route me to the right place automatically.

---

## Routing Matrix

| User State | Destination |
|---|---|
| Not logged in | `/login?redirectedFrom=/checkout` |
| Logged in, **no address** | `/checkout/address` |
| Logged in, **address saved** | `/checkout` (render checkout) |

---

## Acceptance Criteria

- [ ] `/checkout` Server Component performs auth + address check server-side (cannot be bypassed client-side)
- [ ] `CartSummary`'s button does a lightweight client-side auth check before navigating (avoids round-trip for guests)
- [ ] After saving address (`saveAddress` in Story 3.2), user automatically lands on `/checkout`
- [ ] A logged-in user who visits `/checkout/address` when they already have an address is **not** blocked — they can update it

---

## Implementation

```tsx
// app/checkout/page.tsx — top of Server Component (full page in Story 4.2)
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function CheckoutPage() {
  const supabase = await createClient();

  // Guard 1: Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectedFrom=/checkout");

  // Guard 2: Address
  const { data: address } = await supabase
    .from("user_addresses").select("id").eq("user_id", user.id).single();
  if (!address) redirect("/checkout/address");

  // Render checkout (Story 4.2)...
}
```

The client-side pre-check in `CartSummary.tsx` (Story 2.3) only checks auth — the server handles the address redirect.

---

## Definition of Done

- [ ] Visiting `/checkout` without login → `/login?redirectedFrom=/checkout`
- [ ] Visiting `/checkout` logged in, no address → `/checkout/address`
- [ ] Visiting `/checkout` logged in with address → checkout page renders
- [ ] `CartSummary` redirects guests to login client-side
- [ ] No TypeScript errors

---

## Referenced Paths

### High Relevance
- `-jewellery-age-advisor/aura/lib/supabase/server.ts` - Server client for both guard checks
- `-jewellery-age-advisor/aura/app/favorites/page.tsx` - Auth guard redirect pattern to replicate

### Medium Relevance
- `-jewellery-age-advisor/aura/lib/supabase/client.ts` - Client-side auth check in CartSummary
- `-jewellery-age-advisor/aura/proxy.ts` - Middleware auth guard reference

### Low Relevance
- `-jewellery-age-advisor/aura/app/auth/callback/route.ts` - Auth flow reference
