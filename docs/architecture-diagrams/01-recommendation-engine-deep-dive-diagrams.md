# Recommendation Engine Deep-Dive Diagrams

Extracted from `docs/architecture/current/01-recommendation-engine-deep-dive.md` for quick visual review.

---

## Sequence: Get Recommendations (active `aura/` implementation)

```mermaid
sequenceDiagram
  participant User
  participant Form as RecommendationForm
  participant Router as Next Router
  participant Results as /results page + ResultsGrid
  participant Engine as recommendation-engine.ts
  participant Data as JEWELLERY_ITEMS

  User->>Form: fill age/relationship/occasion/budget/style
  Form->>Router: push /results?age=..&relationship=..&occasion=..&budget=..&style=..
  Router->>Results: render with prefs from query params
  Results->>Engine: getRecommendations(prefs)
  Engine->>Data: filter items (price <= budget, unless allowOverBudget)
  Engine->>Engine: scoreItem(item, prefs) for each remaining item
  Engine-->>Results: top 6 items sorted by score desc
  Results->>Engine: whyText(item, prefs) per item (via JewelleryCard)
  Results-->>User: rendered grid of up to 6 cards with reasons
```

---

## Flow: Score a Single Item (active vs. legacy side-by-side)

```mermaid
flowchart TD
  Start([scoreItem input: item, prefs]) --> AgeCheck{age in item's ageMin..ageMax?}
  AgeCheck -->|yes| AgeIn[+10 active / +40 legacy]
  AgeCheck -->|no| AgeOut["+max(0, 6 - distance*0.5) active\n+max(0, 20 - distance) legacy"]
  AgeIn --> Heirloom
  AgeOut --> Heirloom
  Heirloom{heirloomSkew AND item heirloom-eligible?}
  Heirloom -->|yes| HeirloomBoost["+6 active (tags/traditional/statement)\n+30 legacy (style==='traditional' only)"]
  Heirloom -->|no| TagBoost
  HeirloomBoost --> TagBoost
  TagBoost["active: +3 per matching occasion-boost tag\nlegacy: +20 flat if occasionTags includes occasion, +10 flat if relationshipTags includes relationship"]
  TagBoost --> StyleCheck{style preference set?}
  StyleCheck -->|matches| StyleMatch["+5 active / +15 legacy"]
  StyleCheck -->|mismatches, legacy only| StyleMismatch["-10 legacy (active: no penalty)"]
  StyleCheck -->|no preference| Budget
  StyleMatch --> Budget
  StyleMismatch --> Budget
  Budget{price <= budget?}
  Budget -->|yes| BudgetIn["+4 + (price/budget)*2 active\n+15 legacy, plus reason bump if headroom<15%"]
  Budget -->|no| BudgetOut["-8 active (dead code, pre-filtered out)\n-50 legacy (NOT pre-filtered — can still appear, then removed by recommend()'s own filter)"]
  BudgetIn --> End([final score])
  BudgetOut --> End
```
