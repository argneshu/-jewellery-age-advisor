import { describe, expect, it, vi, beforeEach } from "vitest";
import { addFavorite, removeFavorite, listFavorites } from "@/lib/favorites";

describe("lib/favorites", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("listFavorites returns the parsed favorites array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { id: "1", userId: "u1", jewelleryItemId: 17, createdAt: "2026-01-01" },
        ],
      })
    );

    const result = await listFavorites();

    expect(result).toHaveLength(1);
    expect(result[0].jewelleryItemId).toBe(17);
  });

  it("listFavorites throws with the API's error message on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Unauthorized" }),
      })
    );

    await expect(listFavorites()).rejects.toThrow("Unauthorized");
  });

  it("addFavorite posts jewelleryItemId and returns the created record", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "1", userId: "u1", jewelleryItemId: 17, createdAt: "2026-01-01" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await addFavorite(17);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/favorites",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ jewelleryItemId: 17 }),
      })
    );
    expect(result.jewelleryItemId).toBe(17);
  });

  it("addFavorite throws with the API's error message on a 409", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Already favorited" }),
      })
    );

    await expect(addFavorite(17)).rejects.toThrow("Already favorited");
  });

  it("removeFavorite calls DELETE with jewelleryItemId", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ removed: true }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await removeFavorite(17);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/favorites",
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ jewelleryItemId: 17 }),
      })
    );
  });

  it("removeFavorite throws with the API's error message on a 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Favorite not found" }),
      })
    );

    await expect(removeFavorite(17)).rejects.toThrow("Favorite not found");
  });

  it("throws a generic error when the error response body cannot be parsed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => {
          throw new Error("not json");
        },
      })
    );

    await expect(listFavorites()).rejects.toThrow("Request failed");
  });
});
