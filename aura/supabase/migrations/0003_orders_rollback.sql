-- Rollback for 0003_orders.sql. Drops ONLY objects created by 0003.
-- WARNING: permanently deletes all orders and order items. Run 0004_place_order_fn_rollback.sql first.
-- Never run on production once real orders exist unless a backup/PITR point was taken and the user approved.
drop table if exists public.order_items;
drop table if exists public.orders;
