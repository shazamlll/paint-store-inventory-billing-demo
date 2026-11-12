create table if not exists public.store_onboarding_runs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'provisioned',
  checklist jsonb not null default '[]'::jsonb,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, store_id),
  check (status in ('provisioned', 'importing', 'verified', 'handoff_ready', 'active'))
);

create index if not exists idx_store_onboarding_runs_store_id
  on public.store_onboarding_runs(store_id);
create index if not exists idx_store_onboarding_runs_owner_user_id
  on public.store_onboarding_runs(owner_user_id);

drop trigger if exists set_store_onboarding_runs_updated_at on public.store_onboarding_runs;
create trigger set_store_onboarding_runs_updated_at
before update on public.store_onboarding_runs
for each row execute function public.set_updated_at();

alter table public.store_onboarding_runs enable row level security;

drop policy if exists store_onboarding_runs_store_select on public.store_onboarding_runs;
create policy store_onboarding_runs_store_select
  on public.store_onboarding_runs for select to authenticated
  using (store_id in (select public.current_user_store_ids()));

grant select on public.store_onboarding_runs to authenticated;

create or replace function public.provision_store_owner(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_owner_user_id uuid := (p_payload->>'owner_user_id')::uuid;
  v_store_name text := nullif(trim(p_payload->>'name'), '');
  v_phone text := coalesce(p_payload->>'phone', '');
  v_address text := coalesce(p_payload->>'address', '');
  v_notes text := coalesce(p_payload->>'notes', '');
  v_store_id uuid;
  v_membership_id uuid;
  v_onboarding_run_id uuid;
  v_checklist jsonb := jsonb_build_array(
    'import_products',
    'import_customers',
    'import_suppliers',
    'import_opening_stock',
    'import_opening_receivables',
    'verify_store_isolation',
    'handoff_owner_login'
  );
begin
  if v_actor is null then
    raise exception 'missing authenticated user';
  end if;

  if v_owner_user_id is distinct from v_actor then
    raise exception 'owner user must match authenticated user';
  end if;

  if v_store_name is null then
    raise exception 'store name required';
  end if;

  insert into public.stores (
    name,
    phone,
    address,
    notes
  )
  values (
    v_store_name,
    v_phone,
    v_address,
    v_notes
  )
  returning id into v_store_id;

  insert into public.store_members (
    store_id,
    user_id,
    role,
    active
  )
  values (
    v_store_id,
    v_owner_user_id,
    'owner',
    true
  )
  returning id into v_membership_id;

  insert into public.store_onboarding_runs (
    store_id,
    owner_user_id,
    status,
    checklist,
    notes
  )
  values (
    v_store_id,
    v_owner_user_id,
    'provisioned',
    v_checklist,
    'Store provisioned; import and isolation verification remain pending.'
  )
  returning id into v_onboarding_run_id;

  return jsonb_build_object(
    'store_id', v_store_id,
    'membership_id', v_membership_id,
    'onboarding_run_id', v_onboarding_run_id,
    'role', 'owner',
    'status', 'provisioned',
    'checklist', v_checklist
  );
end;
$$;

grant execute on function public.provision_store_owner(jsonb) to authenticated;
