import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Placeholder — route protection is implemented in Epic 5 (Build Auth Pages & Middleware).
// Named `proxy.ts`, not `middleware.ts` as the Migration Document specifies:
// Next.js 16 (installed in this project) renamed the middleware file convention to `proxy`.
export function proxy(request: NextRequest) {
  return NextResponse.next();
}
