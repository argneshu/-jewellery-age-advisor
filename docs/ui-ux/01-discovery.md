# UI/UX Discovery — Epic 10 (Aura Shopping Flow)

**Date**: 2026-10-08 | **Agent**: UI_UX_DESIGNER | **Mode**: Brownfield (extends the existing Aura design system; no new system)
**Inputs**: `docs/requirements.md` (Epic 10), architecture §10, patterns §E10, Helix epic/story markup (`docs/helix/`), `aura/app/globals.css`, `aura/components/ui/*`.
**User answers (2026-10-08)**: "S" — accept all recommended defaults.

| # | Question | Decision |
|---|----------|----------|
| 1 | Target emotion | Friendly & approachable, with a premium, trustworthy feel at checkout |
| 2 | Design system | Keep existing Tailwind 4 `@theme` tokens + shadcn/Base UI components; no new system |
| 3 | Data density | Low–medium (spacious cards like the existing results grid) |
| 4 | Navigation | Existing top header; add cart icon + badge; no sidebar/tabs |
| 5 | Error display | Inline under fields (address form) + destructive `Alert` for server errors; no modals/toasts |
| 6 | Loading states | Button pending labels ("Placing Order…", "Saving…") + disabled state; no skeletons |
| 7 | Colors | Existing palette (gold primary, rose accent); status colours only where needed |
| 8 | Accessibility | **WCAG AA minimum** (4.5:1 text, 3:1 large text/UI components) |
| 9 | Inspiration | None — keep Aura's warm-luxury look |
| 10 | Responsive | All viewports, mobile-first (sm / md / lg) |

## Findings from the existing code (measured, not assumed)
Contrast ratios computed from `app/globals.css` tokens (WCAG formula):

| Pair | Ratio | AA text (4.5) | AA large / UI (3.0) | Where Helix uses it |
|------|-------|---------------|---------------------|---------------------|
| `ink` on `ivory` | 15.0 | ✅ | ✅ | body text |
| `ink-soft` on `ivory` / `cream` | 6.1 / 5.8 | ✅ | ✅ | secondary text |
| **`gold` on `ivory`** | **2.67** | ❌ | ❌ | **every price** (`text-gold font-semibold`), "Change"/"View Cart →" links, Grand Total |
| `gold` on `cream` | 2.52 | ❌ | ❌ | same on page background |
| **white/ivory on `rose`** | **3.8** | ❌ (10px badge text) | ✅ only if large | cart badge (`text-[10px]`) |
| ivory text on `gold→rose` gradient button | 2.7–3.8 | ❌ | partly | existing `gradient` Button (Epic 3) used for Add to Cart / Place Order |
| `green-600` (#16a34a) on `ivory` | 3.24 | ❌ | ✅ | "Free" delivery text |
| `border-soft` on `ivory` | 1.3 | n/a | ❌ (non-text 3:1) | card borders (decorative only; content is still distinguishable by shadow/text) |

Other measured gaps in Helix markup: quantity stepper buttons `h-7 w-7` (28px) and remove `×` (18px, no padding) are below the 44px touch minimum; cart badge text is 10px; "Free" is `green-600`.
