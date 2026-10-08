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

---
---

# Epic 10 — Aura Shopping Flow — Target Architecture Diagrams

**Source**: `docs/architecture/design/02-target-architecture-brownfield.md` (Epic 10 section)
**Generated**: 2026-10-08

> Mermaid diagrams extracted from the target architecture document for easy preview.

## 10.4 Target System Context

```mermaid
flowchart TB
  Guest((Guest))
  User((Authenticated User))

  subgraph Browser["Browser"]
    LS[("localStorage\naura_cart")]
    Cart["CartProvider 🆕\n(context/CartContext.tsx)"]
    Card["JewelleryCard 🟡"]
    Prod["/product/[id] 🆕"]
    CartPage["/cart 🆕"]
    CheckoutC["CheckoutClient 🆕"]
    AddrForm["AddressForm 🆕"]
  end

  subgraph Server["Next.js server"]
    Proxy["proxy.ts → middleware.ts 🟡\n(+/checkout, /order-confirmation)"]
    CheckoutP["/checkout page 🆕 (guards)"]
    AddrP["/checkout/address page 🆕"]
    Conf["/order-confirmation/[id] 🆕"]
    SA1["Server Action saveAddress 🆕"]
    SA2["Server Action placeOrder 🆕"]
    Lib["lib/checkout.ts 🆕 (pure)\nlib/cart.ts 🆕 (pure)"]
    Cat["data/jewellery.ts 🟢\n(price authority)"]
  end

  subgraph DB["Supabase Postgres (RLS)"]
    UA[("user_addresses 🆕")]
    OR[("orders 🆕")]
    OI[("order_items 🆕")]
    FN["place_order() 🆕\nSECURITY INVOKER"]
    FV[("favorites 🟢")]
  end

  Guest --> Card --> Prod --> Cart --> LS
  Guest --> CartPage
  User --> CheckoutP --> CheckoutC --> SA2
  User --> AddrP --> AddrForm --> SA1
  User --> Conf
  Proxy -.guards.-> CheckoutP
  Proxy -.guards.-> AddrP
  Proxy -.guards.-> Conf
  SA1 --> Lib --> UA
  SA2 --> Lib
  Lib --> Cat
  SA2 -->|"rpc('place_order')"| FN --> OR
  FN --> OI
  FN -->|reads| UA
  Conf --> OR
  Conf --> OI
```

## 10.5 Component Architecture (Target)

```mermaid
flowchart LR
  subgraph New["🆕 New"]
    cartlib["lib/cart.ts (pure)"]
    ctx["context/CartContext.tsx"]
    icon["CartIconLink"]
    row["CartItemRow"]
    sum["CartSummary"]
    cartpage["app/cart/page.tsx"]
    pd["ProductDetail + page"]
    chk["lib/checkout.ts (pure)"]
    uf["lib/useFavorite.ts"]
    rr["lib/supabase/route-rules.ts (pure)"]
    ap["checkout/address/*"]
    cp["checkout/*"]
    oc["order-confirmation/[id]"]
  end
  subgraph Mod["🟡 Modified"]
    layout["app/layout.tsx"]
    hdr["AuthHeader"]
    jc["JewelleryCard"]
    mw["lib/supabase/middleware.ts"]
  end
  subgraph Same["🟢 Unchanged"]
    cat["data/jewellery.ts"]
    fav["lib/favorites.ts"]
    srv["lib/supabase/server.ts"]
    cli["lib/supabase/client.ts"]
  end
  layout --> ctx
  ctx --> cartlib
  hdr --> icon --> ctx
  jc --> uf --> fav
  pd --> uf
  pd --> ctx
  cartpage --> row --> ctx
  cartpage --> sum --> ctx
  sum --> cli
  cp --> chk --> cat
  cp --> srv
  ap --> chk
  ap --> srv
  oc --> srv
  mw --> rr
  cartlib --> cat
```

## 10.6 Data Architecture

```mermaid
erDiagram
  AUTH_USERS ||--o{ FAVORITES : owns
  AUTH_USERS ||--o| USER_ADDRESSES : "has one (unique user_id) 🆕"
  AUTH_USERS ||--o{ ORDERS : places
  ORDERS ||--|{ ORDER_ITEMS : contains
  USER_ADDRESSES {
    uuid id PK
    uuid user_id FK "unique, on delete cascade"
    text full_name
    text phone "check ^[0-9]{10}$"
    text address_line1
    text address_line2 "nullable"
    text city
    text state
    text pincode "check ^[0-9]{6}$"
    timestamptz created_at
    timestamptz updated_at
  }
  ORDERS {
    uuid id PK
    uuid user_id FK "on delete cascade"
    jsonb address_snapshot "object; copy of user_addresses row at order time"
    text payment_method "cod | upi"
    text upi_id "not null iff upi"
    integer subtotal "check >= 0"
    integer total "check >= 0"
    text status "confirmed|processing|shipped|delivered|cancelled; default confirmed"
    timestamptz created_at
  }
  ORDER_ITEMS {
    uuid id PK
    uuid order_id FK "on delete cascade"
    integer jewellery_item_id "no FK - static catalog"
    text name "snapshot"
    integer price "snapshot, check >= 0"
    integer quantity "check 1..10"
  }
```

## 10.16 Order Placement Sequence

```mermaid
sequenceDiagram
  actor U as Authenticated User
  participant C as CheckoutClient (browser)
  participant A as Server Action placeOrder
  participant L as lib/checkout.ts + data/jewellery.ts
  participant D as Postgres place_order() [one transaction]
  U->>C: click Place Order (ref lock + disabled)
  C->>A: { paymentMethod, upiId?, items:[{id,quantity}] }
  A->>A: getUser() (reject if none)
  A->>L: validate + price from catalog (reject unknown id / bad qty / empty)
  L-->>A: priced lines, subtotal
  A->>D: rpc(p_payment_method, p_upi_id, p_items)
  D->>D: auth.uid(), validate, read user_addresses, insert orders + order_items
  alt success
    D-->>A: order id
    A-->>C: { ok: true, orderId }
    C->>C: clearCart()
    C->>U: router.push(/order-confirmation/orderId)
  else any failure
    D-->>A: exception (rolled back, no rows)
    A-->>C: { ok: false, safe message }
    C->>U: Alert; cart kept
  end
```
