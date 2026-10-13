// Product details (description, highlights, spec table) shown on the product page. Stored in the
// Supabase `product_details` table (migration 0005); this module only maps a row to display data.

export interface ProductDetailsRow {
  product_id: number;
  description: string;
  highlights: string[];
  material: string | null;
  purity: string | null;
  weight_grams: number | null;
  stone: string | null;
  dimensions: string | null;
  care_instructions: string | null;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductDetails {
  description: string;
  highlights: string[];
  specs: ProductSpec[];
  careInstructions: string | null;
}

export function toProductDetails(
  row: ProductDetailsRow | null | undefined
): ProductDetails | null {
  if (!row) return null;

  // Postgres `numeric` can arrive as a string through PostgREST.
  const weight = row.weight_grams === null ? NaN : Number(row.weight_grams);
  const candidates: [string, string | null][] = [
    ["Material", row.material],
    ["Purity", row.purity],
    ["Weight", Number.isFinite(weight) ? `${weight} g` : null],
    ["Stone", row.stone],
    ["Dimensions", row.dimensions],
  ];

  return {
    description: row.description,
    highlights: row.highlights ?? [],
    specs: candidates
      .filter((c): c is [string, string] => Boolean(c[1]))
      .map(([label, value]) => ({ label, value })),
    careInstructions: row.care_instructions,
  };
}
