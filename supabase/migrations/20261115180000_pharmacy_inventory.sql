-- Pharmacy & Inventory: shared stock engine with batch tracking, FEFO dispensing,
-- and stock movements. Stock movements are append-only; corrections are new
-- reversing movements, never UPDATE/DELETE.

-- Stock locations: where inventory is stored.

create table public.stock_locations (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  name text not null check (btrim(name) <> ''),
  type text not null check (type in ('ward', 'pharmacy', 'warehouse', 'clinic')),
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  version integer not null default 1
);

create index stock_locations_hospital_idx
  on public.stock_locations (hospital_id, is_active)
  where deleted_at is null;

create or replace function private.prepare_stock_location_row()
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
    new.name := old.name;
    new.type := old.type;
    new.is_active := old.is_active;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_by := coalesce(auth.uid(), old.updated_by);
    new.version := old.version + 1;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger stock_locations_prepare
before insert or update on public.stock_locations
for each row execute function private.prepare_stock_location_row();

create trigger stock_locations_audit
after insert or update or delete on public.stock_locations
for each row execute function private.write_audit_event();

alter table public.stock_locations enable row level security;

create policy stock_locations_select on public.stock_locations
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('inventory:read'))
  and deleted_at is null
);

create policy stock_locations_insert on public.stock_locations
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('inventory:create'))
);

create policy stock_locations_update on public.stock_locations
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('inventory:update'))
  and deleted_at is null
)
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('inventory:update'))
  and deleted_at is null
);

revoke all on public.stock_locations from authenticated, anon;
grant select on public.stock_locations to authenticated;
grant insert (
  hospital_id, name, type, is_active
) on public.stock_locations to authenticated;
grant update (
  name, type, is_active
) on public.stock_locations to authenticated;

-- Items: stock items (medications, supplies, consumables).

create table public.items (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  sku text not null check (btrim(sku) <> ''),
  name text not null check (btrim(name) <> ''),
  description text,
  category text,
  unit text not null check (btrim(unit) <> '') default 'piece',
  is_active boolean not null default true,
  requires_prescription boolean not null default false,
  is_controlled boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  version integer not null default 1,
  constraint items_sku_hospital_key unique (hospital_id, sku)
);

create index items_hospital_active_idx
  on public.items (hospital_id, is_active)
  where deleted_at is null;
create index items_hospital_sku_idx
  on public.items (hospital_id, sku)
  where deleted_at is null;

create or replace function private.prepare_item_row()
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
    new.sku := old.sku;
    new.name := old.name;
    new.description := old.description;
    new.category := old.category;
    new.unit := old.unit;
    new.is_active := old.is_active;
    new.requires_prescription := old.requires_prescription;
    new.is_controlled := old.is_controlled;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_by := coalesce(auth.uid(), old.updated_by);
    new.version := old.version + 1;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger items_prepare
before insert or update on public.items
for each row execute function private.prepare_item_row();

create trigger items_audit
after insert or update or delete on public.items
for each row execute function private.write_audit_event();

alter table public.items enable row level security;

create policy items_select on public.items
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('inventory:read'))
  and deleted_at is null
);

create policy items_insert on public.items
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('inventory:create'))
);

create policy items_update on public.items
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('inventory:update'))
  and deleted_at is null
)
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('inventory:update'))
  and deleted_at is null
);

revoke all on public.items from authenticated, anon;
grant select on public.items to authenticated;
grant insert (
  hospital_id, sku, name, description, category, unit, is_active, requires_prescription, is_controlled
) on public.items to authenticated;
grant update (
  name, description, category, unit, is_active, requires_prescription, is_controlled
) on public.items to authenticated;

-- Item batches: batch-level tracking with expiry dates.

create table public.item_batches (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  item_id uuid not null references public.items (id),
  batch_no text not null check (btrim(batch_no) <> ''),
  expiry_date date not null,
  cost_price_minor integer not null check (cost_price_minor >= 0),
  sale_price_minor integer not null check (sale_price_minor >= 0),
  currency char(3) not null default 'AFN',
  received_at timestamptz not null default now(),
  received_by uuid references auth.users (id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  constraint item_batches_batch_no_item_key unique (hospital_id, item_id, batch_no)
);

create index item_batches_hospital_item_idx
  on public.item_batches (hospital_id, item_id, expiry_date);
create index item_batches_expiry_idx
  on public.item_batches (expiry_date)
  where deleted_at is null;

create or replace function private.prepare_item_batch_row()
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
    new.item_id := old.item_id;
    new.batch_no := old.batch_no;
    new.expiry_date := old.expiry_date;
    new.cost_price_minor := old.cost_price_minor;
    new.sale_price_minor := old.sale_price_minor;
    new.currency := old.currency;
    new.received_at := old.received_at;
    new.received_by := old.received_by;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_by := coalesce(auth.uid(), old.updated_by);
    new.version := old.version + 1;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger item_batches_prepare
before insert or update on public.item_batches
for each row execute function private.prepare_item_batch_row();

create trigger item_batches_audit
after insert or update or delete on public.item_batches
for each row execute function private.write_audit_event();

alter table public.item_batches enable row level security;

create policy item_batches_select on public.item_batches
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('inventory:read'))
);

create policy item_batches_insert on public.item_batches
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('inventory:create'))
);

create policy item_batches_update on public.item_batches
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('inventory:update'))
)
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('inventory:update'))
);

revoke all on public.item_batches from authenticated, anon;
grant select on public.item_batches to authenticated;
grant insert (
  hospital_id, item_id, batch_no, expiry_date, cost_price_minor, sale_price_minor, currency, received_by
) on public.item_batches to authenticated;
grant update (
  batch_no, expiry_date, cost_price_minor, sale_price_minor, currency
) on public.item_batches to authenticated;

-- Stock movements: append-only ledger of all stock changes.

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  item_id uuid not null references public.items (id),
  batch_id uuid references public.item_batches (id),
  location_id uuid references public.stock_locations (id),
  movement_type text not null check (movement_type in ('in', 'out', 'adjustment', 'expired', 'damaged')),
  quantity integer not null,
  reference_type text,
  reference_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  constraint stock_movements_quantity_not_zero check (quantity <> 0)
);

create index stock_movements_hospital_item_idx
  on public.stock_movements (hospital_id, item_id, created_at desc);
create index stock_movements_hospital_batch_idx
  on public.stock_movements (hospital_id, batch_id, created_at desc);

create or replace function private.prepare_stock_movement_row()
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
    new.item_id := old.item_id;
    new.batch_id := old.batch_id;
    new.location_id := old.location_id;
    new.movement_type := old.movement_type;
    new.quantity := old.quantity;
    new.reference_type := old.reference_type;
    new.reference_id := old.reference_id;
    new.notes := old.notes;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
  end if;
  return new;
end;
$$;

create trigger stock_movements_prepare
before insert on public.stock_movements
for each row execute function private.prepare_stock_movement_row();

create trigger stock_movements_audit
after insert on public.stock_movements
for each row execute function private.write_audit_event();

alter table public.stock_movements enable row level security;

-- Stock movements are append-only: INSERT only, no UPDATE or DELETE.

create policy stock_movements_select on public.stock_movements
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('inventory:read'))
);

create policy stock_movements_insert on public.stock_movements
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('inventory:create'))
);

revoke all on public.stock_movements from authenticated, anon;
grant select on public.stock_movements to authenticated;
grant insert (
  hospital_id, item_id, batch_id, location_id, movement_type, quantity,
  reference_type, reference_id, notes
) on public.stock_movements to authenticated;

-- Pharmacy dispensing: link prescriptions to stock movements.

create table public.dispensations (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  prescription_id uuid not null references public.prescriptions (id),
  prescription_item_id uuid not null references public.prescription_items (id),
  stock_movement_id uuid not null references public.stock_movements (id),
  dispensed_at timestamptz not null default now(),
  dispensed_by uuid not null references public.profiles (user_id),
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);

create index dispensations_hospital_prescription_idx
  on public.dispensations (hospital_id, prescription_id, dispensed_at desc);

create or replace function private.prepare_dispensation_row()
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
    new.prescription_id := old.prescription_id;
    new.prescription_item_id := old.prescription_item_id;
    new.stock_movement_id := old.stock_movement_id;
    new.dispensed_at := old.dispensed_at;
    new.dispensed_by := old.dispensed_by;
    new.notes := old.notes;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_by := coalesce(auth.uid(), old.updated_by);
    new.version := old.version + 1;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger dispensations_prepare
before insert or update on public.dispensations
for each row execute function private.prepare_dispensation_row();

create trigger dispensations_audit
after insert or update or delete on public.dispensations
for each row execute function private.write_audit_event();

alter table public.dispensations enable row level security;

create policy dispensations_select on public.dispensations
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('pharmacy:read'))
);

create policy dispensations_insert on public.dispensations
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('pharmacy:create'))
);

create policy dispensations_update on public.dispensations
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('pharmacy:update'))
)
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('pharmacy:update'))
);

revoke all on public.dispensations from authenticated, anon;
grant select on public.dispensations to authenticated;
grant insert (
  hospital_id, prescription_id, prescription_item_id, stock_movement_id, dispensed_by, notes
) on public.dispensations to authenticated;
grant update (
  notes
) on public.dispensations to authenticated;

-- Stock adjustments: manual inventory corrections.

create table public.stock_adjustments (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  movement_id uuid not null references public.stock_movements (id),
  reason text not null check (btrim(reason) <> ''),
  approved_by uuid references auth.users (id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

create index stock_adjustments_hospital_idx
  on public.stock_adjustments (hospital_id, created_at desc);

alter table public.stock_adjustments enable row level security;

create policy stock_adjustments_select on public.stock_adjustments
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('inventory:read'))
);

create policy stock_adjustments_insert on public.stock_adjustments
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('inventory:create'))
);

revoke all on public.stock_adjustments from authenticated, anon;
grant select on public.stock_adjustments to authenticated;
grant insert (
  hospital_id, movement_id, reason, approved_by, approved_at
) on public.stock_adjustments to authenticated;
