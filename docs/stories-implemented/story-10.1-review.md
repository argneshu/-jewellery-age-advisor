# Story 10.1 — Address DB Migration — Review

**Date**: 2026-10-08 | **Helix**: Story 3.1 (doc 5878) | **Status**: ✅ Done (2026-10-08) — migration applied to the **development** project (auradev) only; 19/19 API-level checks PASSED

## What Was Implemented
- `aura/supabase/migrations/0002_user_addresses.sql` + `0002_user_addresses_rollback.sql` — byte-identical to the reviewed drafts in `docs/data/sql/` (`cmp` verified).
- `aura/types/address.ts` — `UserAddress` (Helix 3.1) and `AddressInput`.
- `docs/data/verify/api-check-0002-user-addresses.mjs` — API-level verification script (run by the user; passwords never enter the chat).
- Applied once, by the user, in the **auradev** SQL editor. (First attempt failed with `42P07 relation "favorites" already exists` because an old query tab still contained the Epic 7 SQL; the failed run rolled back completely, `user_addresses` was absent, `favorites` unharmed; second attempt in a clean tab succeeded.)

## Testing Summary (actual output)
Pre-apply: all three Epic 10 SQL files parsed with the real PostgreSQL parser (`libpg-query` 18.x, incl. the plpgsql body of `place_order`) — syntax OK.
Anonymous probe after apply (run by the assistant, no credentials): `GET/POST /rest/v1/user_addresses` → **HTTP 401 `42501`** (permission denied); `favorites` → HTTP 200 `[]` (unchanged).
Authenticated run by the user (users `user1` and `user2`, auradev):
```
PASS T1a user A can upsert their own address
PASS T1b user A sees exactly their own row
PASS T2a user B does not see user A's address
PASS T2b user B cannot insert a row for user A (RLS)
PASS T3a user B cannot update user A's row (0 rows affected)
PASS T3b user A's city is unchanged
PASS T3c a second address for the same user is rejected (unique user_id)
PASS T3d user B cannot re-assign their row to user A (update with-check)
PASS T4 ×7  rejects phone 3 digits / phone with letters / pincode 5 / pincode 7 / blank full_name / blank city / address_line1 > 200 (CHECK constraint)
PASS T5a anonymous cannot read the table      PASS T5b anonymous cannot insert
PASS T6  user cannot delete their address (no delete policy)      PASS T6b the row still exists
```
(19 PASS, 0 FAIL; the closing “ALL CHECKS PASSED” line was cut off in the pasted output.)
`npx tsc --noEmit` clean · `npm run lint` clean · `npm run test` 108/108 unchanged.

## DoD Evidence
### Gate 1 — Spec Echo
| # | Requirement | Proof |
|---|---|---|
| AC1 | `user_addresses` created with the required columns | `0002_user_addresses.sql` lines 10-29; T1a/T1b (insert + select work) |
| AC2 | RLS: users read/insert/update only their own address | policies in `0002…sql`; T2a, T2b, T3a, T3b, T3d |
| AC3 | `unique (user_id)` — one address per user (enables upsert) | `constraint user_addresses_user_id_key`; T3c (409 / 23505); upsert in T1a works |
| AC4 | Migration file named `0002_user_addresses.sql` | `aura/supabase/migrations/` listing |
| AC5 | `types/address.ts` with `UserAddress` | `aura/types/address.ts` |
| AC6 | Migration run in Supabase SQL editor | user ran it on auradev; table answers with 401/42501 to anon (exists) |
| DoD | No column conflicts with existing tables | applied cleanly; `favorites` still 200 |
| Added | CHECKs (phone, pincode, lengths), anon revoked | T4 ×7, T5a/T5b |
| Safety | Dev DB only; rollback file present | script refuses to run against `lexujp…` (old production); `0002_user_addresses_rollback.sql` |

### Gate 2 — Negative-Space
| Rule | Check | Result |
|---|---|---|
| No production change | script guard + `.env.local` points at auradev (`ing…gt`) | ✅ |
| No client delete of addresses | T6/T6b | ✅ |
| Existing `favorites` untouched | anon GET → 200 `[]` after apply | ✅ |
| No other app code changed | `git diff --stat` for this story = `types/address.ts` + 2 SQL files + docs | ✅ |

### Gate 3 — Contract Consistency
SQL columns (snake_case) ↔ `UserAddress` (camelCase; mapping done at the boundary in Story 10.8) ↔ CHECKs (phone 10 digits, pincode 6 digits) ↔ the validators planned for `lib/checkout.ts` (same rules, Story 10.8). Test T4 proves the DB enforces what the form will enforce.

## Challenges / Notes
- The SQL editor error was a user-side tab mix-up, not a migration defect.
- Test data left in auradev (by design — no client DELETE): one address row each for the two test users. Clean-up, if wanted, from the dashboard (Table Editor) or by deleting the users.
- Residual (documented, unchanged): none new for this table.

## Next Steps
Story **10.2** (orders tables + `place_order`).
