-- Rollback for 0002_user_addresses.sql. Drops ONLY objects created by 0002 (policies go with the table).
-- WARNING: deletes all saved addresses. Run 0004/0003 rollbacks first (orders snapshot addresses as JSON, no FK, so order is not required, but keep this order).
drop table if exists public.user_addresses;
