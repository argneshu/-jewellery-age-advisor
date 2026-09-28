// Ported from -jewellery-age-advisor/styles.css (.g-gold-soft etc.) — the
// original placeholder gradients, now used as the onError fallback for a
// jewellery item's photo (Migration Document §6, Epic 4 Story 4.4) instead
// of the item's sole visual (Epic 6 wires this into JewelleryCard).

export const JEWELLERY_GRADIENTS = {
  "gold-soft": "linear-gradient(135deg, #f3e2b8, #c9a24b)",
  "rose-soft": "linear-gradient(135deg, #f0cfc6, #d9a79c)",
  "cream-gold": "linear-gradient(135deg, #fbf6ee, #c9a24b)",
  "gold-bold": "linear-gradient(135deg, #c9a24b, #7a5c1e)",
  "rose-bold": "linear-gradient(135deg, #d9a79c, #8a4a3b)",
} as const;

export type JewelleryGradientKey = keyof typeof JEWELLERY_GRADIENTS;

const CATEGORY_GRADIENT: Record<string, JewelleryGradientKey> = {
  Ring: "gold-bold",
  Necklace: "rose-bold",
  Earrings: "rose-soft",
  Bracelet: "gold-soft",
  Bangle: "cream-gold",
  Anklet: "gold-soft",
  Pendant: "rose-soft",
  Set: "gold-bold",
  Chain: "cream-gold",
  "Hair Jewellery": "cream-gold",
};

export function gradientForCategory(category: string): string {
  const key = CATEGORY_GRADIENT[category] ?? "gold-soft";
  return JEWELLERY_GRADIENTS[key];
}
