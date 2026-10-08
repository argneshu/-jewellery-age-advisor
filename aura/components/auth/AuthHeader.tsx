import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { CartIconLink } from "@/components/cart/CartIconLink";

export async function AuthHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="px-4 pb-6 pt-10 text-center">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 text-left">
        <div>
          <h1 className="bg-gradient-to-r from-gold-light to-rose bg-clip-text font-serif text-4xl tracking-wide text-transparent">
            Aura
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Jewellery recommended for who they are, not just what&apos;s in
            stock.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <CartIconLink />
          {user ? (
            <>
              {/* Epic 10 (UI/UX spec): hide the email below 640px so the header does not overflow at 375px; Log out stays. */}
              <span className="hidden text-sm text-ink-soft sm:inline">{user.email}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                Sign in
              </Button>
              <Button
                variant="gradient"
                size="sm"
                render={<Link href="/register" />}
              >
                Register
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
