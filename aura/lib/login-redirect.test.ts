import { describe, expect, it } from "vitest";
import { buildLoginRedirect } from "@/lib/login-redirect";

describe("buildLoginRedirect", () => {
  it("returns /login with only the path when there is no query string", () => {
    expect(buildLoginRedirect("/results", "")).toBe("/login?redirectedFrom=%2Fresults");
  });

  it("keeps the query string, URI-encoded, so the user returns to the same results", () => {
    expect(buildLoginRedirect("/results", "age=34&relationship=wife")).toBe(
      "/login?redirectedFrom=" + encodeURIComponent("/results?age=34&relationship=wife")
    );
  });

  it("encodes reserved characters in the path and query", () => {
    const url = buildLoginRedirect("/product/7", "a=b&c=d e");
    expect(url.startsWith("/login?redirectedFrom=")).toBe(true);
    expect(url).not.toContain("&c=");
    expect(decodeURIComponent(url.slice("/login?redirectedFrom=".length))).toBe("/product/7?a=b&c=d e");
  });

  it("matches the exact format the Epic 7 card used (regression)", () => {
    // Epic 7 / Story 7.2: router.push(`/login?redirectedFrom=${encodeURIComponent(redirectedFrom)}`)
    const pathname = "/favorites";
    const query = "x=1";
    const legacy = `/login?redirectedFrom=${encodeURIComponent(`${pathname}?${query}`)}`;
    expect(buildLoginRedirect(pathname, query)).toBe(legacy);
  });
});
