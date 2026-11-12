create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  spec text not null default '',
  unit text not null,
  cost_price numeric(12, 2) not null default 0 check (cost_price >= 0),
  sale_price numeric(12, 2) not null default 0 check (sale_price >= 0),
  current_stock numeric(12, 3) not null default 0,
  low_stock_threshold numeric(12, 3) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null default '',
  notes text not null default '',
  receivable_balance numeric(12, 2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null default '',
  notes text not null default '',
  payable_balance numeric(12, 2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references public.customers(id),
  order_date date not null default current_date,
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  discount_amount numeric(12, 2) not null default 0 check (discount_amount >= 0),
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  payment_status text not null default 'unpaid',
  receivable_delta numeric(12, 2) not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (payment_status in ('paid', 'partial', 'unpaid'))
);

create table if not exists public.sales_order_items (
  id uuid primary key default gen_random_uuid(),
  sales_order_id uuid references public.sales_orders(id) on delete cascade,
  product_id uuid references public.products(id),
  product_name_snapshot text not null,
  spec_snapshot text not null default '',
  quantity numeric(12, 3) not null check (quantity > 0),
  unit text not null,
  unit_price numeric(12, 2) not null default 0 check (unit_price >= 0),
  discount_amount numeric(12, 2) not null default 0 check (discount_amount >= 0),
  line_total numeric(12, 2) not null default 0 check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  supplier_id uuid references public.suppliers(id),
  received_date date not null default current_date,
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  payment_status text not null default 'unpaid',
  payable_delta numeric(12, 2) not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (payment_status in ('paid', 'partial', 'unpaid'))
);

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid references public.purchase_orders(id) on delete cascade,
  product_id uuid references public.products(id),
  product_name_snapshot text not null,
  spec_snapshot text not null default '',
  quantity numeric(12, 3) not null check (quantity > 0),
  unit text not null,
  unit_cost numeric(12, 2) not null default 0 check (unit_cost >= 0),
  line_total numeric(12, 2) not null default 0 check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id),
  sales_order_id uuid references public.sales_orders(id),
  payment_date date not null default current_date,
  amount numeric(12, 2) not null check (amount > 0),
  method text not null default 'cash',
  notes text not null default '',
  created_at timestamptz not null default now(),
  check (method in ('cash', 'bank_transfer', 'other'))
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id),
  movement_type text not null,
  quantity_delta numeric(12, 3) not null,
  stock_after numeric(12, 3) not null,
  source_table text not null,
  source_id uuid not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  check (movement_type in ('sale', 'purchase', 'adjustment'))
);

create index if not exists idx_products_active on public.products(active);
create index if not exists idx_products_low_stock on public.products(current_stock, low_stock_threshold);
create index if not exists idx_sales_orders_customer_id on public.sales_orders(customer_id);
create index if not exists idx_sales_order_items_order_id on public.sales_order_items(sales_order_id);
create index if not exists idx_purchase_orders_supplier_id on public.purchase_orders(supplier_id);
create index if not exists idx_purchase_order_items_order_id on public.purchase_order_items(purchase_order_id);
create index if not exists idx_payments_customer_id on public.payments(customer_id);
create index if not exists idx_inventory_movements_product_id on public.inventory_movements(product_id);

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_customers_updated_at on public.customers;
create trigger set_customers_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

drop trigger if exists set_suppliers_updated_at on public.suppliers;
create trigger set_suppliers_updated_at
before update on public.suppliers
for each row execute function public.set_updated_at();

drop trigger if exists set_sales_orders_updated_at on public.sales_orders;
create trigger set_sales_orders_updated_at
before update on public.sales_orders
for each row execute function public.set_updated_at();

drop trigger if exists set_purchase_orders_updated_at on public.purchase_orders;
create trigger set_purchase_orders_updated_at
before update on public.purchase_orders
for each row execute function public.set_updated_at();
