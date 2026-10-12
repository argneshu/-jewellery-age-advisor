"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatINR } from "@/lib/format";
import type { JewelleryStyle, Occasion, Relationship } from "@/types/jewellery";

const RELATIONSHIP_OPTIONS: { value: Relationship; label: string }[] = [
  { value: "self", label: "MYSELF" },
  { value: "daughter", label: "DAUGHTER" },
  { value: "mother", label: "MOTHER" },
  { value: "wife", label: "WIFE" },
  { value: "friend", label: "FRIEND" },
  { value: "sister", label: "SISTER" },
];

const OCCASION_OPTIONS: { value: Occasion; label: string }[] = [
  { value: "birthday", label: "BIRTHDAY" },
  { value: "wedding", label: "WEDDING" },
  { value: "anniversary", label: "ANNIVERSARY" },
  { value: "festival", label: "FESTIVAL" },
  { value: "everyday", label: "EVERYDAY" },
  { value: "graduation", label: "GRADUATION" },
];

const STYLE_OPTIONS: { value: JewelleryStyle | ""; label: string }[] = [
  { value: "", label: "NO PREFERENCE" },
  { value: "minimal", label: "MINIMAL" },
  { value: "traditional", label: "TRADITIONAL" },
  { value: "statement", label: "STATEMENT" },
  { value: "modern", label: "MODERN" },
];

// The trigger must show the same text as the dropdown item, not the raw value.
function labelFor<T extends string>(
  options: { value: T; label: string }[],
  value: T,
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

export function RecommendationForm() {
  const router = useRouter();
  const [age, setAge] = useState(28);
  const [relationship, setRelationship] = useState<Relationship>("wife");
  const [occasion, setOccasion] = useState<Occasion>("anniversary");
  const [budget, setBudget] = useState(40000);
  const [style, setStyle] = useState<JewelleryStyle | "">("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({
      age: String(age),
      relationship,
      occasion,
      budget: String(budget),
      style,
    });
    router.push(`/results?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="age">Age</Label>
          <span className="text-sm text-ink-soft">{age}</span>
        </div>
        <Slider
          id="age"
          min={1}
          max={80}
          value={[age]}
          onValueChange={(v) => setAge(Array.isArray(v) ? v[0] : v)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="relationship">Relationship</Label>
        <Select
          value={relationship}
          onValueChange={(v) => setRelationship(v as Relationship)}
        >
          <SelectTrigger id="relationship" className="w-full">
            <SelectValue>{(v: Relationship) => labelFor(RELATIONSHIP_OPTIONS, v)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {RELATIONSHIP_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="occasion">Occasion</Label>
        <Select value={occasion} onValueChange={(v) => setOccasion(v as Occasion)}>
          <SelectTrigger id="occasion" className="w-full">
            <SelectValue>{(v: Occasion) => labelFor(OCCASION_OPTIONS, v)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {OCCASION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="budget">Budget</Label>
          <span className="text-sm text-ink-soft">{formatINR(budget)}</span>
        </div>
        <Slider
          id="budget"
          min={1000}
          max={200000}
          step={500}
          value={[budget]}
          onValueChange={(v) => setBudget(Array.isArray(v) ? v[0] : v)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="style">Style (optional)</Label>
        <Select
          value={style}
          onValueChange={(v) => setStyle(v as JewelleryStyle | "")}
        >
          <SelectTrigger id="style" className="w-full">
            <SelectValue>{(v: JewelleryStyle | "") => labelFor(STYLE_OPTIONS, v)}</SelectValue>
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

      <Button type="submit" variant="gradient" size="lg" className="w-full">
        Curate My Picks
      </Button>
    </form>
  );
}
