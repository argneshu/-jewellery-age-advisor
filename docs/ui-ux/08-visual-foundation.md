# UI/UX Checkpoint 08 — Visual Foundation (Epic 10)

**Saved**: 2026-10-08 | Resume point for `aire-ui-ux-design` (Steps 04–08). Design system approved at Gate 1 (option **A**).

## Approved design system (delta over the existing Aura tokens)
- Existing tokens unchanged (cream, ivory, gold, gold-light, rose, rose-light, ink, ink-soft, border-soft, `rounded-aura-xl`, `shadow-soft`).
- **New**: `--aura-gold-deep: #8a6a1f` (`text-gold-deep`) — small gold text: prices, Grand Total, "Change", "View Cart →" (4.96:1 on ivory, 4.69:1 on cream). `gold` stays for icons/decoration/large display text only.
- **New**: `--aura-rose-deep: #9d5560` (`bg-rose-deep`) — cart badge background, white text (5.38:1), 12px text.
- Status text: success `green-700` (#15803d, 4.93:1); error = existing `destructive` token (≥4.5:1).
- **Known gap AA-GAP-1 (accepted, option A)**: existing `gradient` Button (ivory on gold→rose, 2.7–3.8:1) is left unchanged (Epic 3, shared by all screens). Logged for an app-wide follow-up; Epic 10 uses it for Add to Cart / Proceed / Place Order and compensates with clear disabled/pending states and 16px/600 label weight.
- Spacing base 4px (Tailwind scale). Type: Playfair Display (headings) / Poppins (body); minimum text size **12px**.
- Elevation: L0 none · L1 `shadow-soft` (cards, sections) · L2 `shadow-md` (card hover) · L3–L5 reserved/unused.

## Component hierarchy
- **Atoms (existing, reuse)**: `Button` (gradient/ghost), `Input`, `Label`, `Alert`, `Separator`, `Card`, lucide icons (`ShoppingBag`, `Heart`, `MapPin`, `Banknote`, `Smartphone`, `CheckCircle2`, `Minus`, `Plus`, `X`, `ArrowLeft`).
- **Molecules (new, feature-local in `components/cart/` or the route folder)**: `CartIconLink` (icon + badge), `CartItemRow`, `CartSummary`, price/total row, radio "payment option" card, address block, form field (label + input + inline error — same `space-y-1` pattern as existing auth forms; **not** a new shared component).
- **Organisms**: `ProductDetail`, `CartPage`, `AddressForm`, `CheckoutClient` (Order Summary / Delivery Address / Payment Method sections), Order Confirmation page.
- No new shared-library primitives (Reusability Check: everything generic already exists in `components/ui/`).

## Grid & layout
| Viewport | Columns | Content width |
|----------|---------|---------------|
| lg ≥1024 | 12 | centred `max-w-3xl` (cart, checkout), `max-w-5xl` (product), `max-w-xl` (address), `max-w-2xl` (confirmation) |
| md ≥768 | 8 | same max widths, `px-4` gutters |
| sm <768 | 4 | full-bleed with `px-4` |

## Responsive strategy (all viewports, mobile-first)
- Breakpoints: sm 640 · md 768 · lg 1024 (xl unused).
- **Navigation**: existing top header only. Right group = cart icon → (email, Log out) or (Sign in, Register). Below 640px the email text is hidden (Log out stays); the header must not overflow at 375px.
- **Product detail**: <768 single column (image first, Add to Cart full-width); ≥768 two columns (image | details).
- **Cart rows (card-stack)**: ≥640 one row (swatch · name/price · stepper · line total · remove); <640 two lines — top: swatch + name/category/unit price + remove; bottom: stepper left, line total right. Fixes Helix's row that overflows at 375px.
- **Forms (address)**: <640 single column; ≥640 Full Name | Phone side by side; City | State | Pincode three columns from ≥768 (two lines below), Address lines always full width. Cancel/Save buttons stack full-width <640.
- **Checkout**: single column of three section cards at every size (Order Summary, Delivery Address, Payment Method) then Place Order full-width; no modals.
- **Order confirmation**: single column; Payment | Delivering-to side by side ≥640, stacked below.
- **Modals/sheets**: none in this epic. **Tables/charts**: none.
- **Touch targets**: ≥44×44px for every interactive control on viewports <1024 (stepper −/+, remove ×, radio cards, heart, cart icon, "Change"/"View Cart" links via padding), ≥32px on desktop; 8px minimum spacing between adjacent targets. Visual size may stay smaller (e.g. a 28px stepper circle inside a 44px hit area).
- **Type scales**: lg [12,14,16,20,24,32]; sm [12,13,15,18,22,28] (floor 12px, deviating from the template's 11px). Spacing lg [4,8,16,24,32,48,64]; sm [4,8,12,16,24,32,48].
