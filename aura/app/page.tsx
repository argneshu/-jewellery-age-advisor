import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecommendationForm } from "@/components/recommendations/RecommendationForm";

// Decorative photos flank the form on extra-large screens only (hidden below xl so the form keeps its
// full width and stays the focus on phones/tablets/laptops). They stretch to the card's height and sit
// the same gap (gap-8) from it on both sides. Reuses existing Pexels product photos; alt="" because they are purely visual.
function SidePhoto({ src }: { src: string }) {
  return (
    <div className="relative hidden w-60 shrink-0 self-stretch overflow-hidden rounded-aura-xl shadow-soft xl:block">
      <Image
        src={src}
        alt=""
        fill
        sizes="240px"
        preload
        className="object-cover"
      />
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="flex w-full items-stretch justify-center gap-8">
        <SidePhoto src="/images/jewellery/earrings-heritage-jhumka-earrings.jpg" />
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
        <SidePhoto src="/images/jewellery/ring-solitaire-anniversary-ring.jpg" />
      </div>
    </main>
  );
}
