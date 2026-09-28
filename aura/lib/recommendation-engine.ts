import { JEWELLERY_ITEMS } from "@/data/jewellery";
import type { JewelleryItem, Occasion, RecommendationPrefs, Relationship } from "@/types/jewellery";
import { relationshipTone } from "@/lib/format";

// Ported per Migration Document §1.3. NOTE (Epic 6): the document's design
// (this file) diverges from the real -jewellery-age-advisor/app.js, which
// uses a different scoreItem/recommend implementation entirely — see
// Migration Document §9 item 10. Per explicit instruction, Epic 4 and this
// epic follow the document's schema/design, not the live code.

interface AgeBracket {
  min: number;
  max: number;
  tone: string;
}

// Boundaries match the document's §1.3 brackets; tone strings reused from
// the real app.js's AGE_BRACKETS labels (same boundaries, doc didn't specify
// its own wording).
const AGE_BRACKETS: AgeBracket[] = [
  { min: 1, max: 12, tone: "safety-focused, lightweight pieces" },
  { min: 13, max: 19, tone: "trendy, affordable daily-wear pieces" },
  { min: 20, max: 29, tone: "statement, work-to-evening pieces" },
  { min: 30, max: 45, tone: "elegant, premium, investment pieces" },
  { min: 46, max: 60, tone: "classic, heritage pieces" },
  { min: 61, max: 80, tone: "timeless, low-maintenance pieces" },
];

export function ageBracket(age: number): AgeBracket {
  return (
    AGE_BRACKETS.find((b) => age >= b.min && age <= b.max) ??
    AGE_BRACKETS[AGE_BRACKETS.length - 1]
  );
}

export function heirloomSkew(relationship: Relationship, occasion: Occasion): boolean {
  return (
    (occasion === "wedding" || occasion === "anniversary") &&
    (relationship === "wife" || relationship === "mother")
  );
}

// The document gives only one example (wedding -> [...]); the other five
// occasions are filled in following the same shape. Given the real tag
// vocabulary ported in Epic 4 (occasion + relationship words only, no
// free-form descriptors like "bridal"/"heirloom"), only the occasion's own
// name will typically match an item's tags — the extra descriptive tags are
// forward-compatible with a richer tag vocabulary later, not dead weight.
const OCCASION_TAG_BOOST: Record<Occasion, string[]> = {
  birthday: ["birthday", "everyday", "gift"],
  wedding: ["wedding", "heirloom", "bridal", "statement"],
  anniversary: ["anniversary", "heirloom", "romantic", "statement"],
  festival: ["festival", "traditional", "heirloom"],
  everyday: ["everyday", "minimal"],
  graduation: ["graduation", "achievement"],
};

export function occasionTagBoost(occasion: Occasion): string[] {
  return OCCASION_TAG_BOOST[occasion];
}

function isHeirloomEligible(item: JewelleryItem): boolean {
  return (
    item.tags.includes("heirloom") ||
    item.style === "traditional" ||
    item.style === "statement"
  );
}

export function scoreItem(item: JewelleryItem, prefs: RecommendationPrefs): number {
  let score = 0;

  if (prefs.age >= item.ageMin && prefs.age <= item.ageMax) {
    score += 10;
  } else {
    const distance =
      prefs.age < item.ageMin ? item.ageMin - prefs.age : prefs.age - item.ageMax;
    score += Math.max(0, 6 - distance * 0.5);
  }

  if (heirloomSkew(prefs.relationship, prefs.occasion) && isHeirloomEligible(item)) {
    score += 6;
  }

  const boostTags = occasionTagBoost(prefs.occasion);
  const matchingTags = item.tags.filter((tag) => boostTags.includes(tag)).length;
  score += matchingTags * 3;

  if (prefs.style && item.style === prefs.style) {
    score += 5;
  }

  if (item.price <= prefs.budget) {
    score += 4 + (item.price / prefs.budget) * 2;
  } else {
    // Dead in practice — getRecommendations filters over-budget items out
    // before scoring runs (ported as-is per Migration Document §1.3 item 4/§9 item 7).
    score -= 8;
  }

  return score;
}

export function getRecommendations(
  prefs: RecommendationPrefs,
  allowOverBudget = false,
  items: JewelleryItem[] = JEWELLERY_ITEMS
): JewelleryItem[] {
  const pool = allowOverBudget ? items : items.filter((item) => item.price <= prefs.budget);

  return pool
    .map((item) => ({ item, score: scoreItem(item, prefs) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((r) => r.item);
}

export function whyText(item: JewelleryItem, prefs: RecommendationPrefs): string {
  const reason =
    heirloomSkew(prefs.relationship, prefs.occasion) && isHeirloomEligible(item)
      ? `an heirloom-worthy choice for ${prefs.occasion}`
      : ageBracket(prefs.age).tone;

  return `Picked for ${relationshipTone(prefs.relationship)} (${prefs.age}), ${prefs.occasion}: ${reason}.`;
}
