create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id),
  actor_user_id uuid,
  operation text not null,
  target_table text not null,
  target_id uuid,
  target_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (operation in ('insert', 'update', 'delete', 'reverse'))
);

create index if not exists idx_audit_logs_store_created_at
  on public.audit_logs(store_id, created_at desc);
create index if not exists idx_audit_logs_target
  on public.audit_logs(target_table, target_id);

alter table public.audit_logs enable row level security;

drop policy if exists audit_logs_store_select on public.audit_logs;
create policy audit_logs_store_select
  on public.audit_logs for select to authenticated
  using (store_id in (select public.current_user_store_ids()));

grant select on public.audit_logs to authenticated;

create or replace function public.audit_business_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row jsonb;
  v_store_id uuid;
  v_target_id uuid;
begin
  if TG_OP = 'DELETE' then
    v_row := to_jsonb(old);
  else
    v_row := to_jsonb(new);
  end if;

  v_store_id := nullif(v_row->>'store_id', '')::uuid;
  v_target_id := nullif(v_row->>'id', '')::uuid;

  insert into public.audit_logs (
    store_id,
    actor_user_id,
    operation,
    target_table,
    target_id,
    target_snapshot
  )
  values (
    v_store_id,
    auth.uid(),
    lower(TG_OP),
    TG_TABLE_NAME,
    v_target_id,
    v_row
  );

  if TG_OP = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists audit_sales_orders_changes on public.sales_orders;
create trigger audit_sales_orders_changes
after insert or update or delete on public.sales_orders
for each row execute function public.audit_business_row_change();

drop trigger if exists audit_purchase_orders_changes on public.purchase_orders;
create trigger audit_purchase_orders_changes
after insert or update or delete on public.purchase_orders
for each row execute function public.audit_business_row_change();

drop trigger if exists audit_payments_changes on public.payments;
create trigger audit_payments_changes
after insert or update or delete on public.payments
for each row execute function public.audit_business_row_change();

drop trigger if exists audit_inventory_movements_changes on public.inventory_movements;
create trigger audit_inventory_movements_changes
after insert or update or delete on public.inventory_movements
for each row execute function public.audit_business_row_change();

drop policy if exists sales_orders_store_delete on public.sales_orders;
drop policy if exists sales_order_items_store_delete on public.sales_order_items;
drop policy if exists purchase_orders_store_delete on public.purchase_orders;
drop policy if exists purchase_order_items_store_delete on public.purchase_order_items;
drop policy if exists payments_store_delete on public.payments;
drop policy if exists inventory_movements_store_delete on public.inventory_movements;

alter table public.sales_orders
  add column if not exists correction_status text not null default 'active',
  add column if not exists reversed_at timestamptz,
  add column if not exists reversed_by uuid,
  add column if not exists reversal_reason text not null default '';

alter table public.purchase_orders
  add column if not exists correction_status text not null default 'active',
  add column if not exists reversed_at timestamptz,
  add column if not exists reversed_by uuid,
  add column if not exists reversal_reason text not null default '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sales_orders_correction_status_check'
  ) then
    alter table public.sales_orders
      add constraint sales_orders_correction_status_check
      check (correction_status in ('active', 'reversed'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'purchase_orders_correction_status_check'
  ) then
    alter table public.purchase_orders
      add constraint purchase_orders_correction_status_check
      check (correction_status in ('active', 'reversed'));
  end if;
end;
$$;

create or replace function public.reverse_sales_order_transaction(
  p_sales_order_id uuid,
  p_reason text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_order record;
  v_item record;
  v_stock_after numeric(12, 3);
begin
  if v_actor is null then
    raise exception 'missing authenticated user';
  end if;

  select *
  into v_order
  from public.sales_orders
  where id = p_sales_order_id
  for update;

  if not found then
    raise exception 'sales order not found';
  end if;

  if not exists (
    select 1
    from public.store_members
    where store_id = v_order.store_id
      and user_id = v_actor
      and active = true
      and role in ('owner', 'clerk')
  ) then
    raise exception 'sales reversal store access denied';
  end if;

  if v_order.correction_status = 'reversed' then
    raise exception 'sales order already reversed';
  end if;

  if coalesce(v_order.payment_amount, 0) > 0 then
    raise exception 'sales order with attached payment requires payment reversal workflow';
  end if;

  for v_item in
    select *
    from public.sales_order_items
    where sales_order_id = v_order.id
      and store_id = v_order.store_id
  loop
    update public.products
    set current_stock = current_stock + v_item.quantity
    where id = v_item.product_id
      and store_id = v_order.store_id
    returning current_stock into v_stock_after;

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
      v_order.store_id,
      v_item.product_id,
      'adjustment',
      v_item.quantity,
      v_stock_after,
      'sales_orders',
      v_order.id,
      'Sales order reversal: ' || coalesce(p_reason, '')
    );
  end loop;

  update public.customers
  set receivable_balance = receivable_balance - v_order.receivable_delta
  where id = v_order.customer_id
    and store_id = v_order.store_id;

  update public.sales_orders
  set correction_status = 'reversed',
      reversed_at = now(),
      reversed_by = v_actor,
      reversal_reason = coalesce(p_reason, '')
  where id = v_order.id;

  insert into public.audit_logs (
    store_id,
    actor_user_id,
    operation,
    target_table,
    target_id,
    target_snapshot
  )
  values (
    v_order.store_id,
    v_actor,
    'reverse',
    'sales_orders',
    v_order.id,
    jsonb_build_object(
      'reason', coalesce(p_reason, ''),
      'receivable_delta', v_order.receivable_delta,
      'payment_amount', v_order.payment_amount
    )
  );

  return jsonb_build_object(
    'id', v_order.id,
    'store_id', v_order.store_id,
    'correction_status', 'reversed',
    'reversed_receivable_delta', v_order.receivable_delta
  );
end;
$$;

grant execute on function public.reverse_sales_order_transaction(uuid, text) to authenticated;
