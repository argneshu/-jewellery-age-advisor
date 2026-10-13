"use client";

import { useActionState } from "react";
import { ProductImage } from "@/components/ProductImage";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DetailsField } from "@/lib/admin-product";
import type { ProductDetailsRow } from "@/lib/product-details";
import type { JewelleryItem } from "@/types/jewellery";
import { removeImage, saveDetails, uploadImage, type AdminActionState } from "../../actions";

const TEXTAREA =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

function Status({ state }: { state: AdminActionState | null }) {
  if (!state) return null;
  if (state.ok) {
    return (
      <Alert role="status">
        <AlertDescription>{state.message}</AlertDescription>
      </Alert>
    );
  }
  if (state.fieldErrors) return null; // shown inline under each field
  return (
    <Alert variant="destructive">
      <AlertDescription>{state.error}</AlertDescription>
    </Alert>
  );
}

export function ProductEditor({ item, row }: { item: JewelleryItem; row: ProductDetailsRow | null }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
      <DetailsForm
        // Remount with fresh defaults after each save (updated_at changes on every write).
        key={row ? `${row.product_id}-${row.updated_at}` : "new"}
        item={item}
        row={row}
      />
      <PhotoPanel item={item} hasCustomPhoto={Boolean(row?.image_url)} hasDetails={Boolean(row)} />
    </div>
  );
}

function DetailsForm({ item, row }: { item: JewelleryItem; row: ProductDetailsRow | null }) {
  const [state, action, pending] = useActionState<AdminActionState | null, FormData>(saveDetails, null);
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const kept = state && !state.ok ? state.values : undefined;

  const initial: Record<DetailsField, string> = {
    description: row?.description ?? "",
    highlights: (row?.highlights ?? []).join("\n"),
    material: row?.material ?? "",
    purity: row?.purity ?? "",
    weightGrams: row?.weight_grams != null ? String(Number(row.weight_grams)) : "",
    stone: row?.stone ?? "",
    dimensions: row?.dimensions ?? "",
    careInstructions: row?.care_instructions ?? "",
  };
  const value = (f: DetailsField) => kept?.[f] ?? initial[f];

  function err(f: DetailsField) {
    return errors[f] ? (
      <p id={`${f}-error`} className="text-xs text-destructive">
        {errors[f]}
      </p>
    ) : null;
  }
  const a11y = (f: DetailsField) =>
    errors[f] ? { "aria-invalid": true as const, "aria-describedby": `${f}-error` } : {};

  return (
    <form action={action} noValidate className="space-y-5">
      <input type="hidden" name="productId" value={item.id} />
      <Status state={state} />

      <fieldset disabled={pending} className="space-y-5">
        <div className="space-y-1">
          <Label htmlFor="description">Description *</Label>
          <textarea id="description" name="description" rows={4} defaultValue={value("description")} className={TEXTAREA} {...a11y("description")} />
          {err("description")}
        </div>

        <div className="space-y-1">
          <Label htmlFor="highlights">About this item (one bullet per line, up to 8)</Label>
          <textarea id="highlights" name="highlights" rows={5} defaultValue={value("highlights")} className={TEXTAREA} {...a11y("highlights")} />
          {err("highlights")}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["material", "Material"],
              ["purity", "Purity"],
              ["weightGrams", "Weight (grams)"],
              ["stone", "Stone"],
              ["dimensions", "Dimensions"],
            ] as [DetailsField, string][]
          ).map(([f, label]) => (
            <div key={f} className="space-y-1">
              <Label htmlFor={f}>{label}</Label>
              <Input
                id={f}
                name={f}
                defaultValue={value(f)}
                inputMode={f === "weightGrams" ? "decimal" : undefined}
                {...a11y(f)}
              />
              {err(f)}
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <Label htmlFor="careInstructions">Care instructions</Label>
          <textarea id="careInstructions" name="careInstructions" rows={3} defaultValue={value("careInstructions")} className={TEXTAREA} {...a11y("careInstructions")} />
          {err("careInstructions")}
        </div>
      </fieldset>

      <Button type="submit" variant="gradient" className="min-h-11 w-full sm:w-auto" disabled={pending}>
        {pending ? "Saving…" : "Save details"}
      </Button>
    </form>
  );
}

function PhotoPanel({
  item,
  hasCustomPhoto,
  hasDetails,
}: {
  item: JewelleryItem;
  hasCustomPhoto: boolean;
  hasDetails: boolean;
}) {
  const [uploadState, uploadAction, uploading] = useActionState<AdminActionState | null, FormData>(uploadImage, null);
  const [removeState, removeAction, removing] = useActionState<AdminActionState | null, FormData>(removeImage, null);

  return (
    <aside className="space-y-4">
      <h3 className="font-serif text-xl text-ink">Photo</h3>
      <ProductImage item={item} sizes="320px" className="aspect-square w-full rounded-aura-xl" />
      <p className="text-xs text-ink-soft">
        {hasCustomPhoto ? "Showing your uploaded photo." : "Showing the original photo."}
      </p>

      <form action={uploadAction} className="space-y-3">
        <input type="hidden" name="productId" value={item.id} />
        <Status state={uploadState} />
        <Label htmlFor="image">Upload a new photo (JPG, PNG or WebP, up to 2 MB)</Label>
        <Input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading || !hasDetails} />
        {!hasDetails && <p className="text-xs text-ink-soft">Save the details first, then add a photo.</p>}
        <Button type="submit" variant="outline" className="min-h-11 w-full" disabled={uploading || !hasDetails}>
          {uploading ? "Uploading…" : "Upload photo"}
        </Button>
      </form>

      {hasCustomPhoto && (
        <form action={removeAction} className="space-y-3">
          <input type="hidden" name="productId" value={item.id} />
          <Status state={removeState} />
          <Button type="submit" variant="ghost" className="min-h-11 w-full" disabled={removing}>
            {removing ? "Removing…" : "Remove custom photo"}
          </Button>
        </form>
      )}
    </aside>
  );
}
