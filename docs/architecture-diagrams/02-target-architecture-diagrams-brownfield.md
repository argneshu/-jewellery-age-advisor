# Target Architecture Diagrams - Jewellery Age Advisor (Aura) — Favorites Completion

**Source**: `docs/architecture/design/02-target-architecture-brownfield.md`
**Generated**: 2026-09-29

> Mermaid diagrams extracted from the target architecture document for easy preview.

---

## Target System Context Diagram

```mermaid
flowchart TB
  User((Authenticated User))
  Guest((Guest))

  subgraph AuraApp["aura/ — Next.js App"]
    Card["JewelleryCard 🟡 modified\n(favorite toggle)"]
    FavPage["/favorites page 🆕 new"]
    FavRoute["app/api/favorites/route.ts 🆕 new\n(GET/POST/DELETE)"]
    FavLib["lib/favorites.ts 🆕 new\n(client fetch helpers)"]
    SupaServer["lib/supabase/server.ts 🟢 unchanged"]
    Proxy["proxy.ts + middleware.ts 🟢 unchanged\n(already protects these routes)"]
  end

  DB[("Supabase Postgres\npublic.favorites 🟢 unchanged\n(RLS already enforced)")]

  Guest -->|"click favorite → redirect"| Card
  Card -->|"favorite/unfavorite"| FavLib
  FavLib --> FavRoute
  User --> FavPage
  FavPage --> FavRoute
  Proxy -.->|guards| FavRoute
  Proxy -.->|guards| FavPage
  FavRoute --> SupaServer
  SupaServer --> DB
```

---

## Component Architecture (Target)

```mermaid
flowchart TB
  subgraph Existing["Existing — Unchanged"]
    SupaServer[lib/supabase/server.ts]
    Middleware[lib/supabase/middleware.ts + proxy.ts]
    AuthTypes["types/auth.ts (FavoriteRecord)"]
    Data["data/jewellery.ts"]
  end

  subgraph Modified["Modified"]
    JCard["components/recommendations/JewelleryCard.tsx"]
  end

  subgraph New["New"]
    Route["app/api/favorites/route.ts"]
    FavLib["lib/favorites.ts"]
    FavPage["app/favorites/page.tsx"]
  end

  JCard --> FavLib
  FavLib --> Route
  FavPage --> Route
  Route --> SupaServer
  Route --> AuthTypes
  FavPage --> Data
  Middleware -.guards.-> Route
  Middleware -.guards.-> FavPage
```

---

## Data Model Changes

```mermaid
erDiagram
  AUTH_USERS ||--o{ FAVORITES : "owns"
  FAVORITES {
    uuid id PK
    uuid user_id FK
    integer jewellery_item_id "references data/jewellery.ts id — no DB FK (static dataset)"
    timestamptz created_at
  }
```
