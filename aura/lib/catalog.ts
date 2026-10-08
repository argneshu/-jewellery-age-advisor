import { JEWELLERY_ITEMS } from "@/data/jewellery";
import type { JewelleryItem } from "@/types/jewellery";

// Epic 10, Story 10.5. Single lookup over the static catalog, shared by the cart (lib/cart.ts)
// and the product page so there is one source of truth for "what items exist".

const CATALOG_BY_ID: ReadonlyMap<number, JewelleryItem> = new Map(
  JEWELLERY_ITEMS.map((item) => [item.id, item])
);

export function getCatalogItem(id: number): JewelleryItem | undefined {
  return CATALOG_BY_ID.get(id);
}

/**
 * Resolves a URL segment such as "7" to a catalog item. Only plain positive integers without
 * sign, leading zeros, decimals, exponents or whitespace are accepted, so "/product/01",
 * "/product/1.0" and "/product/1e1" are 404s rather than aliases of an existing page.
 */
export function findItemByRouteId(raw: string): JewelleryItem | undefined {
  if (!/^[1-9][0-9]{0,8}$/.test(raw)) return undefined;
  return getCatalogItem(Number(raw));
}
