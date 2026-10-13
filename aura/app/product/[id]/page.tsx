import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JEWELLERY_ITEMS } from "@/data/jewellery";
import { findItemByRouteId } from "@/lib/catalog";
import { fetchProductDetails } from "@/lib/supabase/public";
import { ProductInfo } from "@/components/ProductInfo";
import { ProductDetail } from "./ProductDetail";

// Epic 10, Story 10.5 (Helix 1.2). Only the 40 catalog ids exist; anything else is a 404.
// Deviation: Helix says "all 37 product pages" — the catalog has 40 items. generateStaticParams
// pins the valid routes (dynamicParams = false): `next build` pre-generates 40 extra pages
// (static page count 10 -> 50) and every other id is a 404.
export const dynamicParams = false;
// Details live in Supabase; re-fetch at most hourly so edits show up without a redeploy.
export const revalidate = 3600;

export function generateStaticParams() {
  return JEWELLERY_ITEMS.map((item) => ({ id: String(item.id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = findItemByRouteId(id);
  return { title: item ? `${item.name} — Aura` : "Aura" };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = findItemByRouteId(id);
  if (!item) notFound();
  const details = await fetchProductDetails(item.id);
  return <ProductDetail item={item} info={<ProductInfo details={details} />} />;
}
