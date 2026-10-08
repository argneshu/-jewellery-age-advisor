import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { JEWELLERY_ITEMS } from "@/data/jewellery";
import { hasRealPhoto, REAL_PHOTO_IDS } from "@/lib/product-images";

describe("hasRealPhoto", () => {
  it("is true for items with a curated photo and false for the rest", () => {
    expect(hasRealPhoto(16)).toBe(true);
    expect(hasRealPhoto(1)).toBe(false);
    expect(hasRealPhoto(37)).toBe(false);
    expect(hasRealPhoto(999)).toBe(false);
  });

  it("lists exactly the 25 curated items", () => {
    expect([...REAL_PHOTO_IDS].sort((a, b) => a - b)).toEqual([
      3, 7, 8, 9, 11, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22, 24, 25, 26, 27, 28, 29, 30, 33, 39, 40,
    ]);
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
