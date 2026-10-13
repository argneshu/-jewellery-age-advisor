import type { ProductDetails } from "@/lib/product-details";

// Amazon-style information block under the product hero: description, "About this item" bullets,
// the "Product details" spec table and care instructions. Server component; renders nothing when the
// product has no details row.
export function ProductInfo({ details }: { details: ProductDetails | null }) {
  if (!details) return null;

  return (
    <section aria-label="Product information" className="mt-12 space-y-10 border-t border-border-soft pt-10">
      <div>
        <h3 className="mb-3 font-serif text-xl text-ink">Description</h3>
        <p className="max-w-3xl text-sm leading-relaxed text-ink-soft">{details.description}</p>
      </div>

      {details.highlights.length > 0 && (
        <div>
          <h3 className="mb-3 font-serif text-xl text-ink">About this item</h3>
          <ul className="max-w-3xl list-disc space-y-2 pl-5 text-sm text-ink-soft">
            {details.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
      )}

      {details.specs.length > 0 && (
        <div>
          <h3 className="mb-3 font-serif text-xl text-ink">Product details</h3>
          <dl className="max-w-xl divide-y divide-border-soft rounded-aura-xl border border-border-soft bg-ivory text-sm">
            {details.specs.map((s) => (
              <div key={s.label} className="grid grid-cols-[10rem_1fr] gap-4 px-4 py-3">
                <dt className="font-medium text-ink">{s.label}</dt>
                <dd className="text-ink-soft">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {details.careInstructions && (
        <div>
          <h3 className="mb-3 font-serif text-xl text-ink">Care instructions</h3>
          <p className="max-w-3xl text-sm leading-relaxed text-ink-soft">{details.careInstructions}</p>
        </div>
      )}
    </section>
  );
}
