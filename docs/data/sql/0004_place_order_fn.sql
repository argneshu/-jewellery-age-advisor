-- Epic 10, Story 10.2 (D3) — atomic order creation
-- Source: docs/data/data-model-epic10.md. Run after 0002 and 0003. Non-production first.
-- Rollback: 0004_place_order_fn_rollback.sql
--
-- SECURITY INVOKER: runs with the caller's privileges, so every RLS policy still applies. Never SECURITY DEFINER.
-- search_path is empty: every object below is schema-qualified.
-- The function never trusts a client-supplied total: subtotal is computed here from the validated lines.
-- It cannot verify that unit prices match the catalog (the catalog is a static TypeScript file) — residual risk R1,
-- see docs/architecture/design/02-target-architecture-brownfield.md section 10.6.
--
-- p_items = [{"jewellery_item_id": int, "name": text, "price": int, "quantity": int}, ...]
-- Errors (message text is the contract): not_authenticated | invalid_order | no_address

create or replace function public.place_order(
  p_payment_method text,
  p_upi_id         text,
  p_items          jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user      uuid := auth.uid();
  v_address   public.user_addresses%rowtype;
  v_len       integer;
  v_valid     integer;
  v_distinct  integer;
  v_subtotal  bigint;
  v_order_id  uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if p_payment_method is null or p_payment_method not in ('cod', 'upi') then
    raise exception 'invalid_order';
  end if;
  if p_payment_method = 'upi' then
    if p_upi_id is null or p_upi_id !~ '^[A-Za-z0-9._-]{2,100}@[A-Za-z]{2,64}$' then
      raise exception 'invalid_order';
    end if;
  elsif p_upi_id is not null then
    raise exception 'invalid_order';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'invalid_order';
  end if;
  v_len := jsonb_array_length(p_items);
  if v_len < 1 or v_len > 40 then
    raise exception 'invalid_order';
  end if;

  -- Validate every line WITHOUT casting first (a bad value must yield invalid_order, not a cast error).
  select count(*) into v_valid
  from jsonb_array_elements(p_items) as e
  where jsonb_typeof(e) = 'object'
    and jsonb_typeof(e -> 'jewellery_item_id') = 'number' and (e ->> 'jewellery_item_id') ~ '^[1-9][0-9]{0,8}$'
    and jsonb_typeof(e -> 'price')             = 'number' and (e ->> 'price')             ~ '^[0-9]{1,9}$'
    and jsonb_typeof(e -> 'quantity')          = 'number' and (e ->> 'quantity')          ~ '^([1-9]|10)$'
    and jsonb_typeof(e -> 'name')              = 'string' and length(btrim(e ->> 'name')) between 1 and 200;
  if v_valid <> v_len then
    raise exception 'invalid_order';
  end if;

  select count(distinct (e ->> 'jewellery_item_id')::integer) into v_distinct
  from jsonb_array_elements(p_items) as e;
  if v_distinct <> v_len then
    raise exception 'invalid_order';
  end if;

  select sum(((e ->> 'price')::bigint) * ((e ->> 'quantity')::bigint)) into v_subtotal
  from jsonb_array_elements(p_items) as e;
  if v_subtotal is null or v_subtotal > 2147483647 then
    raise exception 'invalid_order';
  end if;

  select * into v_address from public.user_addresses where user_id = v_user;
  if not found then
    raise exception 'no_address';
  end if;

  insert into public.orders (user_id, address_snapshot, payment_method, upi_id, subtotal, total)
  values (v_user, to_jsonb(v_address), p_payment_method, p_upi_id, v_subtotal::integer, v_subtotal::integer)
  returning id into v_order_id;

  insert into public.order_items (order_id, jewellery_item_id, name, price, quantity)
  select v_order_id,
         (e ->> 'jewellery_item_id')::integer,
         btrim(e ->> 'name'),
         (e ->> 'price')::integer,
         (e ->> 'quantity')::integer
  from jsonb_array_elements(p_items) as e;

  return v_order_id;
end;
$$;

-- Functions are executable by PUBLIC by default, and Supabase also grants anon: close both, open only authenticated.
revoke all on function public.place_order(text, text, jsonb) from public;
revoke all on function public.place_order(text, text, jsonb) from anon;
grant execute on function public.place_order(text, text, jsonb) to authenticated;

-- Make the new function visible to the Supabase API immediately.
notify pgrst, 'reload schema';
