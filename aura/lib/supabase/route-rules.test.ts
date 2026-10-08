import { describe, expect, it } from "vitest";
import { isAuthOnlyWhenLoggedOutPath, isProtectedPath, PROTECTED_PATHS } from "./route-rules";

describe("isProtectedPath", () => {
  it.each(PROTECTED_PATHS)("protects %s exactly", (path) => {
    expect(isProtectedPath(path)).toBe(true);
  });

  it.each([
    "/favorites/anything",
    "/api/favorites/1",
    "/checkout/address",
    "/order-confirmation/abc-123",
  ])("protects sub-path %s", (path) => {
    expect(isProtectedPath(path)).toBe(true);
  });

  it.each(["/", "/results", "/cart", "/product/1", "/login", "/register", "/auth/callback"])(
    "leaves %s public",
    (path) => {
      expect(isProtectedPath(path)).toBe(false);
    }
  );

  it.each(["/checkout-foo", "/favoritesX", "/checkoutx/address", "/order-confirmations", "/api/favoritesX"])(
    "does not protect look-alike prefix %s",
    (path) => {
      expect(isProtectedPath(path)).toBe(false);
    }
  );

  it("keeps the Epic 5 paths protected", () => {
    expect(PROTECTED_PATHS).toEqual(expect.arrayContaining(["/favorites", "/api/favorites"]));
  });
});

describe("isAuthOnlyWhenLoggedOutPath", () => {
  it("matches /login and /register exactly", () => {
    expect(isAuthOnlyWhenLoggedOutPath("/login")).toBe(true);
    expect(isAuthOnlyWhenLoggedOutPath("/register")).toBe(true);
  });

  it("does not match other paths or sub-paths", () => {
    expect(isAuthOnlyWhenLoggedOutPath("/")).toBe(false);
    expect(isAuthOnlyWhenLoggedOutPath("/login/x")).toBe(false);
    expect(isAuthOnlyWhenLoggedOutPath("/checkout")).toBe(false);
  });
});
