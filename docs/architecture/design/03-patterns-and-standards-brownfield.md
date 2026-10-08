# Patterns & Standards - Jewellery Age Advisor (Aura) — Favorites Completion

**Date**: 2026-09-29
**Author**: ARCHITECT
**Status**: Approved
**Version**: 1.0
**Based On**:
- `docs/architecture/current/00-system-overview.md`
- `docs/architecture/current/01-recommendation-engine-deep-dive.md`
- `docs/architecture/design/02-target-architecture-brownfield.md`
- `SPEC/rulebooks/aire-design-patterns.md`, `SPEC/rulebooks/aire-clean-architecture.md`

---

## Pattern Adoption Summary

| Pattern | Decision | Migration Required |
|---------|----------|--------------------|
| Error Handling | [Current — kept] | No |
| Logging | [Current — kept] | No |
| Database Access | [Current — kept] | No |
| API Response Format | [New adoption] — first API route in this repo, sets the baseline | No (nothing pre-existing to migrate) |
| Configuration Management | [New adoption] — add `aura/.env.example` | Low — one new file, no code change |
| Naming Conventions | [Current — kept] | No |
| Code Organisation | [Current — kept] | No |
| UI Components / Shared Library | [Current — kept] — already compliant | No |

---

## 1. Project Structure

No new top-level folders. Additions for the favorites feature slot directly into the existing
structure:

```
aura/
├─ app/
│  ├─ api/
│  │  └─ favorites/
│  │     └─ route.ts          # 🆕 NEW — GET/POST/DELETE handler
│  └─ favorites/
│     └─ page.tsx             # 🆕 NEW — protected page, Server Component
├─ components/
│  └─ recommendations/
│     └─ JewelleryCard.tsx    # 🟡 MODIFIED — add favorite toggle
├─ lib/
│  └─ favorites.ts            # 🆕 NEW — client fetch helpers (addFavorite/removeFavorite/listFavorites)
└─ .env.example                # 🆕 NEW — documents required Supabase env vars
```

File naming: kebab-case for multi-word non-component files (`recommendation-engine.ts`,
`format.ts`) — `favorites.ts` follows this. PascalCase for component files (`JewelleryCard.tsx`).
Route Handlers always named `route.ts` inside their route segment folder (Next.js convention, not
a project choice).

Module organisation: unchanged — `lib/` for business logic and integrations, `components/` for
UI grouped by feature (`auth/`, `recommendations/`) plus shared primitives (`ui/`), `types/` and
`data/` at the root. The new files follow this exactly: `lib/favorites.ts` sits beside
`lib/format.ts` (both small, shared helper modules with no feature subfolder of their own).

Dependency management: no new dependencies — `lib/favorites.ts` uses the browser `fetch` API
directly (already implicitly used via React/Next), no new HTTP client library.

## 2. Code Structure

- Functions, not classes — consistent with every existing module (`lib/recommendation-engine.ts`,
  `lib/format.ts`, `lib/supabase/*.ts` are all plain exported functions, never classes).
- Import ordering: external packages first, then `@/` absolute imports, then relative imports —
  matches the existing convention visible in every file read during the deep-dive (e.g.
  `JewelleryCard.tsx`: `react` → `next/image` → `@/components/ui/card` → `@/lib/format` → `@/types/jewellery`).
- File length: no existing file exceeds ~155 lines; keep new files similarly small and single-purpose
  (the route handler should be one file with three named exports — `GET`, `POST`, `DELETE` — not
  split further; `lib/favorites.ts` stays a flat set of 3 functions).
- Formatting: ESLint (`eslint-config-next`) + TypeScript strict mode (`tsconfig.json`:
  `"strict": true`) — no Prettier config found; rely on ESLint's existing rules, no new tooling.

---

## 3. Error Handling Pattern

**Decision**: [Current — kept]

Inline error surfacing via shadcn `Alert`, no thrown-exception-to-error-boundary pattern, no
custom error classes. For the new API route, this extends naturally into a plain JSON error shape
(see §5 API Design Pattern) rather than a typed error hierarchy — introducing one for 3 endpoints
with 4 possible error states would be over-engineering relative to the rest of this codebase.

### DO
```typescript
// Route handler: plain, typed status + message, no custom Error subclasses
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ...
}
```

### DON'T
```typescript
// DON'T introduce a custom error class hierarchy for a 3-endpoint route
class UnauthorizedError extends Error { statusCode = 401; }
class DuplicateFavoriteError extends Error { statusCode = 409; }
// This is the kind of ceremony this codebase has consistently avoided —
// matches the rulebook's own "Premature Optimization" anti-pattern.
```

---

## 4. Logging Pattern

**Decision**: [Current — kept]

No structured logging exists anywhere in `aura/`. Do not introduce one for this feature. Rely on
Next.js's own dev/production console output for the new route handler.

### DO
```typescript
// If you need to debug during development, a plain console.error is consistent
// with the rest of the (log-free) codebase — remove before committing.
```

### DON'T
```typescript
// DON'T add a new logging dependency (pino, winston, etc.) for one route —
// no other part of the app has one, and this feature doesn't need it.
import logger from "some-logging-lib"; // ❌
```

---

## 5. Database Access Pattern

**Decision**: [Current — kept]

Direct Supabase client calls via `lib/supabase/server.ts`, no repository abstraction layer. This
matches the existing pattern used by `AuthHeader` (`supabase.auth.getUser()`) — the new route
handler calls `createClient()` from `lib/supabase/server.ts` the same way.

### DO
```typescript
// app/api/favorites/route.ts — same client-creation pattern as AuthHeader.tsx
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", user.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
```

### DON'T
```typescript
// DON'T wrap this in a FavoritesRepository class for 3 queries — the
// rulebook's Repository Pattern exists for abstracting complex/multi-source
// data access, not a single-table Supabase call already behind lib/supabase/*.
class FavoritesRepository {
  async findByUserId(userId: string) { /* ... */ }
} // ❌ unnecessary ceremony for this codebase's scale
```

---

## 6. API Design Pattern

**Decision**: [New adoption] — this is the first API route in the repository; this pattern
becomes the baseline for any future route.

**Migration Note**: No existing routes to migrate — `aura/app/api/` contained only the empty
`favorites/` directory before this feature. Nothing else needs to change.

- **Request validation**: parse and validate the body inline at the top of the handler (no
  external validation library — matches the codebase's existing lightweight approach, e.g.
  `RegistrationForm`'s inline regex/length checks, not a schema library like `zod`).
- **Response format**: JSON body always; success returns the resource/array directly (no wrapper
  envelope like `{ data: ... }` — keeps parity with Supabase's own client response shape).
- **Error response shape**: `{ error: string }` with an appropriate HTTP status — `401`
  (unauthenticated), `400` (invalid input), `404` (not found), `409` (conflict/duplicate).
- **Authentication**: every handler independently calls `supabase.auth.getUser()` and returns
  401 if absent — defense-in-depth alongside `proxy.ts`, per the target architecture's Security Design.

### DO
```typescript
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (typeof body.jewelleryItemId !== "number") {
    return Response.json({ error: "Invalid jewelleryItemId" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("favorites")
    .insert({ user_id: user.id, jewellery_item_id: body.jewelleryItemId })
    .select()
    .single();

  if (error?.code === "23505") { // unique_violation
    return Response.json({ error: "Already favorited" }, { status: 409 });
  }
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data, { status: 201 });
}
```

### DON'T
```typescript
// DON'T wrap responses in an inconsistent envelope, and DON'T skip the
// explicit auth.getUser() check just because proxy.ts already guards the route.
export async function POST(request: Request) {
  const body = await request.json(); // ❌ no auth check, no validation
  // ...
  return Response.json({ success: true, payload: data }); // ❌ inconsistent shape
}
```

---

## 7. Configuration Pattern

**Decision**: [New adoption] — add `aura/.env.example`; no change to how env vars are read.

**Migration Note**: Purely additive — a new documentation file. No code changes to
`lib/supabase/*.ts`, which continue reading `process.env.NEXT_PUBLIC_SUPABASE_URL!` /
`process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!` exactly as today.

### DO
```bash
# aura/.env.example
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# Not currently used by any code in this repo — add only if a future feature
# needs elevated (RLS-bypassing) server-side access:
# SUPABASE_SERVICE_ROLE_KEY=
```

### DON'T
```typescript
// DON'T introduce a config-loading library (dotenv-safe, convict, etc.) —
// Next.js's built-in .env handling is already sufficient for 2 public vars.
```

---

## 8. Testing Patterns

### Unit Tests

**Decision**: [Current — kept]. Location: co-located with source (`lib/favorites.test.ts` next to
`lib/favorites.ts`, matching `lib/recommendation-engine.test.ts`). Framework: Vitest,
`describe`/`it`/`expect`. Structure: Arrange-Act-Assert, matching the existing test file exactly.

```typescript
// lib/favorites.test.ts (new — pattern matches recommendation-engine.test.ts)
import { describe, expect, it, vi } from "vitest";
import { addFavorite } from "@/lib/favorites";

describe("addFavorite", () => {
  it("posts jewelleryItemId to /api/favorites and returns the created record", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "1", userId: "u1", jewelleryItemId: 17 }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await addFavorite(17);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/favorites",
      expect.objectContaining({ method: "POST" })
    );
    expect(result.jewelleryItemId).toBe(17);
  });
});
```

### Integration Tests

**Decision**: [Current — kept, but this closes a real gap]. No integration/component tests exist
today for any component (`RecommendationForm`, `ResultsGrid`, auth forms, or middleware) — this
is a pre-existing gap flagged in the deep-dive, not something this feature is expected to fully
solve, but new code for this feature should not add to the gap silently.

**Minimum bar for this feature**: `lib/favorites.ts`'s three functions must have unit tests
(mocked `fetch`, as above). Route handler and component-level tests are a stretch goal, not a hard
requirement, since no test harness for Next.js Route Handlers or component rendering exists yet
in this repo (would require adding `@testing-library/react` or similar — a new dependency, which
should be raised with the user explicitly rather than added silently).

### Coverage Requirements

- Minimum: 85% for new/modified code in this feature (per `AIRE_DEV`'s quality gate).
- New code: `lib/favorites.ts` must be fully covered by unit tests.
- Modified code: `JewelleryCard.tsx`'s new toggle logic should be covered if a component-test
  harness is added; otherwise, this specific gap should be explicitly called out at review time.
- Skip: generated shadcn/ui primitives, config files.

---

## 9. Documentation Standards

- **Code comments**: why, not what — matches this codebase's own strong existing convention
  (every epic left comments explaining deviations from spec, e.g. `proxy.ts`'s comment on the
  Next.js 16 middleware rename). Continue this for the favorites feature — e.g., document *why*
  `GET /api/favorites` returns raw records instead of resolved items (already captured as
  Technical Decision #3 in the target architecture) as an inline comment in the route file.
- **Function documentation**: no JSDoc convention exists in this codebase — don't introduce one
  for 3-4 small functions; rely on TypeScript types + clear naming (already the norm).
- **README structure**: no per-module READMEs exist except `aura/supabase/README.md` — do not add
  one for this feature; it's small enough that the target architecture doc is sufficient.
- **API documentation**: no OpenAPI/Swagger setup exists — not warranted for 3 endpoints; the
  target architecture document's API Changes section is the source of truth.

---

## 10. File/Module Boundary Map (MANDATORY)

| Concern | Owning file(s) / glob | New or Existing |
|---|---|---|
| Favorites data access (auth check + Supabase query) | `aura/app/api/favorites/route.ts` | 🆕 New |
| Client-side favorites fetch helpers | `aura/lib/favorites.ts` | 🆕 New |
| Favorite toggle UI | `aura/components/recommendations/JewelleryCard.tsx` | 🟡 Existing, modified |
| Favorites listing page | `aura/app/favorites/page.tsx` | 🆕 New |
| Favorite record type | `aura/types/auth.ts` (`FavoriteRecord`) | 🟢 Existing, unchanged |
| Catalog lookup for rendering favorited items | `aura/data/jewellery.ts` | 🟢 Existing, unchanged |
| Route protection | `aura/proxy.ts`, `aura/lib/supabase/middleware.ts` | 🟢 Existing, unchanged |
| RLS enforcement | `aura/supabase/migrations/0001_favorites.sql` | 🟢 Existing, unchanged |
| Env var documentation | `aura/.env.example` | 🆕 New |

**Shared files** (touched by more than one concern — the `shared_files` list for
`docs/plans/dependency-graph.yml`):

- `aura/types/auth.ts` — read by both the route handler and the favorites page (already exists,
  no change needed, but both new files import from it).
- `aura/data/jewellery.ts` — read only by the favorites page (not the route handler, per Technical
  Decision #3) — not actually shared across the *new* files, listed here only because it's a
  pre-existing central catalog file any future feature touching item data must also be aware of.

**No unavoidable cross-concern files requiring special handling** — this is a small, additive
feature with no central registry, DI container, or route-registration file in this codebase to
worry about (Next.js's file-system routing means `route.ts`/`page.tsx` placement *is* the
registration, with no separate index to update).

---

## Quality Checklist

- [ ] `app/api/favorites/route.ts` follows the API Design Pattern (§6) exactly — auth check first, then validation, then the operation, consistent error shape
- [ ] `lib/favorites.ts` has unit tests with mocked `fetch`, ≥85% coverage
- [ ] `JewelleryCard.tsx`'s new toggle follows existing `"use client"` + inline-state conventions (matches `LogoutButton.tsx`'s style)
- [ ] `aura/.env.example` added and lists both currently-used vars
- [ ] No new dependencies added without flagging to the user first (especially any test-harness library, if component tests are attempted)
- [ ] No repository/class abstraction introduced for Supabase access
- [ ] No logging library introduced
- [ ] Code review checked against this document

---
---

# Epic 10 — Aura Shopping Flow — Patterns & Standards

**Date**: 2026-10-08
**Author**: ARCHITECT
**Status**: Approved (user, 2026-10-08) — coverage tool approved and installed (E10.0 #10)
**Version**: 2.0 (Epic 10 section; the Favorites section above is unchanged and remains approved)
**Based On**: `docs/requirements.md` (Epic 10, approved), `docs/architecture/design/02-target-architecture-brownfield.md` (Epic 10, approved), `docs/architecture/current/*`, and the `aura/` source read 2026-10-08.

> **Decision process.** The user delegated pattern choices to the architect ("whatever you think is best").
> Each category below shows `[C]` Current kept or `[N]` New adoption with the reason, instead of a
> per-category Q&A. Anything that needs the user's explicit OK is marked **⚠ NEEDS APPROVAL**.

## E10.0 Pattern Adoption Summary

| # | Category | Choice | Migration effort |
|---|----------|--------|------------------|
| 1 | Error handling | **[C] Current — kept**, extended with a typed result for Server Actions | None |
| 2 | Logging | **[C] Current — kept** (no logger); one narrow `console.error(code)` rule for Server Actions | None |
| 3 | Database access | **[C] Current — kept** (direct Supabase client); **[N]** `.maybeSingle()` for optional rows and `rpc()` for multi-table writes | None (new code only) |
| 4 | API / action contract | **[N] New adoption** — Server Actions return `ActionResult`; first Server Actions in the repo | None (nothing to migrate) |
| 5 | Configuration | **[C] Current — kept** — no new env vars; `aura/.env.local.example` unchanged | None |
| 6 | Naming | **[C] Current — kept**: kebab-case non-component files, PascalCase components. *Supersedes* the architecture doc's file name `lib/useFavorite.ts` → **`lib/use-favorite.ts`** (export `useFavorite`) | None |
| 7 | Code organisation | **[C] Current — kept**; adds top-level `context/` and `components/cart/` | None |
| 8 | UI components / shared library | **[C] Current — kept** — reuse existing `components/ui/*`; no new generic primitives | None |
| 9 | Testing | **[C] Current — kept** (Vitest, node, co-located) | None |
| 10 | Coverage measurement | **[N] APPROVED 2026-10-08 and installed** — dev-only `@vitest/coverage-v8` (matching `vitest@^4.1.11`) | Low: 1 devDependency + 1 script |

**⚠ Coverage tooling.** The requirements demand ≥85% coverage with pasted evidence. `package.json` has no coverage
provider, and earlier epics asserted coverage by inspection. Producing real numbers needs
`@vitest/coverage-v8` (devDependency, tooling only, no runtime impact) and an `npm run test:coverage` script. The
requirements forbid new dependencies without approval, so this is asked here. *If declined*: coverage is reported
by test-to-branch inspection as in Epics 7–8 and flagged as unmeasured in QA.

## E10.1 Project Structure (additions)

```
aura/
├─ app/
│  ├─ product/[id]/{page.tsx, ProductDetail.tsx}            🆕
│  ├─ cart/page.tsx                                          🆕
│  ├─ checkout/{page.tsx, CheckoutClient.tsx, actions.ts}    🆕
│  ├─ checkout/address/{page.tsx, AddressForm.tsx, actions.ts} 🆕
│  ├─ order-confirmation/[id]/page.tsx                       🆕
│  └─ layout.tsx                                             🟡
├─ components/
│  ├─ cart/{CartIconLink,CartItemRow,CartSummary}.tsx        🆕
│  ├─ auth/AuthHeader.tsx                                    🟡
│  └─ recommendations/JewelleryCard.tsx                      🟡
├─ context/CartContext.tsx                                   🆕 (new top-level dir)
├─ lib/
│  ├─ cart.ts, cart.test.ts                                  🆕 pure
│  ├─ checkout.ts, checkout.test.ts                          🆕 pure
│  ├─ use-favorite.ts                                        🆕 hook (React)
│  └─ supabase/{route-rules.ts, route-rules.test.ts}         🆕 pure; middleware.ts 🟡
├─ types/address.ts                                          🆕
└─ supabase/migrations/{0002_user_addresses,0003_orders,0004_place_order_fn}.sql + *_rollback.sql 🆕
```
Rules: route-segment files keep Next names (`page.tsx`, `actions.ts`, …); one concern per file; no file over ~200 lines
(CheckoutClient is the likeliest to approach it — split a `PaymentMethodSection` out rather than exceed it); imports ordered
external → `@/…` → relative; functions not classes; ESLint + `strict` TypeScript, no new tooling.

## E10.2 Error Handling — [C] Current kept, extended

Inline `Alert variant="destructive"`; no custom Error classes; no error boundaries added. For Server Actions, expected
failures are **returned**, never thrown, and never carry raw database text.

```typescript
// lib/checkout.ts (pure) — shared result shape
export type ActionResult<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
```
**DO**
```typescript
const parsed = validateAddressInput(formData);
if (!parsed.ok) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.fieldErrors };
const { error } = await supabase.from("user_addresses").upsert(row, { onConflict: "user_id" });
if (error) { console.error("[saveAddress]", error.code); return { ok: false, error: "We could not save your address. Please try again." }; }
redirect("/checkout"); // outside any try/catch
```
**DON'T**
```typescript
try { await saveAddress(fd); } catch (e) { setError((e as Error).message); } // ❌ swallows redirect(); leaks DB text
return { ok: false, error: error.message };                                  // ❌ raw Supabase message to the UI
```

## E10.3 Logging — [C] Current kept

No logger, no new library. Server Actions may call `console.error("[actionName]", code)` with the **error code only**.
Never log addresses, phone numbers, UPI ids, order bodies, cart contents, tokens, or emails.

## E10.4 Database Access — [C] Current kept; two small additions

Direct per-request client from `lib/supabase/server.ts`; RLS is the enforcement point; **never** the service-role key;
**never** `SECURITY DEFINER`.
- Optional single row → `.maybeSingle()` (not `.single()`), then distinguish `error` (real failure → throw to Next's error
  page) from `data === null` (legitimately absent). *[N]* — Epic 7's route handlers keep `.single()`/their current form.
- A write touching more than one table → one Postgres function called with `supabase.rpc()` (single transaction), never two
  sequential client inserts.
- Parameters are always bound (supabase-js / `rpc` args); no string-built SQL.

**Migration file rules**: plain SQL in `aura/supabase/migrations/NNNN_name.sql`, header comment like `0001`
(story, spec, how to run); paired `NNNN_name_rollback.sql` that drops only what that file created; numbering strictly
sequential; additive only; never edit a migration after it has been applied anywhere — add a new number. Postgres has no
`create policy if not exists`: a policy migration must be applied once per environment, and its applied state recorded in
`docs/status.md`. Function files: `set search_path = public`, explicit `revoke … from public, anon` + `grant … to authenticated`.

**DO**
```typescript
const { data, error } = await supabase.rpc("place_order", { p_payment_method, p_upi_id, p_items });
```
**DON'T**
```typescript
await supabase.from("orders").insert(...);        // ❌ then a second call…
await supabase.from("order_items").insert(...);   // ❌ …can leave an order with no items
```

## E10.5 Action / API Contract — [N] New adoption

Baseline for all future Server Actions (the Favorites route-handler contract in §6 above stays for `app/api/*`):
1. `"use server"` file named `actions.ts` next to the route that uses it.
2. First lines: `getUser()`; no user → `{ ok:false, error:"Please sign in again." }`.
3. Treat every argument as `unknown`; validate with the pure validators in `lib/checkout.ts` before any I/O.
4. Return `ActionResult`; success that should navigate either `redirect()` (form actions) or returns data the client uses
   with `router.push()` (event-handler actions such as `placeOrder`).
5. Prices, names and totals are **never** read from the client — only ids and quantities (D1).

**DO**
```typescript
export async function placeOrder(input: unknown): Promise<ActionResult<{ orderId: string }>> {
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };
  const priced = priceOrder(input, JEWELLERY_ITEMS);   // validates + prices from the catalog
  if (!priced.ok) return { ok: false, error: priced.error };
  // …rpc('place_order', …) → map errors to safe messages → { ok: true, orderId }
}
```
**DON'T**
```typescript
const items: CartItem[] = JSON.parse(formData.get("items") as string);          // ❌ trusts client JSON
const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);           // ❌ trusts client prices
```

## E10.6 Configuration — [C] Current kept
No new variables. `aura/.env.local.example` is unchanged (it already lists all three vars; `SUPABASE_SERVICE_ROLE_KEY`
stays unused). No config library.

## E10.7 Naming — [C] Current kept
Components/context files PascalCase (`CartContext.tsx`, `CartIconLink.tsx`); non-component modules kebab-case
(`cart.ts`, `checkout.ts`, `use-favorite.ts`, `route-rules.ts`); types PascalCase; constants `UPPER_SNAKE` (`MAX_QTY`);
localStorage key `aura_cart` (Helix); DB columns snake_case with camelCase mapping at the boundary (as `FavoriteRecord`).

## E10.8 State & Client Patterns (Epic 10 specifics)
- **Cart**: reducer lives in pure `lib/cart.ts`; the provider only wires effects. Persistence waits for `isHydrated`;
  stored data is parsed defensively and rebuilt from the catalog (`parseStoredCart`). Pages that depend on cart contents wait
  for `isHydrated` before showing empty states or redirecting.
- **Hooks**: React hooks that wrap I/O live in `lib/use-*.ts` with `"use client"`; business rules inside them move to pure
  helpers where possible so they can be tested without jsdom.
- **Forms**: `useActionState(saveAddress, null)` directly — no wrapping try/catch. Event-handler actions use a `useRef`
  in-flight lock plus `disabled={isPending}`.
- **Links as buttons**: `Button render={<Link href=… />}` (existing pattern).
- **Money**: integers (rupees), always formatted with `formatINR`; never floats.

## E10.9 Testing Patterns — [C] Current kept
- Vitest, node environment, `describe/it/expect`, Arrange-Act-Assert, co-located `*.test.ts` next to the source.
- Everything with branching logic is pure and tested: `lib/cart.ts` (reducer: add/increment/cap/remove/clamp/unknown id/clear;
  `parseStoredCart`: null, bad JSON, non-array, unknown ids, duplicates, bad quantity, tampered price → rebuilt from catalog),
  `lib/checkout.ts` (address fields, phone/pincode boundaries, UPI valid/invalid, payment methods, `priceOrder` rejects
  empty / unknown id / quantity 0, 11, 1.5, duplicate ids, > 40 lines, non-object input; total equals catalog math despite
  forged prices; `isUuid`; `shortOrderId`), `lib/supabase/route-rules.ts` (all existing + 2 new protected prefixes, `/checkout/address`,
  `/cart` and `/product/1` public, look-alike prefixes such as `/checkout-foo` NOT protected).
- Mocking: `vi.stubGlobal`/`vi.fn` only where needed (e.g. `localStorage` stub for context helpers); no module-mock frameworks.
- **Regression gate**: existing 16 tests unchanged and green after every story.
- **Database/RLS verification** (not Vitest): a documented SQL script per migration run on a non-production project —
  two-user RLS, CHECK rejections, `place_order` success + forced-failure rollback, anon denied; output pasted into the story review doc.
- **UI/route verification**: no component harness (D5). Per story: `npm run build`, `lint`, `tsc --noEmit`, `curl -I` status/redirect
  checks for guards, and a manual/QA checklist taken from the story's Definition of Done.
- **Coverage**: ≥85% on all new pure `lib/` modules (measured if E10.0 #10 is approved, otherwise by inspection and flagged).

## E10.10 Documentation Standards
Comments explain *why* and mark every deviation from a Helix story with a short breadcrumb (e.g. `// Deviates from Helix 4.2: …`),
as in Epics 1–8. No JSDoc convention. Each story ends with `docs/stories-implemented/story-10.N-review.md` (AC checklist, test
output, SQL verification output, deviations). The Helix snapshot (`docs/helix/`) is read-only; changes needed in Helix are reported to the user, not written.

## E10.11 File/Module Boundary Map (MANDATORY)

| Concern | Owning file(s) | Story | New / Existing |
|---|---|---|---|
| Address schema + RLS | `aura/supabase/migrations/0002_user_addresses*.sql`, `aura/types/address.ts` | 10.1 | 🆕 |
| Orders schema + RLS | `aura/supabase/migrations/0003_orders*.sql` | 10.2 | 🆕 |
| `place_order` function | `aura/supabase/migrations/0004_place_order_fn*.sql` | 10.2 | 🆕 |
| Cart logic (pure) | `aura/lib/cart.ts`, `aura/lib/cart.test.ts` | 10.3 | 🆕 |
| Cart provider | `aura/context/CartContext.tsx` | 10.3 | 🆕 |
| Provider mount | `aura/app/layout.tsx` | 10.3 | 🟡 **shared** |
| Favorite hook extraction | `aura/lib/use-favorite.ts` | 10.4 | 🆕 |
| Clickable card | `aura/components/recommendations/JewelleryCard.tsx` | 10.4 (also touched by hook extraction) | 🟡 **shared within 10.4/10.5** |
| Product detail | `aura/app/product/[id]/*` | 10.5 | 🆕 |
| Cart icon | `aura/components/cart/CartIconLink.tsx`, `aura/components/auth/AuthHeader.tsx` | 10.6 | 🆕 / 🟡 |
| Cart page | `aura/app/cart/page.tsx`, `aura/components/cart/CartItemRow.tsx`, `CartSummary.tsx` | 10.7 | 🆕 |
| Address validation (pure) | `aura/lib/checkout.ts` (address part), `aura/lib/checkout.test.ts` | 10.8 | 🆕 |
| Address page/form/action | `aura/app/checkout/address/*` | 10.8 | 🆕 |
| Route rules + protection | `aura/lib/supabase/route-rules.ts`(+test), `aura/lib/supabase/middleware.ts` | 10.9 | 🆕 / 🟡 |
| Checkout guard page | `aura/app/checkout/page.tsx` | 10.9 → extended 10.10 | 🆕 **shared (10.9 → 10.10)** |
| Order pricing/validation (pure) | `aura/lib/checkout.ts` (order part) | 10.10 | 🟡 **shared with 10.8** |
| Checkout UI + action | `aura/app/checkout/CheckoutClient.tsx`, `aura/app/checkout/actions.ts` | 10.10 | 🆕 |
| Confirmation page | `aura/app/order-confirmation/[id]/page.tsx` | 10.11 | 🆕 |
| Coverage tooling (if approved) | `aura/package.json`, `aura/package-lock.json` | any (do once, first) | 🟡 **shared** |

**Shared files (`shared_files` for the dependency graph)**: `aura/app/layout.tsx` (10.3 only), `aura/lib/checkout.ts`
(10.8 creates the address half; 10.10 adds the order half — same file, sequential stories), `aura/app/checkout/page.tsx`
(10.9 creates; 10.10 extends), `aura/components/recommendations/JewelleryCard.tsx` (10.4 only, but also IMPACTS 10.5 via
`use-favorite`), `aura/package.json`/lockfile (coverage tooling, one-time).
**Unavoidable ordering constraints**: 0002 → 0003 → 0004; 10.3 before anything that imports `useCart`; 10.8 before 10.10
for `lib/checkout.ts`; 10.9 before 10.10 for the checkout page. Stories that can run in parallel without touching the same file:
{10.1, 10.2, 10.3}, then {10.4→10.5, 10.6, 10.7}.
**Never touched**: `lib/recommendation-engine.ts`, `lib/favorites.ts`, `app/api/favorites/*`, `data/jewellery.ts`, `0001_favorites.sql`.

## E10.12 Quality Checklist (Epic 10)

- [ ] No new runtime dependency; coverage devDependency only if approved
- [ ] Every Server Action: `getUser()` first → validate `unknown` input → typed `ActionResult` → no raw DB text → `redirect()` outside try/catch
- [ ] No client-supplied price/name/total is ever used server-side
- [ ] Multi-table writes only through `rpc()`; `SECURITY INVOKER`; grants revoked from `public`/`anon`
- [ ] Each migration has a rollback file and was verified on a non-production database first; applied state recorded
- [ ] Cart persistence waits for `isHydrated`; stored cart rebuilt from catalog; all `localStorage` access in try/catch
- [ ] Existing 16 tests still pass; new pure modules ≥85% (measured or flagged)
- [ ] `JewelleryCard` heart: no navigation on click or keyboard; Epic 7 behaviour unchanged
- [ ] No PII/UPI/addresses in logs; no TODO comments; deviations from Helix carry breadcrumb comments
- [ ] File boundaries respected (§E10.11); `build`, `lint`, `tsc --noEmit` clean
