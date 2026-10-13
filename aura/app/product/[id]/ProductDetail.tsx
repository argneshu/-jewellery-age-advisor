"use client";

import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { BackButton } from "@/components/BackButton";
import { ProductImage } from "@/components/ProductImage";
import { Button } from "@/components/ui/button";
import { MAX_QTY } from "@/lib/cart";
import { formatINR } from "@/lib/format";
import { useCart } from "@/context/CartContext";
import { useFavorite } from "@/lib/use-favorite";
import type { JewelleryItem } from "@/types/jewellery";

// Epic 10, Story 10.5 (Helix 1.2). Deviations: favorite heart added (Helix AC, missing from its
// snippet) via the shared useFavorite hook; prices use text-gold-deep (WCAG AA, UI/UX spec);
// back falls back to "/" when there is no in-app history; "Maximum 10 per item" guard (D1).
// The photo is shown only for items with a curated image (lib/product-images.ts); other items keep
// the gradient swatch, same as the results grid.

export function ProductDetail({ item }: { item: JewelleryItem }) {
  const { items, addItem } = useCart();
  const { isFavorited, toggleFavorite } = useFavorite(item.id);
  const [added, setAdded] = useState(false);

  const inCart = items.find((i) => i.id === item.id)?.quantity ?? 0;
  const atMax = inCart >= MAX_QTY;

  function handleAddToCart() {
    addItem({
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      imagePath: item.imagePath,
      imageAlt: item.imageAlt,
    });
    setAdded(true);
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16">
      <BackButton />

      <div className="grid gap-10 md:grid-cols-2">
        <ProductImage
          item={item}
          preload
          sizes="(min-width: 768px) 50vw, 100vw"
          className="aspect-square w-full rounded-aura-xl"
        >
          {/* 44x44px hit area around a 32px visual circle (UI/UX spec) */}
          <button
            type="button"
            onClick={toggleFavorite}
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center"
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ivory/80">
              <Heart
                size={20}
                className={isFavorited ? "fill-rose text-rose" : "text-ink-soft"}
              />
            </span>
          </button>
        </ProductImage>

        <div className="flex flex-col gap-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
            {item.category}
          </p>
          {/* h2, not Helix's h1: AuthHeader already renders the page's h1 ("Aura"), like /results and /favorites. */}
          <h2 className="font-serif text-3xl text-ink">{item.name}</h2>
          <p className="text-2xl font-semibold text-gold-deep">{formatINR(item.price)}</p>

          <ul className="flex flex-wrap gap-2" aria-label="Details">
            <li className="rounded-full border border-border-soft px-3 py-1 text-xs capitalize text-ink-soft">
              {item.style}
            </li>
            <li className="rounded-full border border-border-soft px-3 py-1 text-xs text-ink-soft">
              Ages {item.ageMin}–{item.ageMax}
            </li>
            {item.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-ivory px-3 py-1 text-xs text-ink-soft"
              >
                {tag}
              </li>
            ))}
          </ul>

          {atMax ? (
            <p className="text-sm text-ink-soft">
              Maximum {MAX_QTY} per item — adjust the quantity in{" "}
              <Link href="/cart" className="font-semibold text-gold-deep underline">
                your cart
              </Link>
              .
            </p>
          ) : (
            <Button variant="gradient" className="w-full" onClick={handleAddToCart}>
              <ShoppingBag size={18} className="mr-2" /> Add to Cart
            </Button>
          )}

          {/* Shown whenever the item is in the cart (not just after a click in this mount), so it
              survives navigating to the cart and coming back. Styled like the Add to Cart button
              above so the two line up. */}
          <div role="status" aria-live="polite" className="flex flex-col gap-3">
            {added && <span className="text-sm font-medium text-ink">Added to cart ✓</span>}
            {inCart > 0 && (
              <Button
                variant="outline"
                className="w-full"
                nativeButton={false}
                render={<Link href="/cart" />}
              >
                <ShoppingBag size={18} className="mr-2" /> View Cart
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
