-- Day 037 development RLS evidence checks.
-- Run in the development project SQL editor after day034_development_migration.sql.
-- This file is read-only diagnostics. Do not paste private credentials into notes.

select
  schemaname,
  tablename,
  rowsecurity as "row security"
from pg_tables
where schemaname = 'public'
  and tablename in ('products', 'customers', 'suppliers', 'stores', 'store_members')
order by tablename;

select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('products', 'customers', 'suppliers', 'stores', 'store_members')
order by tablename, policyname;

select
  'products' as table_name,
  count(*) as rows_visible_to_current_context
from public.products
union all
select
  'customers' as table_name,
  count(*) as rows_visible_to_current_context
from public.customers
union all
select
  'suppliers' as table_name,
  count(*) as rows_visible_to_current_context
from public.suppliers;
