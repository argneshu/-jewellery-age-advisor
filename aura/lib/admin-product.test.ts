import { describe, expect, it } from "vitest";
import {
  imageObjectPath,
  objectPathFromPublicUrl,
  validateDetailsInput,
  validateImageFile,
} from "./admin-product";

const valid = {
  description: "  Nice studs.  ",
  highlights: "One\n\n  Two  \r\nThree",
  material: " 22K Gold ",
  purity: "",
  weightGrams: "2.256",
  stone: "",
  dimensions: "5 mm",
  careInstructions: "",
};

describe("validateDetailsInput", () => {
  it("trims, splits highlights by line, nulls empty fields and rounds weight to 2 dp", () => {
    const r = validateDetailsInput(valid);
    expect(r).toEqual({
      ok: true,
      value: {
        description: "Nice studs.",
        highlights: ["One", "Two", "Three"],
        material: "22K Gold",
        purity: null,
        weight_grams: 2.26,
        stone: null,
        dimensions: "5 mm",
        care_instructions: null,
      },
    });
  });

  it("requires a description", () => {
    const r = validateDetailsInput({ ...valid, description: "   " });
    expect(r).toMatchObject({ ok: false, fieldErrors: { description: expect.any(String) } });
  });

  it.each(["0", "-1", "abc", "100000"])("rejects weight %s", (w) => {
    const r = validateDetailsInput({ ...valid, weightGrams: w });
    expect(r).toMatchObject({ ok: false, fieldErrors: { weightGrams: expect.any(String) } });
  });

  it("allows an empty weight", () => {
    expect(validateDetailsInput({ ...valid, weightGrams: "" })).toMatchObject({
      ok: true,
      value: { weight_grams: null },
    });
  });

  it("limits the number and length of highlights", () => {
    const many = Array.from({ length: 9 }, (_, i) => `h${i}`).join("\n");
    expect(validateDetailsInput({ ...valid, highlights: many })).toMatchObject({
      ok: false,
      fieldErrors: { highlights: expect.any(String) },
    });
    expect(validateDetailsInput({ ...valid, highlights: "x".repeat(201) })).toMatchObject({
      ok: false,
      fieldErrors: { highlights: expect.any(String) },
    });
  });

  it("limits the length of short fields, description and care text", () => {
    const r = validateDetailsInput({
      ...valid,
      material: "x".repeat(101),
      description: "x".repeat(2001),
      careInstructions: "x".repeat(1001),
    });
    expect(r).toMatchObject({
      ok: false,
      fieldErrors: {
        material: expect.any(String),
        description: expect.any(String),
        careInstructions: expect.any(String),
      },
    });
  });

  it("treats missing keys as empty", () => {
    expect(validateDetailsInput({ description: "ok" })).toMatchObject({
      ok: true,
      value: { highlights: [], material: null, weight_grams: null },
    });
  });
});

describe("validateImageFile", () => {
  it.each([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
  ])("accepts %s", (type, extension) => {
    expect(validateImageFile({ type, size: 1000 })).toEqual({ ok: true, extension });
  });

  it("rejects other types, empty files and files over 2 MB", () => {
    expect(validateImageFile({ type: "image/svg+xml", size: 10 }).ok).toBe(false);
    expect(validateImageFile({ type: "application/pdf", size: 10 }).ok).toBe(false);
    expect(validateImageFile({ type: "image/png", size: 0 }).ok).toBe(false);
    expect(validateImageFile({ type: "image/png", size: 2 * 1024 * 1024 + 1 }).ok).toBe(false);
    expect(validateImageFile({ type: "image/png", size: 2 * 1024 * 1024 }).ok).toBe(true);
  });
});

describe("image paths", () => {
  it("builds a unique object path per upload", () => {
    expect(imageObjectPath(7, "jpg", new Date(1700000000000))).toBe("7/1700000000000.jpg");
  });

  it("recovers the object path from a public URL, and rejects foreign URLs", () => {
    const url = "https://abc.supabase.co/storage/v1/object/public/product-images/7/170.jpg";
    expect(objectPathFromPublicUrl(url)).toBe("7/170.jpg");
    expect(objectPathFromPublicUrl("https://example.com/7/170.jpg")).toBeNull();
  });
});
