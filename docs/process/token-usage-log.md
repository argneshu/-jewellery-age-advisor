# Token / Cost Tracking — Epic 10 (Aura Shopping Flow)

**Purpose**: running record of how much model usage this development consumes, so cost can be reported at the end.
**Caveat (read first)**: Claude Code does not expose billing to the assistant. The only live figure available in-session
is a "tokens left" counter that is not a reliable meter (it has moved up as well as down). The authoritative numbers are the
ones Claude Code itself reports — run **`/cost`** (API-key billing) or **`/usage`** (subscription) in the terminal, and the
Anthropic Console usage page for API accounts. Entries below are **estimates by phase**, recorded by the assistant.

| Date | Phase | What was done | Relative size | Notes |
|------|-------|---------------|---------------|-------|
| 2026-10-08 | Setup + Helix connect | MCP OAuth, listed Helix docs | Small | |
| 2026-10-08 | Helix read + sync | Fetched 15 docs (≈ 100k+ tokens of document text read and re-written to `docs/helix/`) | **Large** (largest so far: docs read once, written once) | Re-reading is cached after first use |
| 2026-10-08 | Requirements (Epic 10) | Code reading + ~490-line requirements section | Medium | |
| 2026-10-08 | Target architecture (Epic 10) | ~370-line section + diagrams | Medium | |
| 2026-10-08 | Patterns (Epic 10) | ~250-line section | Medium | |

**Forecast for the remaining work (rough, relative)**: data-design (small–medium), plan (small), 11 stories with TDD
(the bulk — each story = read, tests, code, build/lint/test runs, review doc; expect medium per story, larger for 10.10),
review + QA + regression (medium). Long sessions are the main cost driver because every turn re-sends the growing
conversation (mostly served from the prompt cache at a discount). Biggest levers: use `/clear` or a fresh session between
epics-phases, avoid re-fetching Helix docs (use `docs/helix/`), and avoid sub-agents unless needed.

**At the end**: run `/cost` (or `/usage`) and paste the totals here under "Final".

## Final
_(to be filled from `/cost` at the end of implementation)_

## Update 2026-10-08 (after data design)
| Phase | Relative size | Notes |
|-------|---------------|-------|
| Patterns (Epic 10) | Medium | Includes coverage-tool install (`@vitest/coverage-v8`, approved) |
| Data design (scoped) | Medium–Large | 6 SQL files + rollbacks, 14-test verification script, 3 docs |

## Update 2026-10-08 (after planning)
| Phase | Relative size | Notes |
|-------|---------------|-------|
| Implementation plan (Epic 10) | Medium | 11 compact story files (deltas over Helix, not full code copies), dependency graph, plan section. Kept compact on purpose to save tokens. |

## Update 2026-10-08 (after UI/UX)
| Phase | Relative size | Notes |
|-------|---------------|-------|
| UI/UX design (3 gates) | Small–Medium | Measured WCAG contrast on real tokens; spec kept compact (<700 tokens per workflow rule); stories 10.3–10.8, 10.10–10.11 updated with UI/UX deltas |

## Update 2026-10-08 (Story 10.3)
| Phase | Relative size | Notes |
|-------|---------------|-------|
| Story 10.3 implementation | Medium | Tests-first (46 tests), 2 new source files, layout/tokens edit, full gates (test/coverage/lint/tsc/build), review doc. Expect similar or smaller for 10.4–10.7, larger for 10.8/10.10. |

## Update 2026-10-08 (Stories 10.4, 10.5)
| Phase | Relative size | Notes |
|-------|---------------|-------|
| Story 10.4 | Small–Medium | hook extraction + card edit + 4 tests |
| Story 10.5 | Medium | catalog helper (26 tests), 2 new components, 40-page HTTP check, review doc |

## Update 2026-10-08 (Story 10.6)
| Phase | Relative size | Notes |
|-------|---------------|-------|
| Story 10.6 | Small–Medium | 12 tests, 1 component, header edit; used headless Chrome screenshots (cheap, replaces manual browser checks) |

## Update 2026-10-08 (Story 10.7)
| Phase | Relative size | Notes |
|-------|---------------|-------|
| Story 10.7 | Medium | 3 components, 4 tests, 2 screenshot rounds, review doc |

## Update 2026-10-08 (Stories 10.1, 10.2)
| Phase | Relative size | Notes |
|-------|---------------|-------|
| Story 10.1 | Medium | 2 SQL copies, types, API verification script, parser check, review |
| Story 10.2 | Medium–Large | 4 SQL copies, 55-check API script, defect found by the live check -> fix in 6 docs/SQL files, guard test, combined repair script |
