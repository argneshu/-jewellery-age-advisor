-- Epic 10 — database verification script (RLS, CHECKs, place_order, atomicity, privileges).
-- STATUS: written 2026-10-08, NOT YET EXECUTED (no Postgres/Docker daemon available when authored).
-- Run it against a NON-PRODUCTION database only, after applying 0002 -> 0003 -> 0004. Everything runs inside
-- one transaction that is rolled back at the end, so it leaves no data behind.
--
-- Two ways to run:
--  (A) Supabase non-production project / branch: paste into the SQL editor as-is. SKIP the "PLAIN POSTGRES STUBS" block.
--  (B) Plain Postgres 15+ (e.g. `docker run --rm -e POSTGRES_PASSWORD=x -p 5433:5432 postgres:15`): run the stubs block
--      first, then 0002, 0003, 0004, then this script:
--        psql ... -f docs/data/verify/stubs.sql   (the block below)  -f sql/0002_...sql -f sql/0003_...sql -f sql/0004_...sql -f epic10-verification.sql
--
-- Expected output: one "NOTICE: PASS Tn" per test and a final "ALL EPIC 10 DB TESTS PASSED". Any failure raises an exception.

-- ===================== PLAIN POSTGRES STUBS (skip on Supabase) =====================
-- create schema if not exists auth;
-- create table if not exists auth.users (id uuid primary key);
-- create or replace function auth.uid() returns uuid language sql stable as
--   $$ select nullif(coalesce(current_setting('request.jwt.claim.sub', true), (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')), '')::uuid $$;
-- do $$ begin
--   if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
--   if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
-- end $$;
-- grant usage on schema public, auth to anon, authenticated;
-- alter default privileges in schema public grant all on tables to anon, authenticated;
-- alter default privileges in schema public grant all on functions to anon, authenticated;   -- mimic Supabase defaults
-- (run the stubs BEFORE 0002 so the default privileges apply to the new objects)
-- =================== END PLAIN POSTGRES STUBS ======================================

begin;

-- Test users (on Supabase auth.users has more columns; only id is required here. If your project has NOT NULL columns, insert via the Auth admin API instead and substitute the ids.)
insert into auth.users (id) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- NOTE: role switching is done inline in each test (no pg_temp helpers: a restricted role cannot call functions in the superuser's pg_temp schema).
-- 'as user U'  = set_config JWT claims + set local role authenticated ; 'as anon' = set local role anon ; 'as admin' = reset role.

-- T1: user A can insert + read own address
do $$ declare n int; begin
  perform set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',true); perform set_config('request.jwt.claims','{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}',true); execute 'set local role authenticated';
  insert into public.user_addresses (user_id, full_name, phone, address_line1, city, state, pincode)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Asha A', '9876543210', '1 Main St', 'Pune', 'MH', '411001');
  select count(*) into n from public.user_addresses;
  if n <> 1 then raise exception 'T1 FAIL: expected 1 row, got %', n; end if;
  raise notice 'PASS T1 own address insert/select';
end $$;

-- T2: user B cannot see A's address, and cannot insert one for A
do $$ declare n int; begin
  perform set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',true); perform set_config('request.jwt.claims','{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}',true); execute 'set local role authenticated';
  select count(*) into n from public.user_addresses;
  if n <> 0 then raise exception 'T2 FAIL: B sees % address rows', n; end if;
  begin
    insert into public.user_addresses (user_id, full_name, phone, address_line1, city, state, pincode)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Evil', '9876543210', 'x', 'x', 'x', '411001');
    raise exception 'T2 FAIL: B inserted a row for A';
  exception when insufficient_privilege then null; end;
  raise notice 'PASS T2 address isolation (select + insert-as-other)';
end $$;

-- T3: B cannot update A's address (0 rows affected) ; one address per user (unique)
do $$ declare n int; begin
  perform set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',true); perform set_config('request.jwt.claims','{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}',true); execute 'set local role authenticated';
  update public.user_addresses set city = 'Hacked' where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'T3 FAIL: B updated % rows of A', n; end if;
  perform set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',true); perform set_config('request.jwt.claims','{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}',true); execute 'set local role authenticated';
  begin
    insert into public.user_addresses (user_id, full_name, phone, address_line1, city, state, pincode)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Dup', '9876543210', 'x', 'x', 'x', '411001');
    raise exception 'T3 FAIL: second address for same user accepted';
  exception when unique_violation then null; end;
  raise notice 'PASS T3 cross-user update blocked; unique(user_id)';
end $$;

-- T4: address CHECK constraints reject bad phone / pincode / blank name
do $$ begin
  perform set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',true); perform set_config('request.jwt.claims','{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}',true); execute 'set local role authenticated';
  begin insert into public.user_addresses (user_id, full_name, phone, address_line1, city, state, pincode)
        values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'B', '12345', 'x', 'x', 'x', '411001');
        raise exception 'T4 FAIL: short phone accepted'; exception when check_violation then null; end;
  begin insert into public.user_addresses (user_id, full_name, phone, address_line1, city, state, pincode)
        values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'B', '9876543210', 'x', 'x', 'x', '41100'); 
        raise exception 'T4 FAIL: short pincode accepted'; exception when check_violation then null; end;
  begin insert into public.user_addresses (user_id, full_name, phone, address_line1, city, state, pincode)
        values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '   ', '9876543210', 'x', 'x', 'x', '411001');
        raise exception 'T4 FAIL: blank name accepted'; exception when check_violation then null; end;
  raise notice 'PASS T4 address CHECK constraints';
end $$;

-- T5: anon has no access to any new table or to place_order
do $$ declare n int; begin
  perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','',true); execute 'set local role anon';
  begin perform count(*) from public.user_addresses; raise exception 'T5 FAIL: anon read user_addresses'; exception when insufficient_privilege then null; end;
  begin perform count(*) from public.orders;         raise exception 'T5 FAIL: anon read orders';         exception when insufficient_privilege then null; end;
  begin perform count(*) from public.order_items;    raise exception 'T5 FAIL: anon read order_items';    exception when insufficient_privilege then null; end;
  begin perform public.place_order('cod', null, '[]'::jsonb); raise exception 'T5 FAIL: anon executed place_order'; exception when insufficient_privilege then null; end;
  raise notice 'PASS T5 anon denied';
end $$;

-- T6: place_order without an address -> no_address (user B has none yet)
do $$ begin
  perform set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',true); perform set_config('request.jwt.claims','{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}',true); execute 'set local role authenticated';
  begin
    perform public.place_order('cod', null, '[{"jewellery_item_id":1,"name":"Ring","price":1000,"quantity":1}]'::jsonb);
    raise exception 'T6 FAIL: order placed without an address';
  exception when others then
    if sqlerrm <> 'no_address' then raise exception 'T6 FAIL: wrong error: %', sqlerrm; end if;
  end;
  raise notice 'PASS T6 no_address';
end $$;

-- T7: place_order success (COD): one order, matching items, server-computed totals, status confirmed
do $$ declare oid uuid; n int; s int; st text; snap jsonb; begin
  perform set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',true); perform set_config('request.jwt.claims','{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}',true); execute 'set local role authenticated';
  oid := public.place_order('cod', null,
    '[{"jewellery_item_id":1,"name":"Ring","price":1500,"quantity":2},{"jewellery_item_id":7,"name":"Chain","price":2500,"quantity":1}]'::jsonb);
  select count(*) into n from public.order_items where order_id = oid;
  select subtotal, status, address_snapshot into s, st, snap from public.orders where id = oid;
  if n <> 2 then raise exception 'T7 FAIL: % items', n; end if;
  if s <> 5500 then raise exception 'T7 FAIL: subtotal % (expected 5500)', s; end if;
  if st <> 'confirmed' then raise exception 'T7 FAIL: status %', st; end if;
  if snap ->> 'full_name' <> 'Asha A' then raise exception 'T7 FAIL: snapshot %', snap; end if;
  raise notice 'PASS T7 place_order success (COD), total=5500';
end $$;

-- T8: UPI order OK; bad UPI id / upi id on COD / cod without upi rules rejected
do $$ declare oid uuid; begin
  perform set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',true); perform set_config('request.jwt.claims','{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}',true); execute 'set local role authenticated';
  oid := public.place_order('upi', 'asha@okbank', '[{"jewellery_item_id":3,"name":"Studs","price":900,"quantity":1}]'::jsonb);
  begin perform public.place_order('upi', 'not-a-upi', '[{"jewellery_item_id":3,"name":"S","price":900,"quantity":1}]'::jsonb); raise exception 'T8 FAIL: bad upi accepted';
    exception when others then if sqlerrm <> 'invalid_order' then raise exception 'T8 FAIL: %', sqlerrm; end if; end;
  begin perform public.place_order('upi', null, '[{"jewellery_item_id":3,"name":"S","price":900,"quantity":1}]'::jsonb); raise exception 'T8 FAIL: upi without id accepted';
    exception when others then if sqlerrm <> 'invalid_order' then raise exception 'T8 FAIL: %', sqlerrm; end if; end;
  begin perform public.place_order('cod', 'asha@okbank', '[{"jewellery_item_id":3,"name":"S","price":900,"quantity":1}]'::jsonb); raise exception 'T8 FAIL: cod with upi id accepted';
    exception when others then if sqlerrm <> 'invalid_order' then raise exception 'T8 FAIL: %', sqlerrm; end if; end;
  raise notice 'PASS T8 UPI rules';
end $$;

-- T9: invalid carts -> invalid_order (never a cast/other error): empty, non-array, null, qty 0/11/1.5/"2", negative/float/huge price, duplicate ids, 41 lines, missing name, id 0
do $$ declare bad text[]; b text; i int; big jsonb; begin
  perform set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',true); perform set_config('request.jwt.claims','{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}',true); execute 'set local role authenticated';
  bad := array[
    '[]', '{}', 'null', '"x"', '[1]', '[{}]',
    '[{"jewellery_item_id":1,"name":"R","price":100,"quantity":0}]',
    '[{"jewellery_item_id":1,"name":"R","price":100,"quantity":11}]',
    '[{"jewellery_item_id":1,"name":"R","price":100,"quantity":1.5}]',
    '[{"jewellery_item_id":1,"name":"R","price":100,"quantity":"2"}]',
    '[{"jewellery_item_id":1,"name":"R","price":-5,"quantity":1}]',
    '[{"jewellery_item_id":1,"name":"R","price":10.5,"quantity":1}]',
    '[{"jewellery_item_id":1,"name":"R","price":99999999999,"quantity":1}]',
    '[{"jewellery_item_id":0,"name":"R","price":100,"quantity":1}]',
    '[{"jewellery_item_id":1,"name":"  ","price":100,"quantity":1}]',
    '[{"jewellery_item_id":1,"price":100,"quantity":1}]',
    '[{"jewellery_item_id":1,"name":"R","price":100,"quantity":1},{"jewellery_item_id":1,"name":"R","price":100,"quantity":1}]'
  ];
  foreach b in array bad loop
    begin perform public.place_order('cod', null, b::jsonb); raise exception 'T9 FAIL: accepted %', b;
    exception when others then if sqlerrm <> 'invalid_order' then raise exception 'T9 FAIL: input % gave error %', b, sqlerrm; end if; end;
  end loop;
  select jsonb_agg(jsonb_build_object('jewellery_item_id', g, 'name', 'N', 'price', 100, 'quantity', 1)) into big from generate_series(1, 41) g;
  begin perform public.place_order('cod', null, big); raise exception 'T9 FAIL: 41 lines accepted';
  exception when others then if sqlerrm <> 'invalid_order' then raise exception 'T9 FAIL: 41 lines gave %', sqlerrm; end if; end;
  begin perform public.place_order(null, null, '[{"jewellery_item_id":1,"name":"R","price":100,"quantity":1}]'::jsonb); raise exception 'T9 FAIL: null payment accepted';
  exception when others then if sqlerrm <> 'invalid_order' then raise exception 'T9 FAIL: %', sqlerrm; end if; end;
  raise notice 'PASS T9 invalid input -> invalid_order';
end $$;

-- T10: atomicity — a failure after the order insert leaves no order rows. Simulated by making order_items reject a row
--      inside the function's transaction (temporary constraint), then confirming the order insert was rolled back too.
do $$ declare before_n int; after_n int; begin
  execute 'reset role';
  select count(*) into before_n from public.orders;
  alter table public.order_items add constraint t10_force_fail check (name <> 'FORCE_FAIL');
  perform set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',true); perform set_config('request.jwt.claims','{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}',true); execute 'set local role authenticated';
  begin
    perform public.place_order('cod', null, '[{"jewellery_item_id":9,"name":"FORCE_FAIL","price":100,"quantity":1}]'::jsonb);
    raise exception 'T10 FAIL: order accepted despite forced failure';
  exception when check_violation then null; end;   -- the function's own statement rolled back
  execute 'reset role';
  alter table public.order_items drop constraint t10_force_fail;
  select count(*) into after_n from public.orders;
  if after_n <> before_n then raise exception 'T10 FAIL: orders % -> % (partial write)', before_n, after_n; end if;
  raise notice 'PASS T10 atomic rollback';
end $$;

-- T11: client cannot write orders directly with a forged status, and cannot update/delete orders or items
do $$ declare n int; oid uuid; begin
  perform set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',true); perform set_config('request.jwt.claims','{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}',true); execute 'set local role authenticated';
  begin
    insert into public.orders (user_id, address_snapshot, payment_method, subtotal, total, status)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{}'::jsonb, 'cod', 1, 1, 'delivered');
    raise exception 'T11 FAIL: forged status accepted';
  exception when insufficient_privilege then null; end;           -- RLS with-check violation
  select id into oid from public.orders limit 1;
  begin update public.orders set total = 1 where id = oid; raise exception 'T11 FAIL: update orders allowed'; exception when insufficient_privilege then null; end;
  begin delete from public.orders where id = oid;          raise exception 'T11 FAIL: delete orders allowed'; exception when insufficient_privilege then null; end;
  begin update public.order_items set price = 1;           raise exception 'T11 FAIL: update items allowed';  exception when insufficient_privilege then null; end;
  begin delete from public.order_items;                    raise exception 'T11 FAIL: delete items allowed';  exception when insufficient_privilege then null; end;
  raise notice 'PASS T11 orders immutable + forged status rejected';
end $$;

-- T12: user B cannot read A's orders or order items
do $$ declare n int; m int; begin
  perform set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',true); perform set_config('request.jwt.claims','{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}',true); execute 'set local role authenticated';
  select count(*) into n from public.orders;
  select count(*) into m from public.order_items;
  if n <> 0 or m <> 0 then raise exception 'T12 FAIL: B sees % orders / % items', n, m; end if;
  perform set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',true); perform set_config('request.jwt.claims','{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}',true); execute 'set local role authenticated';
  select count(*) into n from public.orders;
  if n < 2 then raise exception 'T12 FAIL: A cannot see own orders (%)', n; end if;
  raise notice 'PASS T12 order isolation';
end $$;

-- T13: orders CHECKs hold even for a privileged writer (schema-level integrity)
do $$ begin
  execute 'reset role';
  begin insert into public.orders (user_id, address_snapshot, payment_method, upi_id, subtotal, total)
        values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{}'::jsonb, 'upi', null, 1, 1); raise exception 'T13 FAIL: upi without id'; exception when check_violation then null; end;
  begin insert into public.orders (user_id, address_snapshot, payment_method, upi_id, subtotal, total)
        values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '[]'::jsonb, 'cod', null, 1, 1); raise exception 'T13 FAIL: array snapshot'; exception when check_violation then null; end;
  begin insert into public.orders (user_id, address_snapshot, payment_method, upi_id, subtotal, total)
        values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{}'::jsonb, 'cod', null, -1, 1); raise exception 'T13 FAIL: negative subtotal'; exception when check_violation then null; end;
  begin insert into public.orders (user_id, address_snapshot, payment_method, upi_id, subtotal, total, status)
        values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{}'::jsonb, 'cod', null, 1, 1, 'bogus'); raise exception 'T13 FAIL: bad status'; exception when check_violation then null; end;
  raise notice 'PASS T13 orders CHECK constraints';
end $$;

-- T14: deleting a user cascades to addresses/orders/items (documented decision AD-D3: Helix on delete cascade)
do $$ declare n int; begin
  execute 'reset role';
  delete from auth.users where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  select count(*) into n from (select 1 from public.user_addresses union all select 1 from public.orders union all select 1 from public.order_items) x;
  if n <> 0 then raise exception 'T14 FAIL: % orphan rows after user delete', n; end if;
  raise notice 'PASS T14 cascade on user delete';
end $$;

do $$ begin raise notice 'ALL EPIC 10 DB TESTS PASSED'; end $$;

rollback;   -- leaves the database exactly as it was before this script
