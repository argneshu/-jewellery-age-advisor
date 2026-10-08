import { describe, expect, it } from "vitest";
import { JEWELLERY_ITEMS } from "@/data/jewellery";
import { findItemByRouteId, getCatalogItem } from "@/lib/catalog";

describe("getCatalogItem", () => {
  it("returns the catalog item for a known id", () => {
    expect(getCatalogItem(JEWELLERY_ITEMS[0].id)).toBe(JEWELLERY_ITEMS[0]);
  });

  it.each([0, -1, 999999, 1.5, Number.NaN])("returns undefined for %s", (id) => {
    expect(getCatalogItem(id)).toBeUndefined();
  });
});

describe("findItemByRouteId", () => {
  it("finds every catalog item from its string id", () => {
    for (const item of JEWELLERY_ITEMS) {
      expect(findItemByRouteId(String(item.id))).toBe(item);
    }
  });

  it("covers the whole 40-item catalog", () => {
    expect(JEWELLERY_ITEMS).toHaveLength(40);
  });

  it.each(["", " ", "0", "00", "01", "-1", "1.0", "1e1", "0x1", " 1", "1 ", "abc", "1abc", "999", "41", "NaN", "Infinity", "%31"])(
    "returns undefined for the malformed or unknown id %j",
    (raw) => {
      expect(findItemByRouteId(raw)).toBeUndefined();
    }
  );
});
