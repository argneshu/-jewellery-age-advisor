import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Admin — Aura",
  robots: { index: false, follow: false },
};

// Everything under /admin requires a signed-in admin (see lib/supabase/admin.ts).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16">
      <nav className="mb-6 flex items-center gap-4 border-b border-border-soft pb-3 text-sm">
        <Link href="/admin" className="font-semibold text-ink">
          Product admin
        </Link>
        <Link href="/" className="text-ink-soft hover:text-ink">
          ← Back to site
        </Link>
      </nav>
      {children}
    </div>
  );
}
