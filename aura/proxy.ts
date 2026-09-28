import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Named `proxy.ts`, not `middleware.ts` as the Migration Document specifies:
// Next.js 16 (installed in this project) renamed the middleware file convention to `proxy`.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
