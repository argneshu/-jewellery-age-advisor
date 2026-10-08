/**
 * URL a guest is sent to when they try to favorite; they return to the same page + query after
 * login. Same format the Epic 7 card used (Story 7.2) — extracted for reuse by useFavorite
 * (Epic 10, Story 10.4) and so it can be unit-tested without React.
 */
export function buildLoginRedirect(pathname: string, query: string): string {
  const redirectedFrom = query ? `${pathname}?${query}` : pathname;
  return `/login?redirectedFrom=${encodeURIComponent(redirectedFrom)}`;
}
