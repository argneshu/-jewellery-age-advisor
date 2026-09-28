import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecommendationForm } from "@/components/recommendations/RecommendationForm";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-[560px] rounded-aura-xl border-border-soft bg-ivory p-9 shadow-soft">
        <CardHeader>
          <CardTitle className="font-serif text-2xl text-ink">
            Tell us who it&apos;s for
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RecommendationForm />
        </CardContent>
      </Card>
    </main>
  );
}
