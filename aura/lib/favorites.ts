import type { FavoriteRecord } from "@/types/auth";

async function parseOrThrow(response: Response) {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(body.error ?? "Request failed");
  }
  return response.json();
}

export async function listFavorites(): Promise<FavoriteRecord[]> {
  const response = await fetch("/api/favorites");
  return parseOrThrow(response);
}

export async function addFavorite(jewelleryItemId: number): Promise<FavoriteRecord> {
  const response = await fetch("/api/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jewelleryItemId }),
  });
  return parseOrThrow(response);
}

export async function removeFavorite(jewelleryItemId: number): Promise<void> {
  const response = await fetch("/api/favorites", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jewelleryItemId }),
  });
  await parseOrThrow(response);
}
