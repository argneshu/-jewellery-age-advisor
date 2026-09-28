"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatINR } from "@/lib/format";
import type { JewelleryStyle } from "@/types/jewellery";

const STYLE_OPTIONS: { value: JewelleryStyle | ""; label: string }[] = [
  { value: "", label: "No preference" },
  { value: "minimal", label: "Minimal" },
  { value: "traditional", label: "Traditional" },
  { value: "statement", label: "Statement" },
  { value: "modern", label: "Modern" },
];

export function RefilterBar({
  budget,
  style,
}: {
  budget: number;
  style: JewelleryStyle | "";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <Card className="mb-8 flex flex-row flex-wrap items-center gap-6 rounded-aura-xl border-border-soft bg-ivory p-5 shadow-soft">
      <div className="min-w-[220px] flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="refilter-budget">Budget</Label>
            <span className="text-sm text-ink-soft">{formatINR(budget)}</span>
          </div>
          <Slider
            id="refilter-budget"
            min={1000}
            max={200000}
            step={500}
            value={[budget]}
            onValueChange={(v) =>
              updateParam("budget", String(Array.isArray(v) ? v[0] : v))
            }
          />
        </div>

        <div className="w-48 space-y-2">
          <Label htmlFor="refilter-style">Style</Label>
          <Select value={style} onValueChange={(v) => updateParam("style", String(v))}>
            <SelectTrigger id="refilter-style" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STYLE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value || "none"} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
    </Card>
  );
}
