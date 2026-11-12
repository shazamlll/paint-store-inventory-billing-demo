grant usage on schema public to authenticated;

grant select on public.stores to authenticated;
grant select on public.store_members to authenticated;
grant select on public.products to authenticated;
grant select on public.customers to authenticated;
grant select on public.suppliers to authenticated;
grant select on public.sales_orders to authenticated;
grant select on public.sales_order_items to authenticated;
grant select on public.purchase_orders to authenticated;
grant select on public.purchase_order_items to authenticated;
grant select on public.payments to authenticated;
grant select on public.inventory_movements to authenticated;

alter table public.sales_orders
  add column if not exists payment_amount numeric(12, 2) not null default 0 check (payment_amount >= 0);

alter table public.purchase_orders
  add column if not exists payment_amount numeric(12, 2) not null default 0 check (payment_amount >= 0);

create or replace function public.save_purchase_order_transaction(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid := (p_payload->>'store_id')::uuid;
  v_supplier_id uuid := (p_payload->>'supplier_id')::uuid;
  v_received_date date := coalesce((p_payload->>'received_date')::date, current_date);
  v_subtotal numeric(12, 2) := coalesce((p_payload->>'subtotal')::numeric, 0);
  v_total_amount numeric(12, 2) := coalesce((p_payload->>'total_amount')::numeric, 0);
  v_payment_amount numeric(12, 2) := coalesce((p_payload->>'payment_amount')::numeric, 0);
  v_payment_status text := coalesce(p_payload->>'payment_status', 'unpaid');
  v_payable_delta numeric(12, 2) := coalesce((p_payload->>'payable_delta')::numeric, 0);
  v_notes text := coalesce(p_payload->>'notes', '');
  v_order_id uuid;
  v_order_number text;
  v_sequence integer;
  v_line jsonb;
  v_product record;
  v_quantity numeric(12, 3);
  v_stock_after numeric(12, 3);
begin
  if auth.uid() is null then
    raise exception 'missing authenticated user';
  end if;

  if not exists (
    select 1
    from public.store_members
    where store_id = v_store_id
      and user_id = auth.uid()
      and active = true
      and role in ('owner', 'clerk')
  ) then
    raise exception 'purchase store access denied';
  end if;

  if not exists (
    select 1
    from public.suppliers
    where id = v_supplier_id
      and store_id = v_store_id
      and active = true
  ) then
    raise exception 'purchase supplier not found in active store';
  end if;

  if v_payment_amount > v_total_amount then
    raise exception 'purchase payment exceeds total';
  end if;

  if v_payment_status not in ('paid', 'partial', 'unpaid') then
    raise exception 'invalid purchase payment status';
  end if;

  if jsonb_array_length(coalesce(p_payload->'lines', '[]'::jsonb)) = 0 then
    raise exception 'purchase order requires line items';
  end if;

  for v_line in
    select value from jsonb_array_elements(p_payload->'lines')
  loop
    v_quantity := (v_line->>'quantity')::numeric;

    select *
    into v_product
    from public.products
    where id = (v_line->>'product_id')::uuid
      and store_id = v_store_id
      and active = true
    for update;

    if not found then
      raise exception 'purchase product not found in active store';
    end if;

    if v_quantity <= 0 then
      raise exception 'purchase line quantity must be positive';
    end if;

    if (v_line->>'unit_cost')::numeric < 0 then
      raise exception 'purchase unit cost invalid';
    end if;
  end loop;

  select count(*) + 1
  into v_sequence
  from public.purchase_orders
  where store_id = v_store_id
    and received_date = v_received_date;

  v_order_number := 'PO-' || to_char(v_received_date, 'YYYYMMDD') || '-' || lpad(v_sequence::text, 3, '0');

  insert into public.purchase_orders (
    store_id,
    order_number,
    supplier_id,
    received_date,
    subtotal,
    total_amount,
    payment_amount,
    payment_status,
    payable_delta,
    notes
  )
  values (
    v_store_id,
    v_order_number,
    v_supplier_id,
    v_received_date,
    v_subtotal,
    v_total_amount,
    v_payment_amount,
    v_payment_status,
    v_payable_delta,
    v_notes
  )
  returning id into v_order_id;

  for v_line in
    select value from jsonb_array_elements(p_payload->'lines')
  loop
    v_quantity := (v_line->>'quantity')::numeric;

    update public.products
    set current_stock = current_stock + v_quantity
    where id = (v_line->>'product_id')::uuid
      and store_id = v_store_id
    returning current_stock into v_stock_after;

    insert into public.purchase_order_items (
      store_id,
      purchase_order_id,
      product_id,
      product_name_snapshot,
      spec_snapshot,
      quantity,
      unit,
      unit_cost,
      line_total
    )
    values (
      v_store_id,
      v_order_id,
      (v_line->>'product_id')::uuid,
      v_line->>'product_name_snapshot',
      coalesce(v_line->>'spec_snapshot', ''),
      v_quantity,
      v_line->>'unit',
      (v_line->>'unit_cost')::numeric,
      (v_line->>'line_total')::numeric
    );

    insert into public.inventory_movements (
      store_id,
      product_id,
      movement_type,
      quantity_delta,
      stock_after,
      source_table,
      source_id,
      notes
    )
    values (
      v_store_id,
      (v_line->>'product_id')::uuid,
      'purchase',
      v_quantity,
      v_stock_after,
      'purchase_orders',
      v_order_id,
      'Purchase receiving transaction'
    );
  end loop;

  update public.suppliers
  set payable_balance = payable_balance + v_payable_delta
  where id = v_supplier_id
    and store_id = v_store_id;

  return jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'store_id', v_store_id,
    'supplier_id', v_supplier_id,
    'total_amount', v_total_amount,
    'payment_amount', v_payment_amount,
    'payable_delta', v_payable_delta
  );
end;
$$;

grant execute on function public.save_purchase_order_transaction(jsonb) to authenticated;

notify pgrst, 'reload schema';
