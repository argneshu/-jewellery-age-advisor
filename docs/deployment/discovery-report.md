# DevOps Discovery Report - Jewellery Age Advisor (Aura)

**Date**: 2026-09-29
**Author**: DEVOPS
**Source**: PATH S (no tracker story) — driven by Helix's Epic 9 spec (solution doc 4938)

---

## Auto-Detected Application Profile

| Item | Value |
|------|-------|
| Language/Framework | Node.js + TypeScript, Next.js 16.3.6 (App Router) |
| Package manager | npm (`package-lock.json` present) |
| Build command | `next build` |
| Start command | `next start` |
| Lint command | `eslint` |
| Test command | `vitest run` |
| Node version | No `.nvmrc` pinned; developed against Node 20.20.2. `@supabase/supabase-js` warns that Node 20 and below are deprecated, recommends Node 22+ |
| Containerization | None — no `Dockerfile`/`docker-compose.yml`/`.dockerignore` (not needed; Vercel builds Next.js natively) |
| Existing CI | None — no `.github/workflows/` |
| Database | Supabase Postgres — **already provisioned**, not part of this deployment's scope |
| External services | None beyond Supabase |
| Required env vars (from `aura/.env.local.example`) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (present but unused by any code as of Epic 7) |

## Deployment Requirements (User-Confirmed)

- **Deployment model**: Serverless — **Vercel**, per the Migration Document's Epic 9 spec (§8 Step 9) and the original app's static-friendly deployment spirit.
- **CI pipeline**: **None for now** — explicitly declined by user. `aire-devops-pipeline` is skipped; Vercel's own GitHub integration handles build/deploy on push, with no separate GitHub Actions workflow.
- **Infrastructure target**: None to provision — Vercel is a fully-managed PaaS (no VPC/VNet, no compute/database/storage modules, no Terraform). Supabase is already provisioned and out of scope for this deployment.
- **Per-module configuration**: N/A — no infrastructure modules selected (Step 3 of the discovery workflow doesn't apply; there is nothing to provision).
- **Branch strategy**: Single `main` branch (current repo state); Vercel's default is to deploy every push to `main` to production, with preview deployments on other branches/PRs. No `develop` branch or branch-protection pipeline exists yet — out of scope per user's "no pipeline" instruction.
- **Service dependencies**: Aura (Next.js) → Supabase (Auth + Postgres). No other services.
- **Secret management**: Vercel's built-in encrypted Environment Variables UI (Project Settings → Environment Variables) — no external secrets manager needed for 2-3 env vars.

## Out of Scope (per user direction + Epic 9's own scope statement)

- No CI/CD pipeline (`aire-devops-pipeline` skipped).
- No Terraform/IaC — nothing to provision.
- No containerization.
- No new database/storage/cache/queue modules.
- No WAF, no Private DNS Zones (never asked, none requested).

## Tracker Stories

None — no Jira/GitHub/Azure DevOps DevOps story exists for this work (PATH S). This deployment is
driven directly by Helix's Epic 9 spec (solution document 4938, "Epic 9: Deploy") — Stories 9.1
(push + Vercel link), 9.2 (env vars + Supabase redirect URLs), 9.3 (production smoke test).
