import { ResultsGrid } from "@/components/recommendations/ResultsGrid";
import type { Occasion, RecommendationPrefs, Relationship, JewelleryStyle } from "@/types/jewellery";

function parsePrefs(
  searchParams: Record<string, string | string[] | undefined>
): RecommendationPrefs {
  const get = (key: string, fallback: string) => {
    const v = searchParams[key];
    return typeof v === "string" ? v : fallback;
  };

  return {
    age: Number(get("age", "28")),
    relationship: get("relationship", "wife") as Relationship,
    occasion: get("occasion", "anniversary") as Occasion,
    budget: Number(get("budget", "40000")),
    style: get("style", "") as JewelleryStyle | "",
  };
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const prefs = parsePrefs(params);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16">
      <ResultsGrid prefs={prefs} />
    </main>
  );
}
