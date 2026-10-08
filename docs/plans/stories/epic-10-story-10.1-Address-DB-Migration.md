### Story 10.1: Address DB Migration

**File**: `docs/plans/stories/epic-10-story-10.1-Address-DB-Migration.md`

**Epic**: 10 - AURA SHOPPING FLOW | **ID**: 10.1 | **Date**: 2026-10-08 | **Jira**: LOCAL | **GitHub**: LOCAL | **BUILDID**: NO-CYCLE
**Helix**: Story 3.1 — solution 1080, document 5878 (local snapshot: `docs/helix/INDEX.md`; the Helix text is the base spec — read it first, it contains the full reference code)
**Wave**: 4
**Requires**: []
**Enables**: ["10.8"]
**Files Touched**:
  - aura/supabase/migrations/0002_user_addresses.sql
  - aura/supabase/migrations/0002_user_addresses_rollback.sql
  - aura/types/address.ts
**Roles Ref**: docs/requirements.md#roles--permissions-matrix — Authenticated User (own address only); Guest denied
**QA Candidate**: No — database + types only; verified by SQL tests, not by a QA tester.

> **How to read this story.** The Helix story already holds the complete user story, implementation code and Definition of Done (same precedent as Story 7.3, which was implemented straight from Helix). This file records only what the local plan adds: ownership, order, and every **deviation from Helix** (D1–D9 in `docs/requirements.md`, architecture §10, patterns §E10). Where this file and Helix differ, **this file wins**.

#### 👤 User Reference

**Description**: Create the table that stores one delivery address per user, locked so that people can only ever see or change their own.

**Acceptance Criteria**:
- [ ] `user_addresses` exists with the columns, `unique(user_id)`, RLS (select/insert/update own) and CHECKs defined in `docs/data/sql/0002_user_addresses.sql`.
- [ ] Anonymous (not-logged-in) API callers have no privileges on the table.
- [ ] `types/address.ts` exports `UserAddress` (Helix 3.1 shape) and `AddressInput` (fullName, phone, addressLine1, addressLine2?, city, state, pincode).
- [ ] Migration + rollback files are in `aura/supabase/migrations/`, byte-identical to `docs/data/sql/`.
- [ ] Applied to the **development** Supabase project only (never production in this story).

#### 🤖 AI Agent Reference

**Deviations from Helix (apply these)**:
- [ADDED] CHECK constraints (phone 10 digits, pincode 6 digits, text lengths) and `revoke … from anon` — see `docs/data/data-model-epic10.md`.
- [CORRECTED vs tech spec] update policy keeps `with check` (story 3.1 text wins).

**RBAC Enforcement**:
| Persona | Permission | Enforcement |
|---|---|---|
| Authenticated User | `address:read-own`, `address:write-own` | RLS `auth.uid() = user_id` |
| Guest | none | no policy for `anon`; privileges revoked |

**System responses + error cases**:
| Trigger | Response | Side-effect |
|---|---|---|
| User A upserts own address | row stored | — |
| User B reads/updates A's address | 0 rows / denied | none |
| Bad phone/pincode via API | CHECK violation | nothing stored |

**Prerequisites**: Epic 10 requirements/architecture/patterns/data design approved; previous stories in `Requires` done; development (non-production) Supabase project in use (see plan prerequisite P0).

**Implementation Steps**:
1. Confirm the development Supabase project exists and `aura/.env.local` points to it (prerequisite P0 in the implementation plan). Do NOT run anything against production.
2. Copy `docs/data/sql/0002_user_addresses.sql` and `…_rollback.sql` into `aura/supabase/migrations/` unchanged.
3. Create `aura/types/address.ts` (`UserAddress` as in Helix 3.1; `AddressInput` without id/userId).
4. Apply `0002` once in the dev project's SQL editor; confirm the table shows RLS enabled.
5. Run tests **T1–T4** of `docs/data/epic10-verification.sql` (the script is one transaction; run the whole file after 10.2, or only the 0002 tests now). Paste the PASS lines into the review doc.

**Test Requirements**:
- SQL tests T1–T4 (own insert/select, isolation, cross-user update, unique per user, CHECK rejections).
- `npx tsc --noEmit` passes with the new type file.
- Existing 16 Vitest tests unchanged and green.
- Quality gates: `npm run test` (all existing tests + new ones green), `npm run lint`, `npx tsc --noEmit`, `npm run build` clean; paste the actual command output into `docs/stories-implemented/story-10.1-review.md`.

**Out of Scope**:
- Any application code that reads/writes addresses (10.8).
- Applying to production (separate explicit step).

**Completion Evidence**: _(filled when done — test output, curl/SQL output, review doc path)_
