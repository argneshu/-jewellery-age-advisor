import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-8">
      <Card className="max-w-[560px] rounded-aura-xl border-border-soft bg-ivory p-9 shadow-soft">
        <CardHeader>
          <CardTitle className="font-serif text-3xl text-ink">
            Aura design system check
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-ink-soft">
            Cream background, ivory card, gold/rose-gold gradient button,
            Playfair Display heading, Poppins body — Epic 3 tokens.
          </p>
          <Button variant="gradient" size="lg">
            Curate My Picks
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
