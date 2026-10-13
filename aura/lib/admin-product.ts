// Pure validation for the admin product editor (app/admin). Kept free of Next/Supabase imports so it
// is unit-testable; the server action runs the same checks the database constraints back up.

export const DETAILS_LIMITS = {
  description: 2000,
  highlights: 8,
  highlight: 200,
  shortField: 100,
  careInstructions: 1000,
  maxWeightGrams: 99999.99,
} as const;

export const IMAGE_LIMITS = {
  maxBytes: 2 * 1024 * 1024, // matches the bucket's file_size_limit (migration 0007)
  types: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" },
} as const;

export type DetailsField =
  | "description"
  | "highlights"
  | "material"
  | "purity"
  | "weightGrams"
  | "stone"
  | "dimensions"
  | "careInstructions";

export type DetailsFieldErrors = Partial<Record<DetailsField, string>>;

/** Columns written to public.product_details by the editor (image_url is managed separately). */
export interface ProductDetailsInput {
  description: string;
  highlights: string[];
  material: string | null;
  purity: string | null;
  weight_grams: number | null;
  stone: string | null;
  dimensions: string | null;
  care_instructions: string | null;
}

export type DetailsValidation =
  | { ok: true; value: ProductDetailsInput }
  | { ok: false; fieldErrors: DetailsFieldErrors };

const SHORT_FIELDS = ["material", "purity", "stone", "dimensions"] as const;

export function validateDetailsInput(input: Record<string, string>): DetailsValidation {
  const errors: DetailsFieldErrors = {};
  const get = (k: string) => (input[k] ?? "").trim();

  const description = get("description");
  if (!description) errors.description = "Description is required.";
  else if (description.length > DETAILS_LIMITS.description)
    errors.description = `Keep the description under ${DETAILS_LIMITS.description} characters.`;

  const highlights = (input.highlights ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (highlights.length > DETAILS_LIMITS.highlights)
    errors.highlights = `At most ${DETAILS_LIMITS.highlights} highlights (one per line).`;
  else if (highlights.some((h) => h.length > DETAILS_LIMITS.highlight))
    errors.highlights = `Each highlight must be under ${DETAILS_LIMITS.highlight} characters.`;

  const short: Record<(typeof SHORT_FIELDS)[number], string | null> = {
    material: null,
    purity: null,
    stone: null,
    dimensions: null,
  };
  for (const f of SHORT_FIELDS) {
    const v = get(f);
    if (v.length > DETAILS_LIMITS.shortField)
      errors[f] = `Keep this under ${DETAILS_LIMITS.shortField} characters.`;
    short[f] = v || null;
  }

  let weight: number | null = null;
  const rawWeight = get("weightGrams");
  if (rawWeight) {
    const n = Number(rawWeight);
    if (!Number.isFinite(n) || n <= 0 || n > DETAILS_LIMITS.maxWeightGrams)
      errors.weightGrams = "Enter a weight in grams greater than 0.";
    else weight = Math.round(n * 100) / 100;
  }

  const care = get("careInstructions");
  if (care.length > DETAILS_LIMITS.careInstructions)
    errors.careInstructions = `Keep this under ${DETAILS_LIMITS.careInstructions} characters.`;

  if (Object.keys(errors).length > 0) return { ok: false, fieldErrors: errors };

  return {
    ok: true,
    value: {
      description,
      highlights,
      ...short,
      weight_grams: weight,
      care_instructions: care || null,
    },
  };
}

export type ImageValidation =
  | { ok: true; extension: string }
  | { ok: false; error: string };

export function validateImageFile(file: { type: string; size: number }): ImageValidation {
  const extension = (IMAGE_LIMITS.types as Record<string, string>)[file.type];
  if (!extension) return { ok: false, error: "Upload a JPG, PNG or WebP image." };
  if (file.size <= 0) return { ok: false, error: "That file is empty." };
  if (file.size > IMAGE_LIMITS.maxBytes) return { ok: false, error: "Images must be 2 MB or smaller." };
  return { ok: true, extension };
}

/** Storage path for an uploaded photo. A fresh name per upload so CDN/browser caches never serve a stale image. */
export function imageObjectPath(productId: number, extension: string, now: Date): string {
  return `${productId}/${now.getTime()}.${extension}`;
}

/** Inverse of the public URL: the object path inside the bucket, or null if the URL is not ours. */
export function objectPathFromPublicUrl(url: string, bucket = "product-images"): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length));
}
