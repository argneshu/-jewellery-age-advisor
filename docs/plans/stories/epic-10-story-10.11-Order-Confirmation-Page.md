### Story 10.11: Order Confirmation Page

**File**: `docs/plans/stories/epic-10-story-10.11-Order-Confirmation-Page.md`

**Epic**: 10 - AURA SHOPPING FLOW | **ID**: 10.11 | **Date**: 2026-10-08 | **Jira**: LOCAL | **GitHub**: LOCAL | **BUILDID**: NO-CYCLE
**Helix**: Story 4.3 — solution 1080, document 5888 (local snapshot: `docs/helix/INDEX.md`; the Helix text is the base spec — read it first, it contains the full reference code)
**Wave**: 8
**Requires**: ["10.10"]
**Enables**: []
**Files Touched**:
  - aura/app/order-confirmation/[id]/page.tsx
  - aura/lib/checkout.ts
  - aura/lib/checkout.test.ts
**Roles Ref**: docs/requirements.md#roles--permissions-matrix — Authenticated User (own orders)
**QA Candidate**: Yes — **Observable:** confirmation page after ordering; other users' orders are 404.

> **How to read this story.** The Helix story already holds the complete user story, implementation code and Definition of Done (same precedent as Story 7.3, which was implemented straight from Helix). This file records only what the local plan adds: ownership, order, and every **deviation from Helix** (D1–D9 in `docs/requirements.md`, architecture §10, patterns §E10). Where this file and Helix differ, **this file wins**.

#### 👤 User Reference

**Description**: Show the shopper a clear confirmation of what they ordered.

**Acceptance Criteria**:
- [ ] `/order-confirmation/[id]` requires login (guest → `/login`); malformed (non-UUID), unknown or other users' ids → 404.
- [ ] Shows success icon, `#` + last 8 chars of the id (upper-case), items with qty and prices, Grand Total, payment method (UPI id shown), delivery address from the snapshot, “Estimated delivery: 5–7 business days”, “Continue Shopping” → `/`.
- [ ] Full 12-step happy path from the Helix epic passes end-to-end; cart badge gone and `/cart` empty afterwards.

#### 🤖 AI Agent Reference

**Deviations from Helix (apply these)**:
- [ADDED] `isUuid` check before querying; `.maybeSingle()`; `shortOrderId()` is a pure tested helper.

**UI/UX (from `docs/ui-ux/ui-ux-spec.md`, approved 2026-10-08)**:
- Prices/Grand Total `text-gold-deep`; UPI line reads “UPI — <id>” using the same wording rule; Payment | Delivering-to side by side ≥640, stacked below; move focus to the `<h1>` on load.

**RBAC Enforcement**:
| Persona | Behaviour |
|---|---|
| Owner | sees order |
| Other signed-in user | 404 (RLS returns no row) |
| Guest | → login |

**System responses + error cases**:
| Trigger | Response | Side-effect |
|---|---|---|
| Unknown/other user's id | 404 | — |

**Prerequisites**: Epic 10 requirements/architecture/patterns/data design approved; previous stories in `Requires` done; development (non-production) Supabase project in use (see plan prerequisite P0).

**Implementation Steps**:
1. TDD: `isUuid`, `shortOrderId` tests, then implement in `lib/checkout.ts`.
2. Create the page per Helix 4.3 with the changes above.
3. Run the 12-step smoke test with two users; confirm user B gets 404 for A's order id; paste evidence.

**Test Requirements**:
- isUuid: valid v4, upper-case, with braces, empty, SQL-ish string, 35/37 chars.
- shortOrderId: strips dashes, last 8, upper-case.
- Manual: the 12-step Helix smoke test; cross-user 404; guest redirect.
- Coverage ≥85% on the new helpers.
- Quality gates: `npm run test` (all existing tests + new ones green), `npm run lint`, `npx tsc --noEmit`, `npm run build` clean; paste the actual command output into `docs/stories-implemented/story-10.11-review.md`.

**Out of Scope**:
- Order history list, invoice/PDF, cancel.

**Completion Evidence**: 249/249 tests; lib/checkout.ts 100% coverage; tsc/lint/build clean; guest curl 307. Review: `docs/stories-implemented/story-10.11-review.md`. Signed-in checks pending user.
