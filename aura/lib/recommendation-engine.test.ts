import { describe, expect, it } from "vitest";
import { JEWELLERY_ITEMS } from "@/data/jewellery";
import { getRecommendations, heirloomSkew, scoreItem, whyText } from "@/lib/recommendation-engine";
import type { RecommendationPrefs } from "@/types/jewellery";

describe("heirloomSkew", () => {
  it("is true for wedding/anniversary + wife/mother", () => {
    expect(heirloomSkew("wife", "wedding")).toBe(true);
    expect(heirloomSkew("mother", "anniversary")).toBe(true);
  });

  it("is false otherwise", () => {
    expect(heirloomSkew("wife", "birthday")).toBe(false);
    expect(heirloomSkew("self", "wedding")).toBe(false);
    expect(heirloomSkew("friend", "anniversary")).toBe(false);
  });
});

describe("getRecommendations", () => {
  const basePrefs: RecommendationPrefs = {
    age: 34,
    relationship: "wife",
    occasion: "wedding",
    budget: 200000,
    style: "",
  };

  it("returns at most 6 items, all within budget", () => {
    const results = getRecommendations(basePrefs);
    expect(results.length).toBeLessThanOrEqual(6);
    expect(results.every((item) => item.price <= basePrefs.budget)).toBe(true);
  });

  it("is deterministic for a fixed input (regression baseline)", () => {
    const results = getRecommendations(basePrefs);
    // Locked baseline for age 34 / wife / wedding / budget 200000 / no style
    // preference against the Epic 4 dataset — update deliberately if the
    // engine or dataset changes, not silently.
    expect(results.map((item) => item.id)).toEqual([16, 17, 18, 37, 36, 19]);
  });

  it("returns an empty array when nothing fits the budget", () => {
    const results = getRecommendations({ ...basePrefs, budget: 100 });
    expect(results).toEqual([]);
  });

  it("prefers items matching the style preference", () => {
    const withStyle = getRecommendations({ ...basePrefs, style: "traditional" });
    const item = JEWELLERY_ITEMS.find((i) => i.id === withStyle[0]?.id);
    expect(item?.style).toBe("traditional");
  });
});

describe("scoreItem", () => {
  const prefs: RecommendationPrefs = {
    age: 34,
    relationship: "wife",
    occasion: "wedding",
    budget: 200000,
    style: "",
  };

  it("scores an in-range, heirloom-eligible item higher than an out-of-range one", () => {
    const inRange = JEWELLERY_ITEMS.find((i) => i.id === 17)!; // Kundan Heirloom Choker, 25-60, traditional
    const kids = JEWELLERY_ITEMS.find((i) => i.id === 1)!; // Tiny Gold Stud Set, 1-12
    expect(scoreItem(inRange, prefs)).toBeGreaterThan(scoreItem(kids, prefs));
  });
});

describe("whyText", () => {
  it("produces the heirloom-skew sentence for a wedding+wife+traditional item", () => {
    const prefs: RecommendationPrefs = {
      age: 34,
      relationship: "wife",
      occasion: "wedding",
      budget: 200000,
      style: "",
    };
    const item = JEWELLERY_ITEMS.find((i) => i.id === 17)!;
    expect(whyText(item, prefs)).toBe(
      "Picked for your wife (34), wedding: an heirloom-worthy choice for wedding."
    );
  });

  it("falls back to the age bracket's tone otherwise", () => {
    const prefs: RecommendationPrefs = {
      age: 8,
      relationship: "daughter",
      occasion: "birthday",
      budget: 10000,
      style: "",
    };
    const item = JEWELLERY_ITEMS.find((i) => i.id === 1)!;
    expect(whyText(item, prefs)).toBe(
      "Picked for your daughter (8), birthday: safety-focused, lightweight pieces."
    );
  });
});
