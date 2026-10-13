-- Admin dashboard support (enhancement): who may edit catalogue content, an image column, and the
-- Storage bucket for product photos. Run after 0005/0006. Non-production first.
-- Rollback: 0007_admin_and_product_images_rollback.sql
-- Mostly additive: adds a column, a table, a function, policies and a bucket. The only change to existing
-- access is that admins (and only admins) may now insert/update product_details.

-- 1. Admins. One row per admin user; managed by hand (SQL editor / service role), never by the API.
create table public.admins (
  user_id    uuid        primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;
create policy "Admins can see their own admin row"
  on public.admins for select
  using (auth.uid() = user_id);

-- security definer so policies on other tables can check admin status without granting read on admins.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- 2. Image override per product (null = keep the static photo shipped with the app).
alter table public.product_details
  add column image_url text,
  add constraint product_details_image_url_https check (image_url is null or image_url ~ '^https://');

-- 3. Only admins may write product_details (everyone can still read, see 0005).
grant insert, update on public.product_details to authenticated;
create policy "Admins can insert product details"
  on public.product_details for insert
  with check (public.is_admin());
create policy "Admins can update product details"
  on public.product_details for update
  using (public.is_admin())
  with check (public.is_admin());

-- 4. Storage bucket for product photos: public read, admin-only write, 2 MB, images only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Admins can upload product images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());
create policy "Admins can replace product images"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
create policy "Admins can delete product images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

-- To make yourself an admin (run once, in the SQL editor, replacing the email):
--   insert into public.admins (user_id) select id from auth.users where email = 'you@example.com';
