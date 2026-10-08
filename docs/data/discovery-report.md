# Data Discovery Report — Epic 10 (Aura Shopping Flow)

**Date**: 2026-10-08 | **Agent**: AIRE_DATA_ENGINEER (scoped run — see ADR AD-D0) | **Mode**: Greenfield (no `docs/data/current-state.md`; three new OLTP tables added to an existing Supabase database)

| Item | Finding |
|------|---------|
| Initiative type | New dataset (3 tables + 1 function) in the existing operational Postgres (Supabase). No data platform, warehouse, pipeline or migration of existing data. |
| Existing assets (auto-detected) | `aura/supabase/migrations/0001_favorites.sql` only. No dbt/Airflow/streaming/contracts/IaC. |
| Sources | The app's Server Actions (`saveAddress`, `placeOrder`) writing as the logged-in user via the anon key + user JWT. |
| Consumers | `/checkout` (address read), `/order-confirmation/[id]` (order + items read). No BI, ML or partners. Future: order history page (out of scope). |
| Latency SLA | Synchronous, interactive (< 1 s). |
| Volume | Tiny (single-store storefront; tens of orders/day at most). No partitioning/archival needed. |
| Regulatory scope | None formally declared. Personal data under India's DPDP Act / GDPR-style principles applies in spirit: name, phone, postal address, UPI id. **Assumption — confirm before real launch.** Financial-record retention for real sales (tax) is NOT addressed: see AD-D3. |
| PII / classification (PRV1/2) | See `data-model-epic10.md` §4. |
| Retention | Not defined by the business. Default: keep until the user account is deleted (cascade). |
| Residency | Whatever region the Supabase project uses; not pinned. Open. |
| Tooling | Supabase Postgres, plain SQL migrations applied manually via the SQL editor; no CI for migrations (Epic 9 decided: no pipeline). |
| Cost | Negligible (3 small tables). |
| On-call / ownership | Project owner (user). No data-quality alerting exists. |

## Open questions (do not block design; must be answered before real payments/launch)
1. Real regulatory scope and retention period for orders (tax records).
2. Supabase region / residency.
3. Whether account deletion should delete order history (see AD-D3).
