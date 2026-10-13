import { describe, expect, it } from "vitest";
import { toProductDetails, type ProductDetailsRow } from "./product-details";

const row: ProductDetailsRow = {
  product_id: 1,
  description: "A pair of studs.",
  highlights: ["Hypoallergenic", "Screw-back"],
  material: "22K Gold",
  purity: "916",
  weight_grams: 2.5,
  stone: null,
  dimensions: "6 mm",
  care_instructions: "Wipe with a soft cloth.",
};

describe("toProductDetails", () => {
  it("returns null when there is no row", () => {
    expect(toProductDetails(null)).toBeNull();
    expect(toProductDetails(undefined)).toBeNull();
  });

  it("maps description, highlights and care instructions", () => {
    const d = toProductDetails(row)!;
    expect(d.description).toBe("A pair of studs.");
    expect(d.highlights).toEqual(["Hypoallergenic", "Screw-back"]);
    expect(d.careInstructions).toBe("Wipe with a soft cloth.");
  });

  it("builds labelled specs, skipping empty values and formatting weight", () => {
    const d = toProductDetails(row)!;
    expect(d.specs).toEqual([
      { label: "Material", value: "22K Gold" },
      { label: "Purity", value: "916" },
      { label: "Weight", value: "2.5 g" },
      { label: "Dimensions", value: "6 mm" },
    ]);
  });

  it("treats a numeric-string weight from Postgres numeric as a number", () => {
    const d = toProductDetails({ ...row, weight_grams: "12.50" as unknown as number })!;
    expect(d.specs).toContainEqual({ label: "Weight", value: "12.5 g" });
  });

  it("tolerates a null highlights column", () => {
    const d = toProductDetails({ ...row, highlights: null as unknown as string[] })!;
    expect(d.highlights).toEqual([]);
  });
});
