create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null default '',
  address text not null default '',
  notes text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_members (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (role in ('owner', 'clerk', 'accountant')),
  unique (store_id, user_id)
);

alter table public.products
  add column if not exists store_id uuid references public.stores(id);
alter table public.customers
  add column if not exists store_id uuid references public.stores(id);
alter table public.suppliers
  add column if not exists store_id uuid references public.stores(id);
alter table public.sales_orders
  add column if not exists store_id uuid references public.stores(id);
alter table public.sales_order_items
  add column if not exists store_id uuid references public.stores(id);
alter table public.purchase_orders
  add column if not exists store_id uuid references public.stores(id);
alter table public.purchase_order_items
  add column if not exists store_id uuid references public.stores(id);
alter table public.payments
  add column if not exists store_id uuid references public.stores(id);
alter table public.inventory_movements
  add column if not exists store_id uuid references public.stores(id);

alter table public.sales_orders
  drop constraint if exists sales_orders_order_number_key;
alter table public.purchase_orders
  drop constraint if exists purchase_orders_order_number_key;

create unique index if not exists idx_sales_orders_store_order_number
  on public.sales_orders(store_id, order_number);
create unique index if not exists idx_purchase_orders_store_order_number
  on public.purchase_orders(store_id, order_number);

create index if not exists idx_store_members_user_id on public.store_members(user_id);
create index if not exists idx_store_members_store_id on public.store_members(store_id);
create index if not exists idx_products_store_id on public.products(store_id);
create index if not exists idx_customers_store_id on public.customers(store_id);
create index if not exists idx_suppliers_store_id on public.suppliers(store_id);
create index if not exists idx_sales_orders_store_id on public.sales_orders(store_id);
create index if not exists idx_sales_order_items_store_id on public.sales_order_items(store_id);
create index if not exists idx_purchase_orders_store_id on public.purchase_orders(store_id);
create index if not exists idx_purchase_order_items_store_id on public.purchase_order_items(store_id);
create index if not exists idx_payments_store_id on public.payments(store_id);
create index if not exists idx_inventory_movements_store_id on public.inventory_movements(store_id);

create or replace function public.current_user_store_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select store_id
  from public.store_members
  where user_id = auth.uid()
    and active = true
$$;

grant execute on function public.current_user_store_ids() to authenticated;

grant usage on schema public to authenticated;
grant select on public.stores to authenticated;
grant select on public.store_members to authenticated;
grant select on public.products to authenticated;
grant select on public.customers to authenticated;
grant select on public.suppliers to authenticated;

alter table public.stores enable row level security;
alter table public.store_members enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.suppliers enable row level security;
alter table public.sales_orders enable row level security;
alter table public.sales_order_items enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.payments enable row level security;
alter table public.inventory_movements enable row level security;

create policy stores_store_select
  on public.stores for select to authenticated
  using (id in (select public.current_user_store_ids()));

create policy store_members_store_select
  on public.store_members for select to authenticated
  using (store_id in (select public.current_user_store_ids()));

create policy products_store_select
  on public.products for select to authenticated
  using (store_id in (select public.current_user_store_ids()));
create policy products_store_insert
  on public.products for insert to authenticated
  with check (store_id in (select public.current_user_store_ids()));
create policy products_store_update
  on public.products for update to authenticated
  using (store_id in (select public.current_user_store_ids()))
  with check (store_id in (select public.current_user_store_ids()));
create policy products_store_delete
  on public.products for delete to authenticated
  using (store_id in (select public.current_user_store_ids()));

create policy customers_store_select
  on public.customers for select to authenticated
  using (store_id in (select public.current_user_store_ids()));
create policy customers_store_insert
  on public.customers for insert to authenticated
  with check (store_id in (select public.current_user_store_ids()));
create policy customers_store_update
  on public.customers for update to authenticated
  using (store_id in (select public.current_user_store_ids()))
  with check (store_id in (select public.current_user_store_ids()));
create policy customers_store_delete
  on public.customers for delete to authenticated
  using (store_id in (select public.current_user_store_ids()));

create policy suppliers_store_select
  on public.suppliers for select to authenticated
  using (store_id in (select public.current_user_store_ids()));
create policy suppliers_store_insert
  on public.suppliers for insert to authenticated
  with check (store_id in (select public.current_user_store_ids()));
create policy suppliers_store_update
  on public.suppliers for update to authenticated
  using (store_id in (select public.current_user_store_ids()))
  with check (store_id in (select public.current_user_store_ids()));
create policy suppliers_store_delete
  on public.suppliers for delete to authenticated
  using (store_id in (select public.current_user_store_ids()));

create policy sales_orders_store_select
  on public.sales_orders for select to authenticated
  using (store_id in (select public.current_user_store_ids()));
create policy sales_orders_store_insert
  on public.sales_orders for insert to authenticated
  with check (store_id in (select public.current_user_store_ids()));
create policy sales_orders_store_update
  on public.sales_orders for update to authenticated
  using (store_id in (select public.current_user_store_ids()))
  with check (store_id in (select public.current_user_store_ids()));
create policy sales_orders_store_delete
  on public.sales_orders for delete to authenticated
  using (store_id in (select public.current_user_store_ids()));

create policy sales_order_items_store_select
  on public.sales_order_items for select to authenticated
  using (store_id in (select public.current_user_store_ids()));
create policy sales_order_items_store_insert
  on public.sales_order_items for insert to authenticated
  with check (store_id in (select public.current_user_store_ids()));
create policy sales_order_items_store_update
  on public.sales_order_items for update to authenticated
  using (store_id in (select public.current_user_store_ids()))
  with check (store_id in (select public.current_user_store_ids()));
create policy sales_order_items_store_delete
  on public.sales_order_items for delete to authenticated
  using (store_id in (select public.current_user_store_ids()));

create policy purchase_orders_store_select
  on public.purchase_orders for select to authenticated
  using (store_id in (select public.current_user_store_ids()));
create policy purchase_orders_store_insert
  on public.purchase_orders for insert to authenticated
  with check (store_id in (select public.current_user_store_ids()));
create policy purchase_orders_store_update
  on public.purchase_orders for update to authenticated
  using (store_id in (select public.current_user_store_ids()))
  with check (store_id in (select public.current_user_store_ids()));
create policy purchase_orders_store_delete
  on public.purchase_orders for delete to authenticated
  using (store_id in (select public.current_user_store_ids()));

create policy purchase_order_items_store_select
  on public.purchase_order_items for select to authenticated
  using (store_id in (select public.current_user_store_ids()));
create policy purchase_order_items_store_insert
  on public.purchase_order_items for insert to authenticated
  with check (store_id in (select public.current_user_store_ids()));
create policy purchase_order_items_store_update
  on public.purchase_order_items for update to authenticated
  using (store_id in (select public.current_user_store_ids()))
  with check (store_id in (select public.current_user_store_ids()));
create policy purchase_order_items_store_delete
  on public.purchase_order_items for delete to authenticated
  using (store_id in (select public.current_user_store_ids()));

create policy payments_store_select
  on public.payments for select to authenticated
  using (store_id in (select public.current_user_store_ids()));
create policy payments_store_insert
  on public.payments for insert to authenticated
  with check (store_id in (select public.current_user_store_ids()));
create policy payments_store_update
  on public.payments for update to authenticated
  using (store_id in (select public.current_user_store_ids()))
  with check (store_id in (select public.current_user_store_ids()));
create policy payments_store_delete
  on public.payments for delete to authenticated
  using (store_id in (select public.current_user_store_ids()));

create policy inventory_movements_store_select
  on public.inventory_movements for select to authenticated
  using (store_id in (select public.current_user_store_ids()));
create policy inventory_movements_store_insert
  on public.inventory_movements for insert to authenticated
  with check (store_id in (select public.current_user_store_ids()));
create policy inventory_movements_store_update
  on public.inventory_movements for update to authenticated
  using (store_id in (select public.current_user_store_ids()))
  with check (store_id in (select public.current_user_store_ids()));
create policy inventory_movements_store_delete
  on public.inventory_movements for delete to authenticated
  using (store_id in (select public.current_user_store_ids()));
