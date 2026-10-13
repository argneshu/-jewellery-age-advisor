"use server";

import { revalidatePath } from "next/cache";
import { findItemByRouteId } from "@/lib/catalog";
import { formDataToObject, type ActionResult } from "@/lib/checkout";
import {
  imageObjectPath,
  objectPathFromPublicUrl,
  validateDetailsInput,
  validateImageFile,
} from "@/lib/admin-product";
import { requireAdmin } from "@/lib/supabase/admin";

// Admin product editor actions. Each one re-checks admin status (requireAdmin) and then writes with the
// signed-in user's own client, so RLS (migration 0007) is the final gate. Expected failures are returned,
// never thrown, and never carry raw database text.

export type AdminActionState = ActionResult<{ message: string }> & {
  values?: Record<string, string>;
};

const BUCKET = "product-images";

function resolveProduct(formData: FormData) {
  return findItemByRouteId(String(formData.get("productId") ?? ""));
}

function refresh(productId: number) {
  revalidatePath("/admin");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/product/${productId}`);
}

export async function saveDetails(
  _prev: AdminActionState | null,
  formData: FormData
): Promise<AdminActionState> {
  const values = formDataToObject(formData);
  const { supabase } = await requireAdmin();

  const item = resolveProduct(formData);
  if (!item) return { ok: false, error: "Unknown product.", values };

  const parsed = validateDetailsInput(values);
  if (!parsed.ok) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.fieldErrors, values };
  }

  // Upsert on the primary key; image_url is deliberately not in the payload so saving text never touches it.
  const { error } = await supabase
    .from("product_details")
    .upsert(
      { product_id: item.id, ...parsed.value, updated_at: new Date().toISOString() },
      { onConflict: "product_id" }
    );
  if (error) {
    console.error("[saveDetails] upsert failed:", error.code);
    return { ok: false, error: "We could not save the details. Please try again.", values };
  }

  refresh(item.id);
  return { ok: true, message: "Details saved." };
}

export async function uploadImage(
  _prev: AdminActionState | null,
  formData: FormData
): Promise<AdminActionState> {
  const { supabase } = await requireAdmin();

  const item = resolveProduct(formData);
  if (!item) return { ok: false, error: "Unknown product." };

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose an image to upload." };
  const check = validateImageFile(file);
  if (!check.ok) return { ok: false, error: check.error };

  // The details row must exist first (description is required), otherwise the photo has nothing to attach to.
  const { data: existing, error: readError } = await supabase
    .from("product_details")
    .select("image_url")
    .eq("product_id", item.id)
    .maybeSingle();
  if (readError) {
    console.error("[uploadImage] read failed:", readError.code);
    return { ok: false, error: "We could not upload the image. Please try again." };
  }
  if (!existing) return { ok: false, error: "Save the product details first, then add a photo." };

  const path = imageObjectPath(item.id, check.extension, new Date());
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) {
    console.error("[uploadImage] upload failed:", uploadError.message);
    return { ok: false, error: "We could not upload the image. Please try again." };
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const { error: updateError } = await supabase
    .from("product_details")
    .update({ image_url: pub.publicUrl, updated_at: new Date().toISOString() })
    .eq("product_id", item.id);
  if (updateError) {
    console.error("[uploadImage] update failed:", updateError.code);
    await supabase.storage.from(BUCKET).remove([path]); // don't leave an orphan
    return { ok: false, error: "We could not save the image. Please try again." };
  }

  // Best-effort cleanup of the photo this one replaces.
  const oldPath = existing.image_url ? objectPathFromPublicUrl(existing.image_url, BUCKET) : null;
  if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);

  refresh(item.id);
  return { ok: true, message: "Photo updated." };
}

export async function removeImage(
  _prev: AdminActionState | null,
  formData: FormData
): Promise<AdminActionState> {
  const { supabase } = await requireAdmin();

  const item = resolveProduct(formData);
  if (!item) return { ok: false, error: "Unknown product." };

  const { data: existing } = await supabase
    .from("product_details")
    .select("image_url")
    .eq("product_id", item.id)
    .maybeSingle();
  if (!existing?.image_url) return { ok: true, message: "Nothing to remove." };

  const { error } = await supabase
    .from("product_details")
    .update({ image_url: null, updated_at: new Date().toISOString() })
    .eq("product_id", item.id);
  if (error) {
    console.error("[removeImage] update failed:", error.code);
    return { ok: false, error: "We could not remove the photo. Please try again." };
  }

  const oldPath = objectPathFromPublicUrl(existing.image_url, BUCKET);
  if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);

  refresh(item.id);
  return { ok: true, message: "Custom photo removed; the original photo is shown again." };
}
