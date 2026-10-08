import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { JEWELLERY_ITEMS } from "@/data/jewellery";
import { hasRealPhoto, REAL_PHOTO_IDS } from "@/lib/product-images";

describe("hasRealPhoto", () => {
  it("is true for items with a curated photo and false for unknown ids", () => {
    expect(hasRealPhoto(16)).toBe(true);
    expect(hasRealPhoto(1)).toBe(true);
    expect(hasRealPhoto(40)).toBe(true);
    expect(hasRealPhoto(0)).toBe(false);
    expect(hasRealPhoto(41)).toBe(false);
    expect(hasRealPhoto(999)).toBe(false);
  });

  it("covers every catalog item", () => {
    expect([...REAL_PHOTO_IDS].sort((a, b) => a - b)).toEqual(JEWELLERY_ITEMS.map((i) => i.id).sort((a, b) => a - b));
  });

  it("only lists catalog items whose image file exists and is credited to Pexels", () => {
    const credits = readFileSync(path.join(process.cwd(), "public/images/jewellery/CREDITS.md"), "utf8");
    for (const id of REAL_PHOTO_IDS) {
      const item = JEWELLERY_ITEMS.find((i) => i.id === id);
      expect(item, `catalog item ${id}`).toBeDefined();
      expect(existsSync(path.join(process.cwd(), "public", item!.imagePath)), `file for ${id}`).toBe(true);
      const row = credits.split("\n").find((line) => line.startsWith(`| ${id} |`));
      expect(row, `credits row ${id}`).toMatch(/Pexels photo/);
    }
  });
});
