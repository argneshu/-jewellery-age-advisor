# UI/UX Spec — Epic 10 (Aura Shopping Flow)
Approved 2026-10-08 (3 gates). Detail: `docs/ui-ux/01-discovery.md`, `08-visual-foundation.md`.
```yaml
version: 1.0
platform: Web, mobile-first (sm<768, md>=768, lg>=1024)
tech_stack: Next.js 16, Tailwind 4 @theme, shadcn/Base UI, lucide-react
design_tokens:
  existing: [cream, ivory, gold, gold-light, rose, rose-light, ink, ink-soft, border-soft, rounded-aura-xl, shadow-soft]
  new: {gold-deep: "#8a6a1f  # small gold text (prices, links); 4.96:1", rose-deep: "#9d5560  # cart badge bg; white 5.38:1"}
  status: {success: green-700, error: destructive}
  spacing: 4px base, Tailwind scale
  typography: {serif: Playfair Display, sans: Poppins, base: 16px, min: 12px}
  elevation: {1: shadow-soft, 2: shadow-md}
  touch_targets: {touch_min: 44px (<1024), desktop_min: 32px, spacing: 8px}
  icons: lucide outlined
known_gap: {AA-GAP-1: "existing gradient Button text contrast 2.7-3.8:1; unchanged (Epic 3); app-wide follow-up"}
responsive:
  widths: {cart: max-w-3xl, checkout: max-w-3xl, product: max-w-5xl, address: max-w-xl, confirm: max-w-2xl}
  navigation: existing top header + cart icon; <640 hide email
  cart_rows: {">=640": one row, "<640": two-line card stack}
  product: {"<768": 1 col, ">=768": 2 col}
  address_form: {"<640": 1 col, ">=640": name|phone, ">=768": city|state|pincode}
  modals: none
ux_logic:
  validation: on-submit, shared pure validators, noValidate, focus first invalid
  error_display: inline field text + destructive Alert for server errors; no raw DB text; no toast/modal
  success_feedback: inline "Added to cart ✓" + View Cart (role=status); redirects for address/order
  loading: button pending labels, fields disabled; no skeleton; cart pages show heading only until hydrated
  data_density: low-medium
component_map:
  new: [CartIconLink, CartItemRow, CartSummary, ProductDetail, AddressForm, CheckoutClient, OrderConfirmation]
  reuse: [Button, Input, Label, Alert, Separator, Card]
copy:
  cod: "Pay when your order arrives."
  upi: "Your UPI ID is saved with this order. No payment is taken on this page."
  max_qty: "Maximum 10 per item"
a11y:
  level: WCAG AA
  labels: {stepper: "Decrease/Increase quantity of <name>", cart: "View cart, N items", heart: existing}
  keyboard: heart never navigates; visible focus rings; focus first invalid field
  contrast: 4.5:1 text, 3:1 large/UI
```
