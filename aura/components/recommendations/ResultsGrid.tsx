import Link from "next/link";
import { getRecommendations } from "@/lib/recommendation-engine";
import { formatINR, capitalize, relationshipLabel } from "@/lib/format";
import { JewelleryCard } from "@/components/recommendations/JewelleryCard";
import { RefilterBar } from "@/components/recommendations/RefilterBar";
import type { RecommendationPrefs } from "@/types/jewellery";

export function ResultsGrid({ prefs }: { prefs: RecommendationPrefs }) {
  const results = getRecommendations(prefs);

  return (
    <div>
      <Link
        href="/"
        className="mb-4 inline-block text-sm text-ink-soft hover:text-ink"
      >
        ← Refine details
      </Link>
      <div className="mb-6 text-center">
        <h2 className="font-serif text-3xl text-ink">
          Curated for {relationshipLabel(prefs.relationship)}
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Age {prefs.age} · {capitalize(prefs.occasion)} · Up to{" "}
          {formatINR(prefs.budget)}
        </p>
      </div>

      <RefilterBar budget={prefs.budget} style={prefs.style} />

      {results.length === 0 ? (
        <p className="mx-auto max-w-md text-center text-ink-soft">
          No pieces match this budget yet — try widening the range.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((item) => (
            <JewelleryCard key={item.id} item={item} prefs={prefs} />
          ))}
        </div>
      )}
    </div>
  );
}
