-- Rollback for 0007_admin_and_product_images.sql.
-- WARNING: removes admin access and the image_url values. Uploaded files in the bucket are NOT deleted
-- (empty and delete the 'product-images' bucket in the Supabase dashboard if you want them gone).
drop policy if exists "Admins can delete product images"  on storage.objects;
drop policy if exists "Admins can replace product images" on storage.objects;
drop policy if exists "Admins can upload product images"  on storage.objects;
drop policy if exists "Admins can update product details" on public.product_details;
drop policy if exists "Admins can insert product details" on public.product_details;
revoke insert, update on public.product_details from authenticated;
alter table public.product_details drop constraint if exists product_details_image_url_https;
alter table public.product_details drop column if exists image_url;
drop function if exists public.is_admin();
drop table if exists public.admins;
