# Regression Test Report

**Date**: 2026-09-30
**Build**: `fed1dcd` (HEAD) vs. baseline `557cbfb` (Epic 8 validation)
**Tested By**: QA Agent
**Baseline Report**: `docs/testing/validation-report-epic-8-2026-09-29.md` (🟡 CONDITIONAL PASS)

---

## Summary

**Overall Status**: 🟢 NO REGRESSIONS

**New Failures**: 0
**Fixed Issues**: 0
**Flaky Tests**: 0 (4 consecutive runs, identical results)

### Changes since baseline

`git diff --stat 557cbfb HEAD` — 3 files, all documentation, **no source changes**:

| File | Change |
|------|--------|
| `docs/deployment/deployment-plan.md` | +144 (new) |
| `docs/deployment/discovery-report.md` | +48 (new) |
| `docs/status.md` | 13 lines edited |

Working tree clean at time of run. Because no code under `aura/` changed, a clean result was the expected outcome.

---

## Baseline limitation (read this)

The Epic 8 baseline was **not** an automated-suite run. It was scripted legacy-vs-rebuild comparison, code review and manual dev-server checks. It recorded **no** test totals (passed/failed/skipped) and **no** coverage %. So the "previous build" column below has no automated numbers to diff against.

What *can* be compared is the baseline's Quality Gate Status (0 critical / 0 high open bugs) and its documented Issues #1–#5. See "Baseline Issues Re-check".

---

## Test Suite Comparison

| Category | Previous Build (Epic 8) | Current Build | Change |
|----------|------------------------|---------------|--------|
| Total Tests | not recorded | 16 | n/a |
| Passed | not recorded | 16 | n/a |
| Failed | not recorded | 0 | n/a |
| Skipped | not recorded | 0 | n/a |
| Coverage | not recorded | **not measured** ⚠️ | n/a |

### Automated checks executed (this run)

| Check | Command (in `aura/`) | Result |
|-------|---------|--------|
| Unit tests | `npx vitest run` | ✅ 2 files, 16/16 passed (131 ms) |
| Type-check | `npx tsc --noEmit` | ✅ exit 0 |
| Lint | `npx eslint` | ✅ exit 0 |
| Production build | `npm run build` | ✅ exit 0 — 8 routes compiled (`/`, `/results`, `/favorites`, `/login`, `/register`, `/auth/callback`, `/api/favorites`, `/_not-found`) + Proxy (Middleware) |

### Test inventory (all passing)

- `lib/favorites.test.ts` — 7 tests (list/add/remove success and error paths, 409, 404, unparseable error body)
- `lib/recommendation-engine.test.ts` — 9 tests (`heirloomSkew`, `getRecommendations` incl. locked determinism baseline, `scoreItem`, `whyText`)

The locked heirloom regression baseline in `recommendation-engine.test.ts` ("is deterministic for a fixed input") still passes, so the engine output that Epic 8 measured is unchanged.

---

## New Failures (Regressions)

None.

## Fixed Issues

None. No source changes since baseline, so none of the Epic 8 findings were addressed.

## Flaky Tests

None. Suite run 4 times (1 full + 3 repeat); 16/16 each time.

---

## Baseline Issues Re-check

| Baseline Issue | Severity | Status now |
|---|---|---|
| #1 Form defaults differ from true legacy | 🟡 Medium | Unchanged (no code change) |
| #2 Design tokens differ from true legacy | 🟡 Medium | Unchanged |
| #3 Heirloom-skew top-6 differs from legacy | 🟡 Medium | Unchanged; locked baseline test still green |
| #4 Card image aspect ratio | 🟢 Low | Unchanged |
| #5 No-results wording | 🟢 Low | Unchanged |

Baseline Recommendation #2 (record the intentional divergence in `docs/requirements.md` or a decision record) is **still open** — `docs/requirements.md` is not in the diff since baseline.

---

## Coverage Changes

**Not measured.** `@vitest/coverage-v8` is not installed (`MISSING DEPENDENCY  Cannot find dependency '@vitest/coverage-v8'`). Installing it modifies `aura/package.json`, which is outside this workflow's write scope (`docs/testing/` only), so it was not installed.

This means the QA rulebook gate **Unit Test Coverage ≥85%** cannot be verified from this run.

Coverage-relevant observation (not a measurement): tests exist only for `lib/favorites.ts` and `lib/recommendation-engine.ts`. There are no tests for the API route (`app/api/favorites`), components (`JewelleryCard`, `RefilterBar`, `ResultsGrid`, `RecommendationForm`), auth pages, or `lib/format.ts`. Overall line coverage is therefore unlikely to reach 85% even once measurable.

---

## Quality Gates (QA Rulebook)

| Gate | Target | Actual | Status |
|------|--------|--------|--------|
| Unit Test Coverage | ≥85% | not measured | ⚠️ UNVERIFIED |
| Integration Tests | 100% pass | none exist | ⚠️ NOT APPLICABLE / GAP |
| Critical Bugs | 0 open | 0 | ✅ |
| High Bugs | 0 open | 0 | ✅ |
| Security Scan | No critical/high | not run | ⚠️ NOT RUN |
| Performance | Meets benchmarks | not run | ⚠️ NOT RUN |

---

## Environment note

Node `v20.20.2`. `@supabase/supabase-js` warns on every import that Node ≤ 20 is deprecated (upgrade to Node 22+). Not a failure today, but worth aligning before deploy (Epic 9); check the Node version selected on Vercel.

---

## Recommendations

1. 🟢 **No regressions — nothing blocks Epic 9 on regression grounds.**
2. 🟡 Install `@vitest/coverage-v8` (dev dependency) and record a real coverage number, so future regression runs have a baseline to diff. This is a code/config change, outside QA's write scope — needs dev action.
3. 🟡 Close baseline Recommendation #2 (document the intentional divergence from the legacy app).
4. 🟡 Consider tests for `app/api/favorites` and the favorites/results components; the Story 7.x work had coverage on the client lib only.
5. 🟢 Plan Node 22+ for the deployment target.

---

## Evidence

```
$ npx vitest run
 RUN  v4.1.11 /Users/argneshu.gupta/-jewellery-age-advisor/aura
 Test Files  2 passed (2)
      Tests  16 passed (16)
   Duration  131ms
VITEST EXIT: 0

$ npx tsc --noEmit        -> TSC EXIT: 0
$ npx eslint              -> LINT EXIT: 0
$ npm run build           -> BUILD EXIT: 0 (8 routes + Proxy)

$ npx vitest run --coverage
 MISSING DEPENDENCY  Cannot find dependency '@vitest/coverage-v8'

$ git diff --stat 557cbfb HEAD
 docs/deployment/deployment-plan.md  | 144 +++
 docs/deployment/discovery-report.md |  48 +++
 docs/status.md                      |  13 ++--
 3 files changed, 200 insertions(+), 5 deletions(-)

$ git status --short      -> (clean, before and after run)
```
