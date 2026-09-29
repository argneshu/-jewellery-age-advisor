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
