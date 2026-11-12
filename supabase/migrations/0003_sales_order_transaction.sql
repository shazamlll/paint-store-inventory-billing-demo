alter table public.sales_orders
  add column if not exists payment_amount numeric(12, 2) not null default 0 check (payment_amount >= 0);

create or replace function public.save_sales_order_transaction(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid := (p_payload->>'store_id')::uuid;
  v_customer_id uuid := (p_payload->>'customer_id')::uuid;
  v_order_date date := coalesce((p_payload->>'order_date')::date, current_date);
  v_subtotal numeric(12, 2) := coalesce((p_payload->>'subtotal')::numeric, 0);
  v_discount_amount numeric(12, 2) := coalesce((p_payload->>'discount_amount')::numeric, 0);
  v_total_amount numeric(12, 2) := coalesce((p_payload->>'total_amount')::numeric, 0);
  v_payment_amount numeric(12, 2) := coalesce((p_payload->>'payment_amount')::numeric, 0);
  v_payment_status text := coalesce(p_payload->>'payment_status', 'unpaid');
  v_receivable_delta numeric(12, 2) := coalesce((p_payload->>'receivable_delta')::numeric, 0);
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
    raise exception 'sales store access denied';
  end if;

  if not exists (
    select 1
    from public.customers
    where id = v_customer_id
      and store_id = v_store_id
      and active = true
  ) then
    raise exception 'sales customer not found in active store';
  end if;

  if v_payment_amount > v_total_amount then
    raise exception 'sales payment exceeds total';
  end if;

  if v_payment_status not in ('paid', 'partial', 'unpaid') then
    raise exception 'invalid sales payment status';
  end if;

  if jsonb_array_length(coalesce(p_payload->'lines', '[]'::jsonb)) = 0 then
    raise exception 'sales order requires line items';
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
      raise exception 'sales product not found in active store';
    end if;

    if v_quantity <= 0 then
      raise exception 'sales line quantity must be positive';
    end if;

    if v_product.current_stock < v_quantity then
      raise exception 'sales stock insufficient';
    end if;
  end loop;

  select count(*) + 1
  into v_sequence
  from public.sales_orders
  where store_id = v_store_id
    and order_date = v_order_date;

  v_order_number := 'SO-' || to_char(v_order_date, 'YYYYMMDD') || '-' || lpad(v_sequence::text, 3, '0');

  insert into public.sales_orders (
    store_id,
    order_number,
    customer_id,
    order_date,
    subtotal,
    discount_amount,
    total_amount,
    payment_amount,
    payment_status,
    receivable_delta,
    notes
  )
  values (
    v_store_id,
    v_order_number,
    v_customer_id,
    v_order_date,
    v_subtotal,
    v_discount_amount,
    v_total_amount,
    v_payment_amount,
    v_payment_status,
    v_receivable_delta,
    v_notes
  )
  returning id into v_order_id;

  for v_line in
    select value from jsonb_array_elements(p_payload->'lines')
  loop
    v_quantity := (v_line->>'quantity')::numeric;

    update public.products
    set current_stock = current_stock - v_quantity
    where id = (v_line->>'product_id')::uuid
      and store_id = v_store_id
    returning current_stock into v_stock_after;

    insert into public.sales_order_items (
      store_id,
      sales_order_id,
      product_id,
      product_name_snapshot,
      spec_snapshot,
      quantity,
      unit,
      unit_price,
      discount_amount,
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
      (v_line->>'unit_price')::numeric,
      (v_line->>'discount_amount')::numeric,
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
      'sale',
      -v_quantity,
      v_stock_after,
      'sales_orders',
      v_order_id,
      'Sales order transaction'
    );
  end loop;

  update public.customers
  set receivable_balance = receivable_balance + v_receivable_delta
  where id = v_customer_id
    and store_id = v_store_id;

  if v_payment_amount > 0 then
    insert into public.payments (
      store_id,
      customer_id,
      sales_order_id,
      payment_date,
      amount,
      method,
      notes
    )
    values (
      v_store_id,
      v_customer_id,
      v_order_id,
      v_order_date,
      v_payment_amount,
      'cash',
      'Sales order payment'
    );
  end if;

  return jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'store_id', v_store_id,
    'customer_id', v_customer_id,
    'total_amount', v_total_amount,
    'payment_amount', v_payment_amount,
    'receivable_delta', v_receivable_delta
  );
end;
$$;

grant execute on function public.save_sales_order_transaction(jsonb) to authenticated;

notify pgrst, 'reload schema';
