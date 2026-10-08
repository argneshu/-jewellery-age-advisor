-- Rollback for 0004_place_order_fn.sql. Drops ONLY the function created by 0004. Orders already created are untouched.
drop function if exists public.place_order(text, text, jsonb);
notify pgrst, 'reload schema';
