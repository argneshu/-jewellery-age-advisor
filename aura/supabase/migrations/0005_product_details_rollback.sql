-- Rollback for 0005_product_details.sql (and the 0006 seed rows, which live in the same table).
-- WARNING: deletes all product details.
drop table if exists public.product_details;
