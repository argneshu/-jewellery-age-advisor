# Story 10.8 — Address Form & Server Action — Review

**Date**: 2026-10-08 | **Helix**: Story 3.2 (doc 5887) | **Status**: ✅ Done — automated checks passed; manual save/edit check confirmed by the user on dev Supabase (row created, second save updated the same single row, prefill + Cancel OK)

## What Was Implemented
- `aura/lib/checkout.ts`: `ActionResult`, `validateAddressInput`, `formDataToObject`, `toAddressRow`, `rowToUserAddress` (pure; shared by browser form and server action).
- `aura/app/checkout/address/page.tsx`: server page; guest → `/login?redirectedFrom=/checkout/address`; existing address read with `.maybeSingle()`; query error thrown to Next's error boundary; title "Update/Add Delivery Address".
- `aura/app/checkout/address/AddressForm.tsx`: `noValidate`, shared validators on submit, inline errors with `aria-invalid`/`aria-describedby`, focus on first invalid field, destructive `Alert`, fields disabled while pending, `inputMode`/`autoComplete` hints, responsive grid, Cancel → `/cart`; `useActionState(saveAddress, null)` with no try/catch wrapper.
- `aura/app/checkout/address/actions.ts`: `saveAddress` — `getUser()`, server-side validation, upsert `onConflict: user_id`, generic error text (error code only logged), `redirect('/checkout')` last and outside try/catch.

## Testing Summary (actual output)
```
npm run test            → Test Files 7 passed (7) | Tests 170 passed (170)
vitest --coverage (lib/checkout.ts) → Statements 100% (48/48) | Branches 100% (39/39) | Functions 100% (6/6) | Lines 100% (34/34)
npx tsc --noEmit        → clean
npm run lint            → clean
npm run build           → ✓ Generating static pages (52/52); ƒ /checkout/address in route list
Guest: curl -I /checkout/address (next start) → HTTP 307 → /login?redirectedFrom=/checkout/address
grep TODO|FIXME in app/checkout, lib/checkout.ts → 0
git diff --stat -- lib/recommendation-engine.ts lib/favorites.ts app/api data | wc -l → 0
```

## DoD Evidence
| AC | Proof |
|---|---|
| Signed-in only; guest redirected with `redirectedFrom` | `page.tsx` + proxy; curl 307 above |
| Pre-filled "Update…" / blank "Add…" | `page.tsx` title + `existing` → `defaultValue`; **manual check pending** |
| Fields + browser & server validation | `AddressForm.tsx` + `saveAddress` both call `validateAddressInput`; 100% coverage |
| Upsert one row per user, redirect `/checkout`, Alert errors, Cancel → `/cart` | `actions.ts`; **DB check pending** |
| Typed result, no throw, no raw DB text, redirect outside try/catch | `actions.ts` (error code only logged) |

**Negative-space**: no multiple addresses / pincode lookup / delete; earlier-epic files untouched (0); no TODO/FIXME.
**Contract**: field names in `AddressForm` ↔ `validateAddressInput` keys ↔ `toAddressRow` columns ↔ migration 0002 CHECKs (phone 10 digits, pincode 6, length limits) are identical.

## Pending manual checks (dev Supabase, ~3 minutes)
1. Signed in, open `/checkout/address` → blank form, title "Add Delivery Address". Submit empty → inline errors, focus on Full Name.
2. Fill validly → Save → lands on `/checkout` (404 expected until 10.9/10.10). A row exists in `user_addresses` for your user.
3. Reopen `/checkout/address` → pre-filled, title "Update Delivery Address". Change city, save → same row updated, still **one** row.
4. Cancel → `/cart`. As guest → login redirect.

## Next Steps
After the checks → mark 10.8 ✅ → **10.9 (Checkout Route Guard)**.
