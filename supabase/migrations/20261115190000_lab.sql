-- Lab: orders, sample status, result entry, verification, and reporting.
-- Results are append-only; corrections are new result records, never UPDATE/DELETE.

create table public.lab_orders (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  patient_id uuid not null references public.patients (id),
  visit_id uuid references public.visits (id),
  provider_id uuid not null references public.profiles (user_id),
  order_no text not null check (btrim(order_no) <> ''),
  status text not null check (status in ('ordered', 'sample_collected', 'in_progress', 'completed', 'cancelled')),
  priority text not null check (priority in ('routine', 'urgent', 'stat')),
  ordered_at timestamptz not null default now(),
  collected_at timestamptz,
  completed_at timestamptz,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  version integer not null default 1,
  constraint lab_orders_order_no_hospital_key unique (hospital_id, order_no)
);

create index lab_orders_hospital_patient_idx
  on public.lab_orders (hospital_id, patient_id, ordered_at desc)
  where deleted_at is null;
create index lab_orders_hospital_status_idx
  on public.lab_orders (hospital_id, status, ordered_at desc)
  where deleted_at is null;
create index lab_orders_hospital_visit_idx
  on public.lab_orders (hospital_id, visit_id, ordered_at desc)
  where deleted_at is null;

create or replace function private.prepare_lab_order_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(auth.uid(), new.created_by);
    new.updated_by := coalesce(auth.uid(), new.updated_by);
  else
    new.hospital_id := old.hospital_id;
    new.patient_id := old.patient_id;
    new.visit_id := old.visit_id;
    new.provider_id := old.provider_id;
    new.order_no := old.order_no;
    new.notes := old.notes;
    new.ordered_at := old.ordered_at;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_by := coalesce(auth.uid(), old.updated_by);
    new.version := old.version + 1;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger lab_orders_prepare
before insert or update on public.lab_orders
for each row execute function private.prepare_lab_order_row();

create trigger lab_orders_audit
after insert or update or delete on public.lab_orders
for each row execute function private.write_audit_event();

alter table public.lab_orders enable row level security;

create policy lab_orders_select on public.lab_orders
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('lab:read'))
  and deleted_at is null
);

create policy lab_orders_insert on public.lab_orders
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('lab:create'))
);

create policy lab_orders_update on public.lab_orders
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('lab:update'))
  and deleted_at is null
)
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('lab:update'))
  and deleted_at is null
);

revoke all on public.lab_orders from authenticated, anon;
grant select on public.lab_orders to authenticated;
grant insert (
  hospital_id, patient_id, visit_id, provider_id, order_no, status, priority, notes
) on public.lab_orders to authenticated;
grant update (
  status, collected_at, completed_at, notes
) on public.lab_orders to authenticated;

-- Lab order items: individual tests within an order.

create table public.lab_order_items (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  lab_order_id uuid not null references public.lab_orders (id),
  test_name text not null check (btrim(test_name) <> ''),
  test_code text,
  status text not null check (status in ('pending', 'collected', 'in_progress', 'completed', 'cancelled')),
  result_value text,
  result_unit text,
  reference_range text,
  is_abnormal boolean,
  verified boolean not null default false,
  verified_by uuid references auth.users (id),
  verified_at timestamptz,
  entered_at timestamptz,
  entered_by uuid references auth.users (id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index lab_order_items_hospital_order_idx
  on public.lab_order_items (hospital_id, lab_order_id, created_at);

create or replace function private.prepare_lab_order_item_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(auth.uid(), new.created_by);
    new.updated_by := coalesce(auth.uid(), new.updated_by);
  else
    new.hospital_id := old.hospital_id;
    new.lab_order_id := old.lab_order_id;
    new.test_name := old.test_name;
    new.test_code := old.test_code;
    new.reference_range := old.reference_range;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_by := coalesce(auth.uid(), old.updated_by);
    new.version := old.version + 1;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger lab_order_items_prepare
before insert or update on public.lab_order_items
for each row execute function private.prepare_lab_order_item_row();

create trigger lab_order_items_audit
after insert or update or delete on public.lab_order_items
for each row execute function private.write_audit_event();

alter table public.lab_order_items enable row level security;

create policy lab_order_items_select on public.lab_order_items
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('lab:read'))
);

create policy lab_order_items_insert on public.lab_order_items
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('lab:create'))
);

create policy lab_order_items_update on public.lab_order_items
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('lab:update'))
)
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('lab:update'))
);

revoke all on public.lab_order_items from authenticated, anon;
grant select on public.lab_order_items to authenticated;
grant insert (
  hospital_id, lab_order_id, test_name, test_code, status, reference_range
) on public.lab_order_items to authenticated;
grant update (
  result_value, result_unit, is_abnormal, verified, verified_by, verified_at,
  entered_at, entered_by
) on public.lab_order_items to authenticated;

-- Lab results: append-only result records. Corrections are new records.

create table public.lab_results (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  lab_order_item_id uuid not null references public.lab_order_items (id),
  result_value text not null,
  result_unit text,
  reference_range text,
  is_abnormal boolean,
  status text not null check (status in ('preliminary', 'final', 'corrected')),
  entered_by uuid not null references public.profiles (user_id),
  entered_at timestamptz not null default now(),
  verified_by uuid references auth.users (id),
  verified_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  version integer not null default 1
);

create index lab_results_hospital_item_idx
  on public.lab_results (hospital_id, lab_order_item_id, created_at desc);

create or replace function private.prepare_lab_result_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(auth.uid(), new.created_by);
  else
    new.hospital_id := old.hospital_id;
    new.lab_order_item_id := old.lab_order_item_id;
    new.result_value := old.result_value;
    new.result_unit := old.result_unit;
    new.reference_range := old.reference_range;
    new.is_abnormal := old.is_abnormal;
    new.status := old.status;
    new.entered_by := old.entered_by;
    new.entered_at := old.entered_at;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
  end if;
  return new;
end;
$$;

create trigger lab_results_prepare
before insert on public.lab_results
for each row execute function private.prepare_lab_result_row();

create trigger lab_results_audit
after insert on public.lab_results
for each row execute function private.write_audit_event();

alter table public.lab_results enable row level security;

-- Lab results are append-only: INSERT only, no UPDATE or DELETE through RLS.

create policy lab_results_select on public.lab_results
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('lab:read'))
);

create policy lab_results_insert on public.lab_results
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('lab:create'))
);

revoke all on public.lab_results from authenticated, anon;
grant select on public.lab_results to authenticated;
grant insert (
  hospital_id, lab_order_item_id, result_value, result_unit, reference_range,
  is_abnormal, status, entered_by
) on public.lab_results to authenticated;

-- Lab result verification: senior tech verifies results.

create or replace function public.verify_lab_result(
  p_result_id uuid,
  p_verified boolean default true
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_hospital uuid := private.current_hospital_id();
begin
  if target_hospital is null or not (select private.has_permission('lab:verify')) then
    raise exception 'not_authorized';
  end if;

  update public.lab_results
  set verified = p_verified,
      verified_by = auth.uid(),
      verified_at = now()
  where id = p_result_id
    and hospital_id = target_hospital
    and verified is not true;

  return found;
end;
$$;

revoke execute on function public.verify_lab_result(uuid, boolean) from public, anon;
grant execute on function public.verify_lab_result(uuid, boolean) to authenticated;
