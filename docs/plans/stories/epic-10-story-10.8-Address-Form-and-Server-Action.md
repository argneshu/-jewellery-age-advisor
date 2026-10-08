### Story 10.8: Address Form & Server Action

**File**: `docs/plans/stories/epic-10-story-10.8-Address-Form-and-Server-Action.md`

**Epic**: 10 - AURA SHOPPING FLOW | **ID**: 10.8 | **Date**: 2026-10-08 | **Jira**: LOCAL | **GitHub**: LOCAL | **BUILDID**: NO-CYCLE
**Helix**: Story 3.2 — solution 1080, document 5887 (local snapshot: `docs/helix/INDEX.md`; the Helix text is the base spec — read it first, it contains the full reference code)
**Wave**: 5
**Requires**: ["10.1"]
**Enables**: ["10.9"]
**Files Touched**:
  - aura/lib/checkout.ts
  - aura/lib/checkout.test.ts
  - aura/app/checkout/address/page.tsx
  - aura/app/checkout/address/AddressForm.tsx
  - aura/app/checkout/address/actions.ts
**Roles Ref**: docs/requirements.md#roles--permissions-matrix — Authenticated User
**QA Candidate**: Yes — **Observable:** address form that saves and pre-fills.

> **How to read this story.** The Helix story already holds the complete user story, implementation code and Definition of Done (same precedent as Story 7.3, which was implemented straight from Helix). This file records only what the local plan adds: ownership, order, and every **deviation from Helix** (D1–D9 in `docs/requirements.md`, architecture §10, patterns §E10). Where this file and Helix differ, **this file wins**.

#### 👤 User Reference

**Description**: Let a signed-in shopper save one delivery address (and edit it later).

**Acceptance Criteria**:
- [ ] `/checkout/address` is for signed-in users only (guest → `/login?redirectedFrom=/checkout/address`).
- [ ] Pre-filled with “Update Delivery Address” when an address exists; blank with “Add Delivery Address” otherwise.
- [ ] Fields: Full Name*, Phone (10 digits)*, Address Line 1*, Line 2, City*, State*, Pincode (6 digits)* — validated in the browser **and** on the server.
- [ ] `saveAddress` upserts one row per user and redirects to `/checkout`; errors appear in a destructive `Alert`; Cancel → `/cart`.
- [ ] `saveAddress` returns a typed result, never throws expected errors, never shows raw database text; `redirect()` is outside any try/catch.

#### 🤖 AI Agent Reference

**Deviations from Helix (apply these)**:
- [ADDED] server-side validation (D2).
- [CORRECTED] no client try/catch around the action (redirect would be swallowed); `useActionState(saveAddress, null)` used directly.
- `.maybeSingle()` for the optional existing-address read.

**UI/UX (from `docs/ui-ux/ui-ux-spec.md`, approved 2026-10-08)**:
- `noValidate` form; on submit run the shared pure validators, show inline field errors (`aria-invalid`, `aria-describedby`) and focus the first invalid field; server errors in a destructive `Alert` at the top; inputs get `inputMode="numeric"` (phone, pincode) and `autoComplete` (name, tel, address-line1/2, address-level2, address-level1, postal-code); fields disabled while pending; grid: 1 col <640, name|phone ≥640, city|state|pincode ≥768; buttons stack full-width <640. Messages: “Enter your full name”, “Enter a 10-digit phone number”, “Enter a 6-digit pincode”.

**RBAC Enforcement**:
| Persona | Permission | Enforcement |
|---|---|---|
| Authenticated User | `address:read-own`, `address:write-own` | proxy + page `getUser()` + action `getUser()` + RLS |
| Guest | denied | redirect to login |

**System responses + error cases**:
| Trigger | Response | Side-effect |
|---|---|---|
| Invalid field | field error shown | nothing saved |
| DB failure | generic message | nothing saved |

**Prerequisites**: Epic 10 requirements/architecture/patterns/data design approved; previous stories in `Requires` done; development (non-production) Supabase project in use (see plan prerequisite P0).

**Implementation Steps**:
1. TDD: add address-validation tests to `lib/checkout.test.ts`; implement `validateAddressInput`, `ActionResult` type in `lib/checkout.ts`.
2. Create page, form, action per architecture §10.8.
3. Manual test with a real signed-in dev user: save, edit, invalid inputs, guest redirect.

**Test Requirements**:
- validateAddressInput: all required missing, whitespace-only, phone 9/10/11 digits/letters, pincode 5/6/7 digits, line2 optional, length limits, trims values, extra fields ignored.
- Coverage ≥85% on the address half of `lib/checkout.ts`.
- Manual: DB row appears in dev Supabase; second save updates (no duplicate).
- Quality gates: `npm run test` (all existing tests + new ones green), `npm run lint`, `npx tsc --noEmit`, `npm run build` clean; paste the actual command output into `docs/stories-implemented/story-10.8-review.md`.

**Out of Scope**:
- Multiple addresses, pincode lookup, delete address.

**Completion Evidence**: 170/170 tests; lib/checkout.ts 100% coverage; tsc/lint/build clean; guest curl → 307 to login. Review: `docs/stories-implemented/story-10.8-review.md`. Manual DB save/edit check confirmed by user.
