// Epic 10, Story 10.9 (Helix 3.3, D6). Pure routing rules for the proxy (lib/supabase/middleware.ts),
// kept free of Next/Supabase imports so they are unit-testable. The original Epic 5 paths are unchanged.

export const PROTECTED_PATHS = ["/favorites", "/api/favorites", "/checkout", "/order-confirmation"] as const;

export const AUTH_ONLY_WHEN_LOGGED_OUT_PATHS = ["/login", "/register"] as const;

/** A path is protected when it equals a protected path or sits beneath it (`/checkout-foo` does not). */
export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function isAuthOnlyWhenLoggedOutPath(pathname: string): boolean {
  return (AUTH_ONLY_WHEN_LOGGED_OUT_PATHS as readonly string[]).includes(pathname);
}
