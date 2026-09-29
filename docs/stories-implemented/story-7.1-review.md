# Story 7.1 Self-Review — Favorites API Route (GET/POST/DELETE)

**Date**: 2026-09-29
**Story**: `docs/plans/stories/epic-7-story-7.1-Favorites-API-Route.md`

---

## What Was Implemented

`aura/app/api/favorites/route.ts` — three Route Handlers (`GET`, `POST`, `DELETE`) backing the
favorites feature, each independently authenticated via `supabase.auth.getUser()` and scoped to
`user.id`. Responses are mapped from the DB's snake_case row shape to the `FavoriteRecord`
camelCase type via a local `mapRow` helper (a contract mismatch caught during implementation —
see Deviations).

## Files Changed

- `aura/app/api/favorites/route.ts` (new)

## Patterns Applied

- API Design Pattern (§6, patterns doc): JSON `{ error }` shape, no envelope wrapper, status codes 200/201/400/401/404/409/500.
- Database Access Pattern (§5): direct Supabase calls via `lib/supabase/server.ts`, no repository abstraction.
- Error Handling Pattern (§3): plain conditional returns, no custom error classes.
- Configuration Pattern (§7): reused existing `aura/.env.local.example` — did NOT create a duplicate `.env.example` (see Reusability Check below).

## Testing Summary

No automated Route Handler test exists for this story (no test harness for Next.js Route Handlers
exists in this repo, per the patterns doc's stated gap — consistent with the story's own Tests
section, which specifies manual verification as the primary test for this story).

**Manual + DB-level verification performed**:
1. `curl GET/POST/DELETE /api/favorites` with no session cookie → all three redirected `307` to `/login?redirectedFrom=...` by `proxy.ts` (existing middleware, unchanged) — confirms the guest path is blocked before reaching the route at all.
2. DB-level verification script (using the Supabase service-role key, run once and deleted — not committed) exercising the exact queries `route.ts` uses:
   - Insert → succeeds, returns the row.
   - Duplicate insert → Postgres error code `23505` (maps to the route's `409 "Already favorited"` branch).
   - Select scoped by `user_id` → returns exactly 1 row for that user.
   - Delete scoped by `user_id` + `jewellery_item_id` → returns 1 affected row (maps to `200 { removed: true }`).
   - Repeat delete → 0 affected rows (maps to the route's `404 "Favorite not found"` branch).
   - Cross-user isolation: a second test user favoriting the same `jewelleryItemId` does not appear in the first user's scoped list.
   - Test users cleaned up via `admin.auth.admin.deleteUser`.
3. Existing suite: `npm run test` → 9/9 passing (no regression).
4. `npm run build` → compiles clean, `/api/favorites` registered as a route, all existing routes unaffected.
5. `npx tsc --noEmit` → clean.
6. `npx eslint app/api/favorites/route.ts` → clean.

**Not verified via live HTTP for the authenticated path**: `@supabase/ssr`'s cookie-based session
format isn't easily fabricated via `curl` without a real interactive `/login` flow. The route's
own `auth.getUser()` check (the actual security boundary) is verified by code review + the
existing, unchanged pattern already proven in `AuthHeader.tsx`/`lib/supabase/middleware.ts`. The
DB-level script above proves every query the route issues behaves exactly as each status-code
branch assumes.

## DoD Evidence

### Gate 1 — Spec Echo

| # | Requirement | Evidence |
|---|---|---|
| AC1 | GET returns 200 + FavoriteRecord[] scoped to user | `route.ts:20-38` (GET handler, `.eq("user_id", user.id)`); DB script "List (expect 1 row): 1" |
| AC2 | GET returns 200 + [] when no favorites | `route.ts:35-38` returns `data.map(mapRow)` — empty array when `data` is `[]` (Supabase `.select()` with no matches returns `[]`, not null) |
| AC3 | GET returns 401 unauthenticated | `route.ts:24-26` — `if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })`; live behavior is `proxy.ts`'s 307 (defense layer 1), route's own check is defense layer 2 (code-reviewed) |
| AC4 | POST valid → 201 + created record | `route.ts:56-68`; DB script "Insert 1: OK" |
| AC5 | POST duplicate → 409 | `route.ts:63-65` (`error.code === "23505"`); DB script "Insert 2 (duplicate, expect 23505): 23505 ..." |
| AC6 | POST malformed → 400 before DB call | `route.ts:50-52` (`typeof body.jewelleryItemId !== "number"`) — check precedes the `.insert()` call |
| AC7 | POST returns 401 unauthenticated | `route.ts:45-47` |
| AC8 | DELETE existing → 200 `{removed:true}` | `route.ts:85-92`; DB script "Delete 1 (expect 1 row removed): 1" |
| AC9 | DELETE non-existent → 404 | `route.ts:89-91` (`data.length === 0`); DB script "Delete 2 (expect 0 rows -> 404 case): 0" |
| AC10 | DELETE malformed → 400 | `route.ts:80-82` |
| AC11 | DELETE returns 401 unauthenticated | `route.ts:76-78` |
| AC12 | Every query scoped by session `user.id`, never client-supplied | All three handlers: `user.id` from `supabase.auth.getUser()`, request body only ever supplies `jewelleryItemId` — grep confirms no `body.userId` or similar exists in the file |
| AC13 | `.env.example` documents required vars | **Deviation**: `aura/.env.local.example` already existed with all 3 vars (found via Reusability Check) — no new file created; documented in Deviations below |
| Step 1 (GET handler) | `route.ts:20-38` |
| Step 2 (POST handler) | `route.ts:40-68` |
| Step 3 (DELETE handler) | `route.ts:70-92` |
| Step 4 (`.env.example`) | Superseded — see AC13 |
| Migration Doc §4.4 (defense-in-depth) | Every handler calls `auth.getUser()` independently of `proxy.ts` |

### Gate 2 — Negative-Space Check

- "Must not use a service-role client in the route" → `grep -n "SERVICE_ROLE" aura/app/api/favorites/route.ts` → no matches; route only imports `createClient` from `lib/supabase/server.ts` (anon-key, RLS-enforced client).
- "Must not trust client-supplied user identifiers" → `grep -n "body\." aura/app/api/favorites/route.ts` → only `body.jewelleryItemId` referenced; no `body.userId` or similar exists.
- "No UI in this story" → `git diff --stat` confirms only `route.ts` was added; no component files touched.

### Gate 3 — Contract Consistency

| Layer | Element | Match? |
|---|---|---|
| DB column `user_id` | ↔ `FavoriteRecord.userId` | ✅ mapped via `mapRow` |
| DB column `jewellery_item_id` | ↔ `FavoriteRecord.jewelleryItemId` | ✅ mapped via `mapRow` |
| DB column `created_at` | ↔ `FavoriteRecord.createdAt` | ✅ mapped via `mapRow` |
| Target architecture's documented response shape (raw records, resolved client-side) | ↔ route's actual `GET` response | ✅ returns `FavoriteRecord[]`, resolution against `data/jewellery.ts` deferred to Story 7.3 as designed |

**Found and fixed during implementation**: the route would have silently returned raw snake_case
Supabase rows (`user_id`, `jewellery_item_id`) against a `FavoriteRecord` type declared in
camelCase — a silent contract break Gate 3 is specifically designed to catch. Fixed via the
`mapRow` helper.

## Challenges Encountered

- `@supabase/supabase-js`'s realtime client requires Node 22+'s native `WebSocket` global; Node 20
  (this environment) doesn't have it, so ad-hoc verification scripts needed a one-line polyfill
  (`globalThis.WebSocket = class {}`) — irrelevant to production code (the app itself runs under
  Next.js's own runtime, not raw Node import), noted here only because it affected verification tooling.

## Deviations from Plan

- **Did not create `aura/.env.example`** as the story's Step 4 specified — `aura/.env.local.example`
  already existed with the exact same 3 variables (including `SUPABASE_SERVICE_ROLE_KEY`, which the
  story only expected to be *documented as unused*; it's already present, just not yet consumed by
  any code). Per the "No Duplicate Code" rule, reused the existing file rather than creating a
  parallel one. `docs/requirements.md`'s earlier claim that no `.env.example` existed was incorrect
  and should be corrected.
- **Did not write an automated Route Handler test file** — the story's own Tests section explicitly
  scoped this to manual verification, consistent with the patterns doc's stated test-harness gap.

## Lessons Learned

- Always check for camelCase/snake_case mismatches between a documented TypeScript type and the
  actual DB column names before returning DB rows directly — Gate 3 (Contract Consistency) is what
  caught this here, and it would have been a real, silent bug in production (favorited items simply
  wouldn't parse correctly on the client, given `FavoriteRecord.jewelleryItemId` would be `undefined`
  on the raw row).
- Always re-verify claims from earlier planning docs against the actual filesystem before acting on
  them — the "missing .env.example" gap flagged in `docs/requirements.md` turned out to be wrong.

## Next Steps

Proceed to Story 7.2 (Favorite Toggle on JewelleryCard), which consumes this route via `lib/favorites.ts`.
