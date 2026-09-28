# Supabase setup — Epic 2

## Story 2.1 — Create the project

1. Create a project at https://supabase.com for Aura.
2. Copy **Project URL** and **anon public key** from Project Settings → API.
3. Copy the **service_role key** only if server-side code ends up needing it
   (favorites API route can use the anon key + user session instead — RLS
   enforces the rest). Never expose the service_role key to the client.
4. Fill in `aura/.env.local` (not committed) using `.env.local.example` as the
   template.

## Story 2.2 — Schema

Run `migrations/0001_favorites.sql` in the Supabase SQL editor (or via the
Supabase CLI: `supabase db push`) against the new project.

Manual verification once two test users exist: sign in as user A, favorite an
item, sign in as user B, confirm B cannot see or delete A's favorite row.

## Story 2.3 — Email confirmation policy

**Decision: Required.** Sign-up requires clicking a confirmation email link
before the user's first session starts (Supabase project default). Set in
Supabase Dashboard → Authentication → Providers → Email → "Confirm email".
This feeds Epic 5's `RegistrationForm` success-state copy ("check your email
to confirm") and `app/auth/callback/route.ts`.

## Story 2.4 — `profiles` table

Not needed for MVP — skipped. `auth.users` (email) is sufficient; no extra
profile fields are required by the current feature set.
