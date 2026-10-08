# Story 10.9 — Checkout Route Guard — Review

**Date**: 2026-10-08 | **Helix**: Story 3.3 (doc 5885) | **Status**: ✅ Done — automated + curl checks passed; signed-in routing matrix confirmed by the user

## What Was Implemented
- `aura/lib/supabase/route-rules.ts` (pure): `PROTECTED_PATHS` (+`/checkout`, `/order-confirmation`), `isProtectedPath`, `AUTH_ONLY_WHEN_LOGGED_OUT_PATHS`, `isAuthOnlyWhenLoggedOutPath`.
- `aura/lib/supabase/middleware.ts`: uses the shared rules; old-path behaviour unchanged.
- `aura/app/checkout/page.tsx`: guard-only page — guest → `/login?redirectedFrom=/checkout`; no address → `/checkout/address`; else minimal "Checkout" heading. `.maybeSingle()` instead of Helix `.single()`; query error thrown to Next's error boundary.

## Testing Summary (actual output)
```
TDD red: vitest lib/supabase → "Cannot find module './route-rules'" (1 failed file)
npm run test            → Test Files 8 passed (8) | Tests 193 passed (193)
coverage route-rules.ts → Statements 100% (5/5) | Branches 100% (2/2) | Functions 100% (3/3) | Lines 100% (4/4)
npx tsc --noEmit / npm run lint → clean
npm run build           → ✓ Compiled successfully; ƒ /checkout, ƒ /checkout/address in route list
curl (next start), guest:
  /checkout              -> 307 /login?redirectedFrom=%2Fcheckout
  /checkout/address      -> 307 /login?redirectedFrom=%2Fcheckout%2Faddress
  /order-confirmation/x  -> 307 /login?redirectedFrom=%2Forder-confirmation%2Fx
  /favorites, /api/favorites -> 307 (unchanged, Epic 5)
  /cart -> 200 ; /product/1 -> 200 ; /checkout-foo -> 404 (not protected)
TODO/FIXME in app/checkout, lib/supabase → 0 ; earlier-epic files diff → 0
```

## DoD Evidence
| AC | Proof |
|---|---|
| Logged out → login with redirectedFrom | curl 307 above; page.tsx |
| Logged in, no address → `/checkout/address`; with address → renders | page.tsx; **manual check pending** |
| `/checkout`, `/order-confirmation` proxy-protected; `/cart`, `/product/*` public | route-rules tests + curl |
| `isProtectedPath` pure; `/checkout-foo` not protected; Epic 5 unchanged | tests (look-alikes, Epic 5 paths) |
| Guard-only page | page.tsx (heading only) |
| User with address not blocked from `/checkout/address` | no guard on that page for existing address (10.8 verified) |

## Pending manual checks (dev account, ~2 minutes)
1. Signed in **with** an address: `/checkout` → page with "Checkout" heading.
2. Delete your row (`delete from public.user_addresses where user_id = auth.uid()` won't work in SQL editor — use Table Editor → delete the row). Reload `/checkout` → lands on `/checkout/address`.
3. Save an address there → lands on `/checkout` and the heading shows (the earlier 404 is gone).

## Next Steps
After checks → mark 10.9 ✅ → **10.10 (Secure Checkout Page)**.
