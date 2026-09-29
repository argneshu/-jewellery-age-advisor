import { createClient } from "@/lib/supabase/server";
import type { FavoriteRecord } from "@/types/auth";

interface FavoriteRow {
  id: string;
  user_id: string;
  jewellery_item_id: number;
  created_at: string;
}

function mapRow(row: FavoriteRow): FavoriteRecord {
  return {
    id: row.id,
    userId: row.user_id,
    jewelleryItemId: row.jewellery_item_id,
    createdAt: row.created_at,
  };
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json((data as FavoriteRow[]).map(mapRow));
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.jewelleryItemId !== "number") {
    return Response.json({ error: "Invalid jewelleryItemId" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("favorites")
    .insert({ user_id: user.id, jewellery_item_id: body.jewelleryItemId })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return Response.json({ error: "Already favorited" }, { status: 409 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(mapRow(data as FavoriteRow), { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.jewelleryItemId !== "number") {
    return Response.json({ error: "Invalid jewelleryItemId" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("jewellery_item_id", body.jewelleryItemId)
    .select();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return Response.json({ error: "Favorite not found" }, { status: 404 });
  }

  return Response.json({ removed: true });
}
